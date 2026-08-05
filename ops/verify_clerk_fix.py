import http.server
import socketserver
import threading
import functools
import os
import sys
import re
from playwright.sync_api import sync_playwright

DIST = os.path.join(os.path.dirname(__file__), "..", "dist")
DIST = os.path.abspath(DIST)
PORT = 8791
ARGS = ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]


def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=DIST)
    httpd = socketserver.TCPServer(("127.0.0.1", PORT), handler)
    httpd.RequestHandlerClass.log_message = lambda *a, **k: None
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    return httpd


def collect(page, url):
    errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.on(
        "console",
        lambda m: errs.append("console.error: " + m.text)
        if m.type == "error"
        else None,
    )
    page.goto(url, wait_until="load", timeout=45000)
    page.wait_for_timeout(3500)
    return errs


def main():
    httpd = serve()
    base = f"http://127.0.0.1:{PORT}"
    results = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=ARGS)
        ctx = browser.new_context()

        # --- /calculators/sip ---
        page = ctx.new_page()
        errs = collect(page, f"{base}/calculators/sip/")
        multi = [e for e in errs if "multiple <ClerkProvider>" in e]
        # SIP hydration: inputs render + computing works
        inputs = page.query_selector_all(".sipfull-inputs input[type='number']")
        hero_before = (page.query_selector(".sipfull-hero-num") or None)
        hero_before = hero_before.inner_text() if hero_before else ""
        hydrated = False
        if inputs:
            # change monthly investment, expect corpus to recompute (React island)
            inputs[0].fill("20000")
            inputs[0].dispatch_event("input")
            inputs[0].dispatch_event("change")
            page.wait_for_timeout(600)
            hero_after = page.query_selector(".sipfull-hero-num")
            hero_after = hero_after.inner_text() if hero_after else ""
            hydrated = bool(hero_after) and hero_after != hero_before
        results["sip"] = {
            "multiple_clerk_error": bool(multi),
            "inputs_rendered": len(inputs),
            "hero_before": hero_before,
            "hero_after": hero_after if inputs else "",
            "calculator_hydrated": hydrated,
            "errors": errs,
        }
        page.close()

        # --- /account ---
        page = ctx.new_page()
        errs = collect(page, f"{base}/account/")
        multi = [e for e in errs if "multiple <ClerkProvider>" in e]
        # account panel should render sign-in prompt (signed-out)
        panel = page.query_selector(".ap") is not None
        results["account"] = {
            "multiple_clerk_error": bool(multi),
            "panel_rendered": panel,
            "errors": errs,
        }
        page.close()
        browser.close()
    httpd.shutdown()

    print("=== /calculators/sip ===")
    for k, v in results["sip"].items():
        if k == "errors":
            print(f"  errors ({len(v)}):")
            for e in v:
                print("    - " + e[:200])
        else:
            print(f"  {k}: {v}")
    print("=== /account ===")
    for k, v in results["account"].items():
        if k == "errors":
            print(f"  errors ({len(v)}):")
            for e in v:
                print("    - " + e[:200])
        else:
            print(f"  {k}: {v}")

    ok = (
        not results["sip"]["multiple_clerk_error"]
        and results["sip"]["calculator_hydrated"]
        and not results["account"]["multiple_clerk_error"]
    )
    print("\nOVERALL PASS:", ok)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
