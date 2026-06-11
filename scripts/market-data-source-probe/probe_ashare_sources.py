#!/usr/bin/env python3
"""Local A-share data source feasibility probe.

This script is diagnostics-only. It does not call project APIs, does not write
to Supabase, and does not participate in the Market Brief production flow.
"""

from __future__ import annotations

import argparse
import contextlib
import datetime as dt
import importlib.metadata
import inspect
import json
import platform
import re
import signal
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections.abc import Callable
from typing import Any


USER_AGENT = "personal-workstation-market-data-source-probe/2N-C0"
MAX_ERROR_LENGTH = 420
MAX_TEXT_SCAN_LENGTH = 20000

FIELD_GROUPS = {
    "count": [
        "LIST_NUM",
        "zqsl",
        "证券数量",
        "数量",
        "挂牌数",
        "上市",
        "listed",
    ],
    "turnover": [
        "TRADE_AMT",
        "cjje",
        "成交金额",
        "成交额",
        "amount",
        "turnover",
    ],
    "market_value": [
        "TOTAL_VALUE",
        "sjzz",
        "总市值",
        "市价总值",
        "market value",
    ],
}

BREADTH_KEYWORDS = ["上涨", "下跌", "涨跌", "涨家", "跌家", "advance", "decline"]
SECTOR_KEYWORDS = ["行业", "sector", "industry"]
INDEX_KEYWORDS = ["指数", "上证指数", "深证成指", "399001", "000001"]


class ProbeTimeoutError(Exception):
    """Raised when one source attempt exceeds the configured timeout."""


@contextlib.contextmanager
def timeout_after(timeout_ms: int):
    """Best-effort wall clock timeout for a single probe attempt on Unix-like hosts."""

    if not hasattr(signal, "SIGALRM") or not hasattr(signal, "setitimer"):
        yield
        return

    seconds = max(timeout_ms / 1000, 0.001)
    previous_handler = signal.getsignal(signal.SIGALRM)
    previous_timer = signal.setitimer(signal.ITIMER_REAL, 0)

    def _handle_timeout(_signum: int, _frame: Any) -> None:
        raise ProbeTimeoutError(f"timed out after {timeout_ms} ms")

    signal.signal(signal.SIGALRM, _handle_timeout)
    signal.setitimer(signal.ITIMER_REAL, seconds)
    try:
        yield
    finally:
        signal.setitimer(signal.ITIMER_REAL, 0)
        signal.signal(signal.SIGALRM, previous_handler)
        if previous_timer[0] > 0:
            signal.setitimer(signal.ITIMER_REAL, previous_timer[0], previous_timer[1])


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Probe A-share market data sources for diagnostics only.",
    )
    parser.add_argument("--date", required=True, help="Target trade date in YYYY-MM-DD format.")
    parser.add_argument("--repeat", type=int, default=3, help="Attempts per source. Default: 3.")
    parser.add_argument("--timeout-ms", type=int, default=10000, help="Timeout per attempt. Default: 10000.")
    parser.add_argument("--output", help="Write JSON to this path instead of stdout.")
    args = parser.parse_args()

    try:
        dt.date.fromisoformat(args.date)
    except ValueError as exc:
        raise SystemExit(f"--date must be YYYY-MM-DD: {args.date}") from exc

    if args.repeat < 1:
        raise SystemExit("--repeat must be >= 1")
    if args.timeout_ms < 500:
        raise SystemExit("--timeout-ms must be >= 500")

    return args


def safe_error(exc: BaseException) -> str:
    message = str(exc).strip() or exc.__class__.__name__
    message = re.sub(r"\s+", " ", message)
    return f"{exc.__class__.__name__}: {message}"[:MAX_ERROR_LENGTH]


def akshare_version() -> str:
    try:
        return importlib.metadata.version("akshare")
    except importlib.metadata.PackageNotFoundError:
        return "not_installed"


def import_akshare() -> Any:
    try:
        import akshare as ak  # type: ignore[import-not-found]

        return ak
    except Exception as exc:  # pragma: no cover - depends on local environment
        raise RuntimeError("akshare is not installed or could not be imported for local diagnostics") from exc


def call_akshare_stock_sse_summary(_target_date: str, _timeout_ms: int) -> Any:
    ak = import_akshare()
    return ak.stock_sse_summary()


def call_akshare_stock_szse_summary(target_date: str, _timeout_ms: int) -> Any:
    ak = import_akshare()
    func = ak.stock_szse_summary
    yyyymmdd = target_date.replace("-", "")

    try:
        signature = inspect.signature(func)
        if "date" in signature.parameters:
            return func(date=yyyymmdd)
    except (TypeError, ValueError):
        pass

    try:
        return func(date=yyyymmdd)
    except TypeError:
        return func()


def http_get_text(url: str, timeout_ms: int, referer: str | None = None) -> str:
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/json,text/plain,*/*",
    }
    if referer:
        headers["Referer"] = referer

    request = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=max(timeout_ms / 1000, 1)) as response:
            charset = response.headers.get_content_charset() or "utf-8"
            return response.read().decode(charset, errors="replace")
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")[:240]
        raise RuntimeError(f"HTTP {exc.code} from {url}: {body}") from exc


def parse_json_or_jsonp(text: str) -> Any:
    stripped = text.strip().lstrip("\ufeff")
    try:
        return json.loads(stripped)
    except json.JSONDecodeError:
        pass

    first_brace = stripped.find("{")
    first_bracket = stripped.find("[")
    candidates = [pos for pos in (first_brace, first_bracket) if pos >= 0]
    if not candidates:
        raise ValueError("response did not contain JSON object or array")

    start = min(candidates)
    end = max(stripped.rfind("}"), stripped.rfind("]"))
    if end <= start:
        raise ValueError("response contained incomplete JSON payload")

    return json.loads(stripped[start : end + 1])


def call_sse_official_daily_stock(target_date: str, timeout_ms: int) -> Any:
    params = {
        "jsonCallBack": "",
        "isPagination": "false",
        "sqlId": "COMMON_SSE_SJ_GPSJ_CJGK_MRGK_C",
        "PRODUCT_CODE": "01,02,03,11,17",
        "type": "inParams",
        "SEARCH_DATE": target_date,
        "_": str(int(time.time() * 1000)),
    }
    url = "https://query.sse.com.cn/commonQuery.do?" + urllib.parse.urlencode(params)
    text = http_get_text(url, timeout_ms, "https://www.sse.com.cn/market/stockdata/overview/day/")
    return parse_json_or_jsonp(text)


def call_szse_show_report(catalog_id: str, target_date: str, timeout_ms: int) -> Any:
    params = {
        "SHOWTYPE": "JSON",
        "CATALOGID": catalog_id,
        "txtQueryDate": target_date,
    }
    url = "https://www.szse.cn/api/report/ShowReport/data?" + urllib.parse.urlencode(params)
    text = http_get_text(url, timeout_ms, "https://www.szse.cn/market/overview/index.html")
    return parse_json_or_jsonp(text)


def call_szse_official_market_overview(target_date: str, timeout_ms: int) -> Any:
    return call_szse_show_report("1803_sczm", target_date, timeout_ms)


def call_szse_official_daily_stock(target_date: str, timeout_ms: int) -> Any:
    return call_szse_show_report("scsj_gprdgk_after", target_date, timeout_ms)


def call_eastmoney_optional_index_snapshot(_target_date: str, timeout_ms: int) -> Any:
    params = {
        "fltt": "2",
        "secids": "1.000001,0.399001",
        "fields": "f12,f14,f2,f3,f4,f5,f6,f17,f18",
    }
    url = "https://push2.eastmoney.com/api/qt/ulist.np/get?" + urllib.parse.urlencode(params)
    text = http_get_text(url, timeout_ms, "https://quote.eastmoney.com/")
    return parse_json_or_jsonp(text)


def is_scalar(value: Any) -> bool:
    return value is None or isinstance(value, (str, int, float, bool))


def is_row_dict(value: dict[str, Any]) -> bool:
    structural_keys = {"metadata", "conditions", "cols", "colStyle", "data", "pageHelp"}
    if structural_keys.intersection(value.keys()):
        return False
    scalar_count = sum(1 for item in value.values() if is_scalar(item))
    return scalar_count >= 2


def collect_rows(value: Any) -> list[dict[str, Any]]:
    if hasattr(value, "head") and hasattr(value, "to_dict"):
        try:
            records = value.head(20).to_dict(orient="records")
            return [record for record in records if isinstance(record, dict)]
        except Exception:
            return []

    rows: list[dict[str, Any]] = []

    def walk(node: Any) -> None:
        if isinstance(node, dict):
            if is_row_dict(node):
                rows.append(node)
                return
            walked_named_child = False
            for key in ("result", "data", "diff", "records", "rows", "items", "list"):
                if key in node:
                    walk(node[key])
                    walked_named_child = True
            if walked_named_child:
                return
            for key, child in node.items():
                if key not in {"metadata", "conditions", "cols", "colStyle"}:
                    if isinstance(child, (dict, list)):
                        walk(child)
        elif isinstance(node, list):
            for child in node:
                walk(child)

    walk(value)
    return rows


def collect_column_labels(value: Any, rows: list[dict[str, Any]]) -> list[str]:
    columns: list[str] = []

    if hasattr(value, "columns"):
        try:
            columns.extend(str(column) for column in value.columns)
        except Exception:
            pass

    for row in rows:
        columns.extend(str(key) for key in row.keys())

    def walk(node: Any) -> None:
        if isinstance(node, dict):
            cols = node.get("cols")
            if isinstance(cols, dict):
                columns.extend(str(key) for key in cols.keys())
                columns.extend(strip_html(str(label)) for label in cols.values())
            metadata = node.get("metadata")
            if isinstance(metadata, dict):
                walk(metadata)
            for child in node.values():
                if isinstance(child, (dict, list)):
                    walk(child)
        elif isinstance(node, list):
            for child in node:
                walk(child)

    walk(value)

    deduped: list[str] = []
    seen: set[str] = set()
    for column in columns:
        normalized = column.strip()
        if normalized and normalized not in seen:
            deduped.append(normalized)
            seen.add(normalized)
    return deduped[:40]


def strip_html(value: str) -> str:
    return re.sub(r"<[^>]+>", "", value).strip()


def json_scan_text(value: Any) -> str:
    if hasattr(value, "head") and hasattr(value, "to_json"):
        try:
            return value.head(20).to_json(force_ascii=False, date_format="iso")[:MAX_TEXT_SCAN_LENGTH]
        except Exception:
            pass
    return json.dumps(value, ensure_ascii=False, default=str)[:MAX_TEXT_SCAN_LENGTH]


def truncate_sample(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(key): truncate_sample(child) for key, child in list(value.items())[:16]}
    if isinstance(value, list):
        return [truncate_sample(child) for child in value[:3]]
    if isinstance(value, str):
        return strip_html(value)[:120]
    return value


def field_group_present(columns: list[str], scan_text: str, group: str) -> bool:
    haystack = " ".join(columns) + " " + scan_text
    haystack_lower = haystack.lower()
    return any(keyword.lower() in haystack_lower for keyword in FIELD_GROUPS[group])


def required_fields_present(columns: list[str], scan_text: str) -> bool:
    return all(field_group_present(columns, scan_text, group) for group in FIELD_GROUPS)


def contains_any(columns: list[str], scan_text: str, keywords: list[str]) -> bool:
    haystack = (" ".join(columns) + " " + scan_text).lower()
    return any(keyword.lower() in haystack for keyword in keywords)


def covers_target_date(value: Any, target_date: str) -> bool:
    scan_text = json_scan_text(value)
    compact_date = target_date.replace("-", "")
    return target_date in scan_text or compact_date in scan_text


def summarize_payload(value: Any, target_date: str) -> dict[str, Any]:
    rows = collect_rows(value)
    columns = collect_column_labels(value, rows)
    scan_text = json_scan_text(value)
    sample_fields = truncate_sample(rows[0]) if rows else truncate_sample(value)
    try:
        row_count = len(value.index) if hasattr(value, "index") else len(rows)
    except Exception:
        row_count = len(rows)

    return {
        "rows": row_count,
        "columns": columns,
        "covers_target_date": covers_target_date(value, target_date),
        "required_fields_present": required_fields_present(columns, scan_text),
        "sample_fields": sample_fields,
        "has_indices": contains_any(columns, scan_text, INDEX_KEYWORDS),
        "has_turnover": field_group_present(columns, scan_text, "turnover"),
        "has_market_breadth": contains_any(columns, scan_text, BREADTH_KEYWORDS),
        "has_sectors": contains_any(columns, scan_text, SECTOR_KEYWORDS),
    }


def build_sources() -> list[dict[str, Any]]:
    return [
        {
            "id": "akshare_stock_sse_summary",
            "provider": "akshare",
            "upstream": "sse",
            "kind": "wrapper_diagnostic",
            "date_mode": "latest_or_upstream_default",
            "runner": call_akshare_stock_sse_summary,
        },
        {
            "id": "akshare_stock_szse_summary",
            "provider": "akshare",
            "upstream": "szse",
            "kind": "wrapper_diagnostic",
            "date_mode": "target_date_if_supported",
            "runner": call_akshare_stock_szse_summary,
        },
        {
            "id": "sse_official_daily_stock_summary",
            "provider": "official_exchange",
            "upstream": "sse",
            "kind": "official_direct_probe",
            "date_mode": "target_date",
            "runner": call_sse_official_daily_stock,
        },
        {
            "id": "szse_official_market_overview",
            "provider": "official_exchange",
            "upstream": "szse",
            "kind": "official_direct_probe",
            "date_mode": "target_date",
            "runner": call_szse_official_market_overview,
        },
        {
            "id": "szse_official_daily_stock_summary",
            "provider": "official_exchange",
            "upstream": "szse",
            "kind": "official_direct_probe",
            "date_mode": "target_date",
            "runner": call_szse_official_daily_stock,
        },
        {
            "id": "eastmoney_optional_index_snapshot",
            "provider": "eastmoney",
            "upstream": "eastmoney",
            "kind": "optional_fallback_probe",
            "date_mode": "current_snapshot_only",
            "runner": call_eastmoney_optional_index_snapshot,
        },
    ]


def probe_source(source: dict[str, Any], target_date: str, repeat: int, timeout_ms: int) -> dict[str, Any]:
    attempts: list[dict[str, Any]] = []
    runner: Callable[[str, int], Any] = source["runner"]

    for attempt in range(1, repeat + 1):
        started = time.perf_counter()
        try:
            with timeout_after(timeout_ms):
                payload = runner(target_date, timeout_ms)
            latency_ms = int((time.perf_counter() - started) * 1000)
            summary = summarize_payload(payload, target_date)
            status = classify_attempt(source, summary)
            error = attempt_error(status, source, summary)
            attempts.append(
                {
                    "attempt": attempt,
                    "status": status,
                    "latency_ms": latency_ms,
                    "rows": summary["rows"],
                    "covers_target_date": summary["covers_target_date"],
                    "required_fields_present": summary["required_fields_present"],
                    "error": error,
                    "summary": summary,
                }
            )
        except Exception as exc:
            latency_ms = int((time.perf_counter() - started) * 1000)
            attempts.append(
                {
                    "attempt": attempt,
                    "status": "failed",
                    "latency_ms": latency_ms,
                    "rows": 0,
                    "covers_target_date": False,
                    "required_fields_present": False,
                    "error": safe_error(exc),
                }
            )

    return aggregate_source(source, attempts, repeat)


def classify_attempt(source: dict[str, Any], summary: dict[str, Any]) -> str:
    if summary["rows"] <= 0:
        return "failed"
    if not summary["required_fields_present"]:
        return "partial"
    if source["date_mode"] == "target_date" and not summary["covers_target_date"]:
        return "partial"
    if source["date_mode"] == "target_date_if_supported" and not summary["covers_target_date"]:
        return "partial"
    if source["date_mode"] in {"latest_or_upstream_default", "current_snapshot_only"}:
        return "partial"
    return "ok"


def attempt_error(status: str, source: dict[str, Any], summary: dict[str, Any]) -> str | None:
    if status == "ok":
        return None
    reasons: list[str] = []
    if summary["rows"] <= 0:
        reasons.append("no data rows returned")
    if not summary["required_fields_present"]:
        reasons.append("required count/turnover/market value fields not all present")
    if source["date_mode"] == "target_date" and not summary["covers_target_date"]:
        reasons.append("target date was not confirmed in payload")
    if source["date_mode"] == "target_date_if_supported" and not summary["covers_target_date"]:
        reasons.append("AKShare wrapper did not confirm target-date coverage")
    if source["date_mode"] == "latest_or_upstream_default":
        reasons.append("AKShare wrapper did not expose target-date guarantee")
    if source["date_mode"] == "current_snapshot_only":
        reasons.append("optional snapshot source cannot validate historical target date")
    return "; ".join(reasons) if reasons else "partial source result"


def aggregate_source(source: dict[str, Any], attempts: list[dict[str, Any]], repeat: int) -> dict[str, Any]:
    usable_attempts = [attempt for attempt in attempts if attempt["status"] in {"ok", "partial"}]
    ok_attempts = [attempt for attempt in attempts if attempt["status"] == "ok"]
    failed_attempts = [attempt for attempt in attempts if attempt["status"] == "failed"]
    representative = usable_attempts[0] if usable_attempts else attempts[0]
    representative_summary = representative.get("summary", {})
    usable_latencies = [attempt["latency_ms"] for attempt in usable_attempts] or [attempt["latency_ms"] for attempt in attempts]
    latency_ms = int(sum(usable_latencies) / len(usable_latencies)) if usable_latencies else None

    if ok_attempts and len(ok_attempts) == repeat:
        status = "ok"
    elif usable_attempts:
        status = "partial"
    else:
        status = "failed"

    errors = []
    for attempt in attempts:
        if attempt.get("error") and attempt["error"] not in errors:
            errors.append(attempt["error"])

    return {
        "id": source["id"],
        "provider": source["provider"],
        "upstream": source["upstream"],
        "kind": source["kind"],
        "date_mode": source["date_mode"],
        "status": status,
        "success_rate": round(len(usable_attempts) / repeat, 3),
        "ok_rate": round(len(ok_attempts) / repeat, 3),
        "latency_ms": latency_ms,
        "rows": representative_summary.get("rows", representative.get("rows", 0)),
        "columns": representative_summary.get("columns", []),
        "covers_target_date": any(attempt.get("covers_target_date") for attempt in usable_attempts),
        "required_fields_present": any(attempt.get("required_fields_present") for attempt in usable_attempts),
        "sample_fields": representative_summary.get("sample_fields", {}),
        "error": "; ".join(errors)[:MAX_ERROR_LENGTH] if status != "ok" and errors else None,
        "attempts": [
            {
                "attempt": attempt["attempt"],
                "status": attempt["status"],
                "latency_ms": attempt["latency_ms"],
                "rows": attempt["rows"],
                "covers_target_date": attempt["covers_target_date"],
                "required_fields_present": attempt["required_fields_present"],
                "error": attempt.get("error"),
            }
            for attempt in attempts
        ],
        "_coverage_flags": {
            "indices": any(attempt.get("summary", {}).get("has_indices") for attempt in usable_attempts),
            "turnover": any(attempt.get("summary", {}).get("has_turnover") for attempt in usable_attempts),
            "market_breadth": any(attempt.get("summary", {}).get("has_market_breadth") for attempt in usable_attempts),
            "sectors": any(attempt.get("summary", {}).get("has_sectors") for attempt in usable_attempts),
        },
        "_failed_attempts": len(failed_attempts),
    }


def coverage_status(sources: list[dict[str, Any]], key: str) -> str:
    official_or_ak = [
        source
        for source in sources
        if source["provider"] in {"official_exchange", "akshare"} and source["status"] in {"ok", "partial"}
    ]
    optional = [
        source
        for source in sources
        if source["provider"] not in {"official_exchange", "akshare"} and source["status"] in {"ok", "partial"}
    ]

    if any(source["_coverage_flags"][key] for source in official_or_ak):
        return "ok"
    if any(source["_coverage_flags"][key] for source in optional):
        return "partial"
    return "missing"


def build_recommendation(sources: list[dict[str, Any]]) -> dict[str, Any]:
    ak_sources = [source for source in sources if source["provider"] == "akshare"]
    official_sources = [source for source in sources if source["provider"] == "official_exchange"]

    ak_ready = (
        len(ak_sources) >= 2
        and all(source["status"] == "ok" for source in ak_sources)
        and all(source["covers_target_date"] for source in ak_sources)
        and all(source["required_fields_present"] for source in ak_sources)
    )
    official_ready = (
        any(source["upstream"] == "sse" and source["status"] in {"ok", "partial"} for source in official_sources)
        and any(source["upstream"] == "szse" and source["status"] in {"ok", "partial"} for source in official_sources)
        and any(source["covers_target_date"] for source in official_sources)
        and any(source["required_fields_present"] for source in official_sources)
    )

    if official_ready and not ak_ready:
        reason = (
            "Official SSE/SZSE probes returned date-scoped market summary fields; AKShare remains a local "
            "wrapper diagnostic until repeated target-date coverage is stable."
        )
    elif official_ready and ak_ready:
        reason = (
            "Both official direct sources and AKShare wrappers passed this local probe; prefer official direct "
            "sources for production design and keep AKShare as a secondary diagnostic."
        )
    elif ak_ready:
        reason = (
            "AKShare wrappers passed this local probe, but official direct exchange sources did not both pass; "
            "do not adopt AKShare as the sole production source without more dates and network environments."
        )
    else:
        reason = (
            "Core A-share source coverage is not stable enough yet; keep material package collection manual or "
            "CSV-assisted while continuing official-source validation."
        )

    return {
        "can_use_akshare_for_core_market_package": ak_ready,
        "can_use_official_exchange_sources": official_ready,
        "reason": reason,
    }


def strip_internal_fields(sources: list[dict[str, Any]]) -> list[dict[str, Any]]:
    public_sources: list[dict[str, Any]] = []
    for source in sources:
        public_source = {key: value for key, value in source.items() if not key.startswith("_")}
        public_sources.append(public_source)
    return public_sources


def run_probe(target_date: str, repeat: int, timeout_ms: int) -> dict[str, Any]:
    sources = [probe_source(source, target_date, repeat, timeout_ms) for source in build_sources()]
    coverage = {
        "indices": coverage_status(sources, "indices"),
        "turnover": coverage_status(sources, "turnover"),
        "market_breadth": coverage_status(sources, "market_breadth"),
        "sectors": coverage_status(sources, "sectors"),
    }

    return {
        "checked_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "target_date": target_date,
        "environment": {
            "python_version": platform.python_version(),
            "akshare_version": akshare_version(),
            "network": "local",
        },
        "sources": strip_internal_fields(sources),
        "coverage": coverage,
        "recommendation": build_recommendation(sources),
    }


def main() -> int:
    args = parse_args()
    result = run_probe(args.date, args.repeat, args.timeout_ms)
    encoded = json.dumps(result, ensure_ascii=False, indent=2)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as file:
            file.write(encoded)
            file.write("\n")
    else:
        print(encoded)

    return 0


if __name__ == "__main__":
    sys.exit(main())
