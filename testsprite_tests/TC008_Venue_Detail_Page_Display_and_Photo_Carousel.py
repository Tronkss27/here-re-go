import asyncio
from playwright import async_api

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:5174", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # Find and navigate to a venue detail page from the homepage or other accessible pages
        await page.mouse.wheel(0, window.innerHeight)
        

        # Try to navigate directly to a known venue detail page URL or open a new tab to search for venues
        await page.goto('http://localhost:5174/venue/1', timeout=10000)
        

        # Click 'Return to Home' link to go back to homepage and try to find a valid venue detail page link
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click on the first 'Trova Locali' button (index 20) to open a venue detail page and start validation.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/section[3]/div/div/div[2]/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click the 'Visualizza' button (index 23) for the first venue 'banana12' to open its detail page and validate venue info, photo carousel, and match announcements.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/main/div[3]/section/div/article/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Scroll down to check for match announcements linked to this venue and verify their presence and correctness.
        await page.mouse.wheel(0, window.innerHeight)
        

        # Validate color consistency improvements on contact info sections, button hierarchy, input fields, and soft pink usage as per extra info instructions.
        await page.mouse.wheel(0, window.innerHeight)
        

        # Assert venue business info is visible
        assert await page.locator('text=banana12').is_visible()
        assert await page.locator('text=Indirizzo non disponibile').is_visible()
        assert await page.locator('text=2 persone').is_visible()
        assert await page.locator('text=Prenota ora').is_visible()
        assert await page.locator('text=Cancellazione flessibile').is_visible()
        # Assert photo carousel loads all uploaded images
        images = await page.locator('img').all()
        image_urls = [await img.get_attribute('src') for img in images]
        expected_images = [
          'http://localhost:3001/uploads/venues/venue-6887398d20bbeb91f9dc0e39-1753709417998-153848034.png',
          'http://localhost:3001/uploads/venues/venue-6887398d20bbeb91f9dc0e39-1753709417998-153848034.png',
          'http://localhost:3001/uploads/venues/venue-6887398d20bbeb91f9dc0e39-1753711660241-363594610.png'
         ]
        for expected_img in expected_images:
            assert any(expected_img in url for url in image_urls)
        # Assert photo carousel navigation controls are visible
        assert await page.locator('button[aria-label="Next"]').is_visible()
        assert await page.locator('button[aria-label="Previous"]').is_visible()
        # Assert match announcements are displayed correctly
        assert await page.locator('text=Nessuna partita in programma al momento').is_visible()
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    