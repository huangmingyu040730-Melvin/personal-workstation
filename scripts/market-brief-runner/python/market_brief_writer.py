from __future__ import annotations

from typing import Any


def build_market_brief_payload(job: dict[str, Any], snapshot: dict[str, Any]) -> dict[str, Any]:
    market = job.get("market") or snapshot.get("meta", {}).get("market") or "A股"
    brief_date = job.get("brief_date") or snapshot.get("meta", {}).get("brief_date")
    title = f"{market}市场收评简报｜{brief_date}"
    summary = build_summary(snapshot)

    return {
        "job_id": job["job_id"],
        "brief_date": brief_date,
        "market": market,
        "title": title,
        "summary": summary,
        "markdown_content": build_markdown(title, summary, snapshot),
        "source_snapshot": snapshot,
        "tags": ["市场简报", market, "akshare", "真实数据第一版", "待复核"],
        "data_sources": data_sources(snapshot),
    }


def build_summary(snapshot: dict[str, Any]) -> str:
    indices = snapshot.get("indices") or []
    breadth = snapshot.get("market_breadth") or {}
    sectors = snapshot.get("sectors") or {}
    gainers = sectors.get("top_gainers") or []
    warnings = snapshot.get("meta", {}).get("warnings") or []

    index_text = "宽基指数数据暂缺"
    if indices:
        positive = [item for item in indices if _number(item.get("change_pct")) is not None and item["change_pct"] > 0]
        negative = [item for item in indices if _number(item.get("change_pct")) is not None and item["change_pct"] < 0]
        index_text = f"宽基指数中 {len(positive)} 个上涨、{len(negative)} 个下跌"

    breadth_text = "市场宽度数据暂缺"
    if breadth.get("up_count") is not None and breadth.get("down_count") is not None:
        breadth_text = f"上涨 {breadth.get('up_count')} 家、下跌 {breadth.get('down_count')} 家"

    sector_text = "行业板块数据暂缺"
    if gainers:
        sector_text = "涨幅居前方向包括：" + "、".join(item["name"] for item in gainers[:3])

    warning_text = f"；本次存在 {len(warnings)} 条数据警告" if warnings else ""
    return f"{index_text}，{breadth_text}，{sector_text}{warning_text}。"


def build_markdown(title: str, summary: str, snapshot: dict[str, Any]) -> str:
    meta = snapshot.get("meta") or {}
    runner_name = meta.get("runner_name") or "akshare-runner"
    warnings = meta.get("warnings") or []

    return "\n".join(
        [
            f"# {title}",
            "",
            f"> 本简报由 {runner_name} 生成，当前为真实行情数据接入第一版；内容仅供研究记录，不构成投资建议。",
            "",
            "## 一、摘要",
            "",
            summary,
            "",
            "## 二、市场概览",
            "",
            render_market_overview(snapshot),
            "",
            "## 三、宽基指数表现",
            "",
            render_indices(snapshot.get("indices") or [], warnings),
            "",
            "## 四、市场宽度",
            "",
            render_market_breadth(snapshot.get("market_breadth") or {}),
            "",
            "## 五、行业板块表现",
            "",
            render_sectors(snapshot.get("sectors") or {}),
            "",
            "## 六、市场热点",
            "",
            render_hot_topics(snapshot.get("hot_topics") or []),
            "",
            "## 七、资金流向",
            "",
            "本阶段暂未接入北向、ETF、两融或主力资金等资金流向数据。",
            "",
            "## 八、风险提示",
            "",
            render_risk_alerts(warnings),
            "",
            "## 九、明日关注",
            "",
            "建议继续跟踪主要宽基指数、成交额变化、市场宽度修复情况，以及领涨行业能否延续。以上仅为研究记录，不构成投资建议。",
            "",
            "## 数据来源",
            "",
            render_data_sources(snapshot),
            "",
        ]
    )


def render_market_overview(snapshot: dict[str, Any]) -> str:
    breadth = snapshot.get("market_breadth") or {}
    turnover = breadth.get("total_turnover")
    lines = []

    if turnover is not None:
        lines.append(f"- 全市场成交额约 {_format_amount(turnover)}。")
    else:
        lines.append("- 全市场成交额暂缺。")

    if breadth.get("up_count") is not None and breadth.get("down_count") is not None:
        lines.append(f"- 上涨 {breadth.get('up_count')} 家，下跌 {breadth.get('down_count')} 家，平盘 {breadth.get('flat_count') or 0} 家。")
    else:
        lines.append("- 上涨 / 下跌 / 平盘家数暂缺。")

    return "\n".join(lines)


def render_indices(indices: list[dict[str, Any]], warnings: list[str]) -> str:
    if not indices:
        return "宽基指数数据暂缺；真实数据源可能不可用，或当前 AkShare 接口未返回目标指数。"

    lines = ["| 指数 | 收盘 | 涨跌幅 | 成交额 | 数据源 |", "| --- | ---: | ---: | ---: | --- |"]
    for item in indices:
        lines.append(
            f"| {item.get('name') or '-'} | {_format_number(item.get('close'))} | {_format_pct(item.get('change_pct'))} | {_format_amount(item.get('turnover'))} | {item.get('source') or '-'} |"
        )
    missing = [warning for warning in warnings if warning.startswith("Index data missing")]
    if missing:
        lines.extend(["", "暂缺指数：" + "；".join(warning.replace("Index data missing: ", "") for warning in missing)])
    return "\n".join(lines)


def render_market_breadth(breadth: dict[str, Any]) -> str:
    rows = [
        ("上涨家数", breadth.get("up_count")),
        ("下跌家数", breadth.get("down_count")),
        ("平盘家数", breadth.get("flat_count")),
        ("涨停数量", breadth.get("limit_up_count")),
        ("跌停数量", breadth.get("limit_down_count")),
        ("市场成交额", _format_amount(breadth.get("total_turnover")) if breadth.get("total_turnover") is not None else None),
    ]
    return "\n".join(f"- {label}：{value if value is not None else '暂缺'}" for label, value in rows)


def render_sectors(sectors: dict[str, Any]) -> str:
    gainers = sectors.get("top_gainers") or []
    losers = sectors.get("top_losers") or []
    if not gainers and not losers:
        return "行业 / 板块表现数据暂缺；本阶段先以 AkShare 可稳定获取的行业板块为准，后续再做 GICS 标准映射。"

    lines = ["### 涨幅居前", "", render_sector_table(gainers), "", "### 跌幅居前", "", render_sector_table(losers)]
    return "\n".join(lines)


def render_sector_table(items: list[dict[str, Any]]) -> str:
    if not items:
        return "暂缺。"
    lines = ["| 板块 | 涨跌幅 | 成交额 | 领涨股票 |", "| --- | ---: | ---: | --- |"]
    for item in items:
        lines.append(
            f"| {item.get('name') or '-'} | {_format_pct(item.get('change_pct'))} | {_format_amount(item.get('turnover'))} | {item.get('leading_stock') or '-'} |"
        )
    return "\n".join(lines)


def render_hot_topics(hot_topics: list[dict[str, Any]]) -> str:
    if not hot_topics:
        return "本阶段不做新闻爬虫；热点方向暂未从行业 / 概念板块涨幅榜生成。"
    return "\n".join(f"- {item.get('name')}（{_format_pct(item.get('change_pct'))}，来源：{item.get('source') or '-'}）" for item in hot_topics)


def render_risk_alerts(warnings: list[str]) -> str:
    lines = [
        "- 本简报为数据接入第一版，依赖 AkShare 接口返回结果，需人工复核。",
        "- 不输出个股推荐、买入 / 卖出建议或投资建议。",
    ]
    if warnings:
        lines.append("- 数据警告：" + "；".join(warnings[:5]))
    return "\n".join(lines)


def render_data_sources(snapshot: dict[str, Any]) -> str:
    sources = data_sources(snapshot)
    return "\n".join(f"- {source}" for source in sources)


def data_sources(snapshot: dict[str, Any]) -> list[str]:
    sources = set()
    for item in snapshot.get("indices") or []:
        if item.get("source"):
            sources.add(item["source"])
    for group in ("top_gainers", "top_losers"):
        for item in (snapshot.get("sectors") or {}).get(group) or []:
            if item.get("source"):
                sources.add(item["source"])
    for item in snapshot.get("hot_topics") or []:
        if item.get("source"):
            sources.add(item["source"])
    if snapshot.get("market_breadth", {}).get("up_count") is not None:
        sources.add("akshare.stock_zh_a_spot_em")
    return sorted(sources) or ["AkShare 暂不可用，使用 fallback source snapshot"]


def _format_pct(value: Any) -> str:
    number = _number(value)
    return "暂缺" if number is None else f"{number:.2f}%"


def _format_amount(value: Any) -> str:
    number = _number(value)
    if number is None:
        return "暂缺"
    return f"{number / 100000000:.2f} 亿"


def _format_number(value: Any) -> str:
    number = _number(value)
    return "暂缺" if number is None else f"{number:.2f}"


def _number(value: Any) -> float | None:
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None
