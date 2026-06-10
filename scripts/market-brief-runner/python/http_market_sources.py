from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from typing import Any


HTTP_TARGET_INDICES = [
    {"name": "上证指数", "code": "000001.SH", "secid": "1.000001"},
    {"name": "深证成指", "code": "399001.SZ", "secid": "0.399001"},
    {"name": "创业板指", "code": "399006.SZ", "secid": "0.399006"},
    {"name": "沪深300", "code": "000300.SH", "secid": "1.000300"},
    {"name": "中证500", "code": "000905.SH", "secid": "1.000905"},
    {"name": "中证1000", "code": "000852.SH", "secid": "1.000852"},
    {"name": "科创50", "code": "000688.SH", "secid": "1.000688"},
]


def fetch_indices_from_http_sources(
    brief_date: str,
    warnings: list[str],
    *,
    is_historical: bool = False,
) -> list[dict[str, Any]]:
    if is_historical:
        warnings.append("HTTP index source only supports latest snapshot; skipped for historical brief_date.")
        return []

    fields = "f12,f14,f2,f3,f4,f5,f6"
    secids = ",".join(item["secid"] for item in HTTP_TARGET_INDICES)
    query = urllib.parse.urlencode({"fltt": "2", "invt": "2", "fields": fields, "secids": secids})
    url = f"https://push2.eastmoney.com/api/qt/ulist.np/get?{query}"
    request = urllib.request.Request(
        url,
        headers={
            "accept": "application/json,text/plain,*/*",
            "user-agent": "personal-workstation-market-brief-runner/1.0",
        },
        method="GET",
    )

    try:
        with urllib.request.urlopen(request, timeout=20) as response:  # noqa: S310
            body = response.read().decode("utf-8")
    except (urllib.error.URLError, TimeoutError) as exc:
        warnings.append(f"HTTP index source failed: {_safe_error(exc)}")
        return []

    try:
        parsed = json.loads(body)
        rows = parsed.get("data", {}).get("diff") or []
    except Exception as exc:  # noqa: BLE001
        warnings.append(f"HTTP index source parse failed: {_safe_error(exc)}")
        return []

    by_code = {str(row.get("f12")): row for row in rows if isinstance(row, dict)}
    normalized: list[dict[str, Any]] = []

    for target in HTTP_TARGET_INDICES:
        raw_code = target["code"].split(".")[0]
        row = by_code.get(raw_code)
        if not row:
            warnings.append(f"HTTP index data missing: {target['name']}")
            continue
        normalized.append(
            {
                "name": target["name"],
                "code": target["code"],
                "close": _number(row.get("f2")),
                "change": _number(row.get("f4")),
                "change_pct": _number(row.get("f3")),
                "turnover": _number(row.get("f6")),
                "volume": _number(row.get("f5")),
                "source": "http.eastmoney.push2.latest",
                "as_of": brief_date,
            }
        )

    return normalized


def _number(value: Any) -> float | None:
    if value in (None, "", "-"):
        return None
    try:
        return float(str(value).replace(",", "").replace("%", ""))
    except (TypeError, ValueError):
        return None


def _safe_error(exc: Exception) -> str:
    return str(exc).replace("\n", " ")[:240]
