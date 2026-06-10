from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


TARGET_INDICES = [
    {"name": "上证指数", "aliases": ["上证指数", "000001", "000001.SH"]},
    {"name": "深证成指", "aliases": ["深证成指", "399001", "399001.SZ"]},
    {"name": "创业板指", "aliases": ["创业板指", "399006", "399006.SZ"]},
    {"name": "沪深300", "aliases": ["沪深300", "000300", "000300.SH"]},
    {"name": "中证500", "aliases": ["中证500", "000905", "000905.SH"]},
    {"name": "中证1000", "aliases": ["中证1000", "000852", "000852.SH"]},
    {"name": "中证2000", "aliases": ["中证2000", "932000", "932000.CSI"]},
    {"name": "中证红利", "aliases": ["中证红利", "000922", "000922.CSI"]},
    {"name": "科创50", "aliases": ["科创50", "000688", "000688.SH"]},
    {"name": "北证50", "aliases": ["北证50", "899050", "899050.BJ"]},
]


def fetch_a_share_market_snapshot(
    brief_date: str,
    market: str = "A股",
    runner_name: str = "akshare-runner",
    data_mode: str = "akshare",
) -> dict[str, Any]:
    generated_at = datetime.now(timezone.utc).isoformat()
    warnings: list[str] = []
    snapshot: dict[str, Any] = {
        "meta": {
            "market": market,
            "brief_date": brief_date,
            "runner_name": runner_name,
            "data_mode": data_mode,
            "generated_at": generated_at,
            "warnings": warnings,
        },
        "indices": [],
        "market_breadth": {
            "up_count": None,
            "down_count": None,
            "flat_count": None,
            "limit_up_count": None,
            "limit_down_count": None,
            "total_turnover": None,
        },
        "styles": [],
        "sectors": {"top_gainers": [], "top_losers": []},
        "hot_topics": [],
        "capital_flows": [],
        "policy_news": [],
        "risk_signals": [],
    }

    if data_mode != "akshare":
        warnings.append(f"Unsupported MARKET_BRIEF_DATA_MODE={data_mode}; using fallback snapshot.")
        return snapshot

    ak = _load_akshare(warnings)
    if ak is None:
        return snapshot

    snapshot["indices"] = fetch_indices(ak, warnings)
    snapshot["market_breadth"] = fetch_market_breadth(ak, warnings)
    sectors = fetch_sectors(ak, warnings)
    snapshot["sectors"] = sectors
    snapshot["hot_topics"] = fetch_hot_topics(ak, sectors, warnings)

    return snapshot


def has_core_market_data(snapshot: dict[str, Any]) -> bool:
    indices = snapshot.get("indices") or []
    sectors = snapshot.get("sectors") or {}
    breadth = snapshot.get("market_breadth") or {}
    return bool(
        indices
        or (sectors.get("top_gainers") or sectors.get("top_losers"))
        or any(breadth.get(key) is not None for key in ("up_count", "down_count", "total_turnover"))
    )


def fetch_indices(ak: Any, warnings: list[str]) -> list[dict[str, Any]]:
    frames = []
    for symbol in ("沪深重要指数", "上证系列指数", "深证系列指数", "中证系列指数"):
        try:
            frames.append(ak.stock_zh_index_spot_em(symbol=symbol))
        except Exception as exc:  # noqa: BLE001
            warnings.append(f"Index source {symbol} failed: {_safe_error(exc)}")

    if not frames:
        return []

    try:
        import pandas as pd

        data = pd.concat(frames, ignore_index=True)
    except Exception as exc:  # noqa: BLE001
        warnings.append(f"Index dataframe merge failed: {_safe_error(exc)}")
        return []

    rows: list[dict[str, Any]] = []
    for target in TARGET_INDICES:
        row = _find_row(data, target["aliases"])
        if row is None:
            warnings.append(f"Index data missing: {target['name']}")
            continue

        rows.append(
            {
                "name": target["name"],
                "code": _first_value(row, ["代码", "指数代码", "证券代码", "code"]),
                "close": _number(_first_value(row, ["最新价", "收盘", "close"])),
                "change": _number(_first_value(row, ["涨跌额", "涨跌", "change"])),
                "change_pct": _number(_first_value(row, ["涨跌幅", "change_pct"])),
                "turnover": _number(_first_value(row, ["成交额", "turnover"])),
                "volume": _number(_first_value(row, ["成交量", "volume"])),
                "source": "akshare.stock_zh_index_spot_em",
            }
        )

    return rows


def fetch_market_breadth(ak: Any, warnings: list[str]) -> dict[str, Any]:
    breadth = {
        "up_count": None,
        "down_count": None,
        "flat_count": None,
        "limit_up_count": None,
        "limit_down_count": None,
        "total_turnover": None,
    }

    try:
        data = ak.stock_zh_a_spot_em()
    except Exception as exc:  # noqa: BLE001
        warnings.append(f"A-share spot source failed: {_safe_error(exc)}")
        return breadth

    try:
        pct_col = _column_name(data, ["涨跌幅", "change_pct"])
        turnover_col = _column_name(data, ["成交额", "turnover"])
        pct = _numeric_series(data[pct_col]) if pct_col else None
        if pct is not None:
            breadth["up_count"] = int((pct > 0).sum())
            breadth["down_count"] = int((pct < 0).sum())
            breadth["flat_count"] = int((pct == 0).sum())
            breadth["limit_up_count"] = int((pct >= 9.8).sum())
            breadth["limit_down_count"] = int((pct <= -9.8).sum())
        if turnover_col:
            breadth["total_turnover"] = float(_numeric_series(data[turnover_col]).sum())
    except Exception as exc:  # noqa: BLE001
        warnings.append(f"Market breadth parse failed: {_safe_error(exc)}")

    return breadth


def fetch_sectors(ak: Any, warnings: list[str]) -> dict[str, list[dict[str, Any]]]:
    try:
        data = ak.stock_board_industry_name_em()
    except Exception as exc:  # noqa: BLE001
        warnings.append(f"Industry board source failed: {_safe_error(exc)}")
        return {"top_gainers": [], "top_losers": []}

    try:
        name_col = _column_name(data, ["板块名称", "名称", "name"])
        pct_col = _column_name(data, ["涨跌幅", "change_pct"])
        turnover_col = _column_name(data, ["成交额", "turnover"])
        leading_stock_col = _column_name(data, ["领涨股票", "领涨股", "leading_stock"])
        if not name_col or not pct_col:
            warnings.append("Industry board source missing required name/change_pct columns.")
            return {"top_gainers": [], "top_losers": []}

        parsed = []
        for _, row in data.iterrows():
            parsed.append(
                {
                    "name": _text(row.get(name_col)),
                    "change_pct": _number(row.get(pct_col)),
                    "turnover": _number(row.get(turnover_col)) if turnover_col else None,
                    "leading_stock": _text(row.get(leading_stock_col)) if leading_stock_col else None,
                    "source": "akshare.stock_board_industry_name_em",
                }
            )
        parsed = [item for item in parsed if item["name"] and item["change_pct"] is not None]
        top_gainers = sorted(parsed, key=lambda item: item["change_pct"], reverse=True)[:10]
        top_losers = sorted(parsed, key=lambda item: item["change_pct"])[:10]
        return {"top_gainers": top_gainers, "top_losers": top_losers}
    except Exception as exc:  # noqa: BLE001
        warnings.append(f"Industry board parse failed: {_safe_error(exc)}")
        return {"top_gainers": [], "top_losers": []}


def fetch_hot_topics(ak: Any, sectors: dict[str, list[dict[str, Any]]], warnings: list[str]) -> list[dict[str, Any]]:
    hot_topics = [
        {
            "name": item["name"],
            "change_pct": item.get("change_pct"),
            "source": "industry_top_gainers",
        }
        for item in (sectors.get("top_gainers") or [])[:5]
    ]

    try:
        concepts = ak.stock_board_concept_name_em()
        name_col = _column_name(concepts, ["板块名称", "名称", "name"])
        pct_col = _column_name(concepts, ["涨跌幅", "change_pct"])
        if name_col and pct_col:
            parsed = [
                {
                    "name": _text(row.get(name_col)),
                    "change_pct": _number(row.get(pct_col)),
                    "source": "akshare.stock_board_concept_name_em",
                }
                for _, row in concepts.iterrows()
            ]
            parsed = [item for item in parsed if item["name"] and item["change_pct"] is not None]
            hot_topics.extend(sorted(parsed, key=lambda item: item["change_pct"], reverse=True)[:5])
    except Exception as exc:  # noqa: BLE001
        warnings.append(f"Concept board source failed: {_safe_error(exc)}")

    return hot_topics[:10]


def _load_akshare(warnings: list[str]) -> Any | None:
    try:
        import akshare as ak

        return ak
    except Exception as exc:  # noqa: BLE001
        warnings.append(f"AkShare import failed: {_safe_error(exc)}")
        return None


def _find_row(data: Any, aliases: list[str]) -> Any | None:
    for _, row in data.iterrows():
        values = " ".join(_text(value) or "" for value in row.to_dict().values())
        if any(alias in values for alias in aliases):
            return row
    return None


def _first_value(row: Any, columns: list[str]) -> Any:
    for column in columns:
        if column in row and row.get(column) not in (None, ""):
            return row.get(column)
    return None


def _column_name(data: Any, candidates: list[str]) -> str | None:
    columns = list(getattr(data, "columns", []))
    for candidate in candidates:
        if candidate in columns:
            return candidate
    for column in columns:
        if any(candidate in str(column) for candidate in candidates):
            return column
    return None


def _numeric_series(series: Any) -> Any:
    import pandas as pd

    return pd.to_numeric(series, errors="coerce").fillna(0)


def _number(value: Any) -> float | None:
    if value in (None, "", "-"):
        return None
    try:
        return float(str(value).replace(",", "").replace("%", ""))
    except (TypeError, ValueError):
        return None


def _text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text or text.lower() == "nan":
        return None
    return text


def _safe_error(exc: Exception) -> str:
    return str(exc).replace("\n", " ")[:240]
