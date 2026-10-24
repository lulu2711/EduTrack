"""Read env files and report whether each variable satisfies production rules.

Only prints SAFE metadata: key name, value length, and masked previews.
Full secret values are never printed.
"""

import os
import re
import sys

PLACEHOLDERS = {
    "",
    "change-this-admin-password",
    "change-this-student-demo-password",
    "your-super-secret-jwt-key-change-this-in-production",
    "your-secret-key",
}

SECRET_KEYS = {
    "MONGODB_URI",
    "JWT_SECRET",
    "LLM_API_KEY",
    "ADMIN_PASSWORD",
    "STUDENT_DEMO_PASSWORD",
}

PLAIN_KEYS = {
    "NODE_ENV",
    "PORT",
    "DATA_SOURCE_MODE",
    "JWT_EXPIRES_IN",
    "CORS_ORIGIN",
    "ADMIN_USERNAME",
    "DATA_DIR",
    "LLM_BASE_URL",
    "LLM_MODEL",
}


def mask(value: str) -> str:
    if not value:
        return "(empty)"
    if len(value) <= 8:
        return "*" * len(value)
    return f"{value[:4]}{'*' * (len(value) - 6)}{value[-2:]}"


def load(path: str):
    env = {}
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8", errors="replace") as handle:
        for raw in handle:
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def check_production(env: dict, label: str, skip_rules: bool = False):
    print(f"\n===== {label} =====")
    if env is None:
        print("file not found")
        return []

    problems = []
    for key in sorted(env):
        value = env[key]
        display = value if key in PLAIN_KEYS else mask(value)
        print(f"  {key:<24} len={len(value):<4} {display}")

    # The client build only needs VITE_API_URL; backend rules do not apply.
    if skip_rules:
        print("  -- no backend rules apply to this file --")
        return []

    print("  -- production rule verdicts --")

    def mark(ok: bool, message: str):
        print(f"  [{'PASS' if ok else 'FAIL'}] {message}")
        if not ok:
            problems.append(f"[{label}] {message}")

    mode = env.get("DATA_SOURCE_MODE", "(unset)")
    mark(mode == "mongodb", f"DATA_SOURCE_MODE=mongodb (actual: {mode})")

    uri = env.get("MONGODB_URI", "")
    mark(bool(uri), "MONGODB_URI is set")
    if uri:
        looks_template = bool(re.search(r"<[^>]+>", uri))
        mark(not looks_template, "MONGODB_URI is a real URI (no <placeholder> tokens)")
        if looks_template:
            mark(False, "MONGODB_URI still contains template placeholders")

    secret = env.get("JWT_SECRET", "")
    mark(len(secret) >= 32, f"JWT_SECRET length >= 32 (actual: {len(secret)})")
    mark(secret not in PLACEHOLDERS, "JWT_SECRET is not a known placeholder")

    cors = env.get("CORS_ORIGIN", "")
    mark(bool(cors), "CORS_ORIGIN is set")
    if cors:
        local = bool(re.search(r"localhost|127\.0\.0\.1", cors, re.I))
        mark(not local, f"CORS_ORIGIN is not localhost (actual: {cors})")
        mark(cors.startswith("https://"), "CORS_ORIGIN uses https://")

    admin = env.get("ADMIN_PASSWORD", "")
    mark(len(admin) >= 12, f"ADMIN_PASSWORD length >= 12 (actual: {len(admin)})")
    mark(admin not in PLACEHOLDERS, "ADMIN_PASSWORD is not a known placeholder")

    llm = [env.get("LLM_BASE_URL", ""), env.get("LLM_API_KEY", ""), env.get("LLM_MODEL", "")]
    partial = any(llm) and not all(llm)
    mark(not partial, f"LLM vars all-set-or-all-empty (set count: {sum(1 for x in llm if x)})")

    # Mirror the <placeholder> guard enforced by server/src/config/environment.ts
    template_token = re.compile(r"<[^>]+>|\{[^{}]+\}")
    for key in ("MONGODB_URI", "JWT_SECRET", "CORS_ORIGIN",
                "ADMIN_PASSWORD", "STUDENT_DEMO_PASSWORD"):
        value = env.get(key, "")
        if value:
            mark(not template_token.search(value),
                 f"{key} has no unresolved <placeholder> token")

    return problems


def main():
    # this script lives in <repo>/scripts, so the repo root is one level up
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    targets = [
        # dev file - checked for information only, it is not used in production
        os.path.join(base, "server", ".env"),
        os.path.join(base, "server", ".env.production"),
        os.path.join(base, "client", ".env.production"),
    ]
    all_problems = []
    for target in targets:
        relative = os.path.relpath(target, base)
        all_problems.extend(
            check_production(load(target), relative, skip_rules=relative.startswith("client"))
        )

    print("\n===== SUMMARY =====")
    if all_problems:
        print(f"production-start blockers found: {len(all_problems)}")
        for problem in all_problems:
            print(f"  - {problem}")
    else:
        print("no production-start blockers found")


if __name__ == "__main__":
    sys.exit(main())
