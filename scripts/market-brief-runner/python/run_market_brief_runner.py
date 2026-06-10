from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

from market_brief_writer import build_market_brief_payload
from market_data_sources import fetch_a_share_market_snapshot


def main() -> int:
    env_files = load_dotenv_if_available()
    args = parse_args()

    base_url = normalize_base_url(os.getenv("WORKSTATION_BASE_URL"))
    runner_secret = os.getenv("MARKET_BRIEF_RUNNER_SECRET")
    market = os.getenv("MARKET_BRIEF_MARKET", "A股")
    runner_name = os.getenv("MARKET_BRIEF_RUNNER_NAME", "akshare-runner")
    data_mode = os.getenv("MARKET_BRIEF_DATA_MODE", "akshare")

    if not base_url:
        print_missing_env_help("WORKSTATION_BASE_URL", env_files)
        return 1

    if not runner_secret:
        print_missing_env_help("MARKET_BRIEF_RUNNER_SECRET", env_files)
        return 1

    if args.diagnose:
        return diagnose_claim(base_url, runner_secret, market, runner_name)

    job: dict[str, Any] | None = None

    try:
        claim_response = post_json(
            base_url,
            "/api/market-briefs/skill-jobs/claim",
            {"market": market, "runner_name": runner_name},
            runner_secret,
            raise_for_status=False,
        )
        if not 200 <= claim_response.status < 300:
            print(format_claim_error(claim_response, base_url, market, runner_name, runner_secret), file=sys.stderr)
            return 1

        claim = claim_response.body
        if not claim.get("job_id"):
            print(
                claim.get("message")
                or "No queued market brief generation job found. This usually means the site has no queued job, or MARKET_BRIEF_GENERATOR is not external."
            )
            return 0

        job = claim
        print(f"Claimed market brief job {job['job_id']} for {job['market']} {job['brief_date']}.")

        snapshot = fetch_a_share_market_snapshot(
            brief_date=job["brief_date"],
            market=job.get("market") or market,
            runner_name=runner_name,
            data_mode=data_mode,
        )

        result_payload = build_market_brief_payload(job, snapshot)
        result = post_json(base_url, "/api/market-briefs/skill-result", result_payload, runner_secret).body
        data_quality = snapshot.get("meta", {}).get("data_quality") or "unknown"
        if data_quality == "fallback":
            print("Real market data unavailable; generated fallback market brief for manual review.")
        print(f"Market brief generated: {result.get('preview_url')}")
        return 0
    except Exception as exc:  # noqa: BLE001
        message = safe_error(exc)
        if job:
            fail_job(base_url, runner_secret, job["job_id"], message)
        else:
            print("Claim context:", file=sys.stderr)
            print(f"WORKSTATION_BASE_URL: {base_url}", file=sys.stderr)
            print(f"MARKET_BRIEF_MARKET: {market}", file=sys.stderr)
            print(f"MARKET_BRIEF_RUNNER_NAME: {runner_name}", file=sys.stderr)
            print(f"Runner secret: {describe_secret(runner_secret)}", file=sys.stderr)
        print(message, file=sys.stderr)
        return 1


def diagnose_claim(base_url: str, runner_secret: str, market: str, runner_name: str) -> int:
    path = "/api/market-briefs/skill-jobs/claim"
    print("Market brief runner diagnose")
    print(f"WORKSTATION_BASE_URL: {base_url}")
    print(f"MARKET_BRIEF_MARKET: {market}")
    print(f"MARKET_BRIEF_RUNNER_NAME: {runner_name}")
    print(f"Runner secret: {describe_secret(runner_secret)}")

    try:
        response = post_json(
            base_url,
            path,
            {"market": market, "runner_name": runner_name},
            runner_secret,
            raise_for_status=False,
        )
    except Exception as exc:  # noqa: BLE001
        print(f"Network or TLS error while calling claim API: {safe_error(exc)}", file=sys.stderr)
        return 1

    print(f"Claim URL: {response.url}")
    print(f"Status: {response.status}")
    print(f"Body: {response.raw_body or '{}'}")

    if response.status == 200 and not response.body.get("job_id"):
        print("No queued market brief generation job found. This usually means the site has no queued job, or MARKET_BRIEF_GENERATOR is not external.")

    return 0 if 200 <= response.status < 500 else 1


def post_json(
    base_url: str,
    path: str,
    payload: dict[str, Any],
    runner_secret: str,
    *,
    raise_for_status: bool = True,
) -> ApiResponse:
    url = f"{base_url}{path}"
    request = urllib.request.Request(
        url,
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
            parsed = parse_json_body(body)
            return ApiResponse(url=url, status=response.status, raw_body=body, body=parsed)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8")
        parsed = parse_json_body(body)
        response = ApiResponse(url=url, status=exc.code, raw_body=body, body=parsed)
        if raise_for_status:
            raise RuntimeError(format_api_error("Runner API request failed", response, runner_secret)) from exc
        return response
    except urllib.error.URLError as exc:
        raise RuntimeError(
            f"Network error calling {url}: {safe_error(exc)}\n"
            f"WORKSTATION_BASE_URL: {base_url}\n"
            f"MARKET_BRIEF_RUNNER_SECRET: {describe_secret(runner_secret)}"
        ) from exc


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


def load_dotenv_if_available() -> list[str]:
    load_dotenv = None
    try:
        from dotenv import load_dotenv
    except Exception:
        load_dotenv = None

    loaded: list[str] = []
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parents[2]
    search_dirs = [Path.cwd(), script_dir, project_root]
    seen: set[Path] = set()

    for filename in (".env.local", ".env"):
        for directory in search_dirs:
            path = (directory / filename).resolve()
            if path in seen:
                continue
            seen.add(path)
            if path.exists():
                if load_dotenv:
                    load_dotenv(path, override=False)
                else:
                    load_simple_env_file(path)
                loaded.append(str(path))

    return loaded


def load_simple_env_file(path: Path) -> None:
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        key = key.strip()
        if not key or key in os.environ:
            continue
        os.environ[key] = value.strip().strip('"').strip("'")


def print_missing_env_help(name: str, env_files: list[str]) -> None:
    print(f"{name} is required.", file=sys.stderr)
    print("The runner checked the current shell and these env files:", file=sys.stderr)
    if env_files:
        for path in env_files:
            print(f"- {path}", file=sys.stderr)
    else:
        print("- no .env.local or .env file was found", file=sys.stderr)
    print("", file=sys.stderr)
    print("Quick fix:", file=sys.stderr)
    print("1. Copy scripts/market-brief-runner/python/.env.example to scripts/market-brief-runner/python/.env.local.", file=sys.stderr)
    print("2. Fill WORKSTATION_BASE_URL and MARKET_BRIEF_RUNNER_SECRET in .env.local.", file=sys.stderr)
    print("3. Run python run_market_brief_runner.py again.", file=sys.stderr)


def normalize_base_url(value: str | None) -> str | None:
    if not value:
        return None
    return value.rstrip("/")


def safe_error(exc: Exception) -> str:
    return str(exc).replace("\n", " ")[:500]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run or diagnose the Market Brief Python runner.")
    parser.add_argument("--diagnose", action="store_true", help="Only call claim API and print status/body. Do not fetch data, post result, or mark fail.")
    return parser.parse_args()


def parse_json_body(body: str) -> dict[str, Any]:
    try:
        parsed = json.loads(body) if body else {}
        return parsed if isinstance(parsed, dict) else {"value": parsed}
    except json.JSONDecodeError:
        return {"raw": body}


def format_api_error(prefix: str, response: "ApiResponse", runner_secret: str) -> str:
    return "\n".join(
        [
            f"{prefix}.",
            f"URL: {response.url}",
            f"Status: {response.status}",
            f"Body: {response.raw_body or '{}'}",
            f"Runner secret: {describe_secret(runner_secret)}",
        ]
    )


def format_claim_error(response: "ApiResponse", base_url: str, market: str, runner_name: str, runner_secret: str) -> str:
    return "\n".join(
        [
            "Failed to claim market brief generation job.",
            f"URL: {response.url}",
            f"Status: {response.status}",
            f"Body: {response.raw_body or '{}'}",
            f"WORKSTATION_BASE_URL: {base_url}",
            f"MARKET_BRIEF_MARKET: {market}",
            f"MARKET_BRIEF_RUNNER_NAME: {runner_name}",
            f"Runner secret: {describe_secret(runner_secret)}",
        ]
    )


def describe_secret(value: str | None) -> str:
    if not value:
        return "not set"
    digest = hashlib.sha256(value.encode("utf-8")).hexdigest()[:8]
    return f"set, length={len(value)}, sha256_prefix={digest}"


class ApiResponse:
    def __init__(self, url: str, status: int, raw_body: str, body: dict[str, Any]) -> None:
        self.url = url
        self.status = status
        self.raw_body = raw_body
        self.body = body


if __name__ == "__main__":
    raise SystemExit(main())
