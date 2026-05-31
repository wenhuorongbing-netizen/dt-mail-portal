#!/usr/bin/env python3
"""Create a mailbox through mailcow API.

Usage:
  MAILCOW_BASE_URL=https://mail.buffjo.top MAILCOW_API_KEY=... python create-mailbox.py dt001 tickets.buffjo.top 'StrongPass123!'
"""

import os
import sys
import requests


def main() -> int:
    if len(sys.argv) != 4:
        print("Usage: create-mailbox.py <local_part> <domain> <password>")
        return 1

    base_url = os.environ.get("MAILCOW_BASE_URL")
    api_key = os.environ.get("MAILCOW_API_KEY")
    if not base_url or not api_key:
      print("MAILCOW_BASE_URL and MAILCOW_API_KEY are required")
      return 1

    local_part, domain, password = sys.argv[1:]
    payload = {
        "local_part": local_part,
        "domain": domain,
        "name": local_part,
        "password": password,
        "password2": password,
        "quota": "250",
        "active": "1",
        "force_pw_update": "0",
        "tls_enforce_in": "1",
        "tls_enforce_out": "1",
    }

    response = requests.post(
        f"{base_url.rstrip('/')}/api/v1/add/mailbox",
        headers={"X-API-Key": api_key},
        json=payload,
        timeout=20,
    )
    print(response.status_code, response.text)
    return 0 if response.ok else 2


if __name__ == "__main__":
    raise SystemExit(main())
