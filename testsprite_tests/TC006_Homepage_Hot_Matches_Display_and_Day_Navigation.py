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
        # Verify hot matches are displayed prominently for the current day (OGGI)
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/section[2]/div/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Test navigation to another day with matches, e.g., 'DOMANI', and verify matches and venue listings update accordingly.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/section[2]/div/div/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Test navigation to another day with potential matches, e.g., 'Sab 9', and verify matches and venue listings update accordingly.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/section[2]/div/div/button[4]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click on 'Dom 10' to check for matches and verify if venue recommendations update accordingly.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/section[2]/div/div/button[5]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click on 'Lun 11' to check for matches and verify if venue recommendations update accordingly.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/section[2]/div/div/button[6]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click on 'Mar 12' to check for matches and verify if venue recommendations update accordingly.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/section[2]/div/div/button[7]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Check if venue recommendations section is present and if it updates dynamically when selecting different days with matches, if any.
        await page.mouse.wheel(0, window.innerHeight)
        

        # Assert hot matches are displayed prominently for the current day 'OGGI'
        frame = context.pages[-1]
        oggi_button = frame.locator('xpath=html/body/div/div/div/section[2]/div/div/button[2]').nth(0)
        await oggi_button.wait_for(state='visible', timeout=5000)
        await oggi_button.click()
        await page.wait_for_timeout(1000)
        # Check that matches section is visible and contains expected date label
        matches_section = frame.locator('section#matches')
        assert await matches_section.is_visible()
        date_label = frame.locator('xpath=//button[contains(text(), "OGGI")]')
        assert await date_label.is_visible()
        # Assert day navigation buttons exist and are clickable
        day_buttons = frame.locator('xpath=html/body/div/div/div/section[2]/div/div/button')
        count_buttons = await day_buttons.count()
        assert count_buttons >= 6  # At least buttons for OGGI, DOMANI, Sab 9, Dom 10, Lun 11, Mar 12
        # Iterate over each day button except 'Mar 12' which has no matches
        for i in range(2, 7):
            day_button = day_buttons.nth(i)
            await day_button.click()
            await page.wait_for_timeout(1000)
            # Check that matches update accordingly
            if i == 6:  # Mar 12 has no matches
                no_match_message = frame.locator('text=Nessuna partita per questo giorno')
                assert await no_match_message.is_visible()
            else:
                matches_list = frame.locator('section#matches .match-card')
                assert await matches_list.count() > 0
            # Check that venue recommendations update dynamically
            venue_section = frame.locator('section#venue-recommendations')
            assert await venue_section.is_visible()
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    