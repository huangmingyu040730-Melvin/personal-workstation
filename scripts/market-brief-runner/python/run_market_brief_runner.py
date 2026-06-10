from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from typing import Any

from market_brief_writer import build_market_brief_payload
from market_data_sources import fetch_a_share_market_snapshot, has_core_market_data


def main() -> int:
    load_dotenv_if_available()

    base_url = normalize_base_url(os.getenv("WORKSTATION_BASE_URL"))
    runner_secret = os.getenv("MARKET_BRIEF_RUNNER_SECRET")
    market = os.getenv("MARKET_BRIEF_MARKET", "A股")
    runner_name = os.getenv("MARKET_BRIEF_RUNNER_NAME", "akshare-runner")
    data_mode = os.getenv("MARKET_BRIEF_DATA_MODE", "akshare")

    if not base_url:
        print("WORKSTATION_BASE_URL is required, for example http://localhost:3000", file=sys.stderr)
        return 1

    if not runner_secret:
        print("MARKET_BRIEF_RUNNER_SECRET is required.", file=sys.stderr)
        return 1

    job: dict[str, Any] | None = None

    try:
        claim = post_json(
            base_url,
            "/api/market-briefs/skill-jobs/claim",
            {"market": market, "runner_name": runner_name},
            runner_secret,
        )
        if not claim.get("job_id"):
            print(claim.get("message") or "No queued market brief generation jobs.")
            return 0

        job = claim
        print(f"Claimed market brief job {job['job_id']} for {job['market']} {job['brief_date']}.")

        snapshot = fetch_a_share_market_snapshot(
            brief_date=job["brief_date"],
            market=job.get("market") or market,
            runner_name=runner_name,
            data_mode=data_mode,
        )

        if not has_core_market_data(snapshot):
            warnings = snapshot.get("meta", {}).get("warnings") or []
            message = "Real market data unavailable; no core index, breadth, or sector data fetched."
            if warnings:
                message = f"{message} Warnings: {'; '.join(warnings[:3])}"
            fail_job(base_url, runner_secret, job["job_id"], message)
            print(message, file=sys.stderr)
            return 1

        result_payload = build_market_brief_payload(job, snapshot)
        result = post_json(base_url, "/api/market-briefs/skill-result", result_payload, runner_secret)
        print(f"Market brief generated: {result.get('preview_url')}")
        return 0
    except Exception as exc:  # noqa: BLE001
        message = safe_error(exc)
        if job:
            fail_job(base_url, runner_secret, job["job_id"], message)
        print(message, file=sys.stderr)
        return 1


def post_json(base_url: str, path: str, payload: dict[str, Any], runner_secret: str) -> dict[str, Any]:
    request = urllib.request.Request(
        f"{base_url}{path}",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "content-type": "application/json",
            "x-market-brief-runner-secret": runner_secret,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:  # noqa: S310
            body = response.read().decode("utf-8")
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8")
        try:
            parsed = json.loads(body) if body else {}
        except json.JSONDecodeError:
            parsed = {}
        raise RuntimeError(parsed.get("error") or f"HTTP {exc.code} calling {path}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Network error calling {path}: {safe_error(exc)}") from exc


def fail_job(base_url: str, runner_secret: str, job_id: str, message: str) -> None:
    try:
        post_json(
            base_url,
            "/api/market-briefs/skill-jobs/fail",
            {"job_id": job_id, "error_message": message[:500]},
            runner_secret,
        )
    except Exception as exc:  # noqa: BLE001
        print(f"Failed to mark job as failed: {safe_error(exc)}", file=sys.stderr)


def load_dotenv_if_available() -> None:
    try:
        from dotenv import load_dotenv

        load_dotenv()
    except Exception:
        return


def normalize_base_url(value: str | None) -> str | None:
    if not value:
        return None
    return value.rstrip("/")


def safe_error(exc: Exception) -> str:
    return str(exc).replace("\n", " ")[:500]


if __name__ == "__main__":
    raise SystemExit(main())
