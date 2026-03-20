from playwright.sync_api import sync_playwright

def verify_feature():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # 1. Load the app online
        context = browser.new_context(record_video_dir="/home/jules/verification/video")
        page = context.new_page()
        print("Loading app online to install Service Worker...")
        page.goto("http://localhost:4173")

        # Wait for the app to initialize (loading screen to disappear)
        page.wait_for_selector("text=Lade Vokabeln...", state="hidden", timeout=10000)
        page.wait_for_timeout(2000)

        # Verify it loaded properly (we see the start button or some config)
        if page.locator("text=Vokabeln Starten").is_visible() or page.locator("button:has-text('Start')").is_visible():
            print("App loaded successfully online.")
        else:
            print("App didn't seem to load correctly.")

        # 2. Go Offline
        print("Simulating offline mode...")
        context.set_offline(True)

        # 3. Reload the page while offline
        print("Reloading page while offline...")
        page.reload()

        # 4. Wait for it to load again
        page.wait_for_selector("text=Lade Vokabeln...", state="hidden", timeout=10000)
        page.wait_for_timeout(2000)

        # Verify it still works
        print("Checking if app is functional offline...")

        page.screenshot(path="/home/jules/verification/verification.png")
        print("Screenshot saved to /home/jules/verification/verification.png")

        context.close()
        browser.close()

if __name__ == "__main__":
    import os
    os.makedirs("/home/jules/verification/video", exist_ok=True)
    verify_feature()
