from playwright.sync_api import Page, expect, sync_playwright

def verify_final(page: Page):
    page.goto("http://localhost:5173/")
    page.wait_for_selector("text=Vocaccia", timeout=15000)
    page.click('button[title="Settings"]')

    # Check for "Settings" header with gear icon (the text is what we check)
    settings_header = page.locator('h3:has-text("Settings")')
    expect(settings_header).to_be_visible()

    # Expand it
    page.click('button:has-text("Settings")')

    # Check for toggle
    auto_play_text = page.locator('text=Auto-play Answer')
    expect(auto_play_text).to_be_visible()

    # Check that Audio section is gone
    audio_header = page.locator('h3:has-text("Audio")')
    expect(audio_header).not_to_be_visible()

    page.screenshot(path="final_verification.png", full_page=True)
    print("Final verification screenshot saved.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_final(page)
        finally:
            browser.close()
