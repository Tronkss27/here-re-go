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
        # Click on 'Trova Locali' button for the first match (PSG vs MAN CITY) to go to venue detail page containing booking form.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/section[3]/div/div/div[2]/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click on 'Visualizza' button for the first venue 'banana12' to open booking form.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/main/div[3]/section/div/article/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click on 'Prenota ora' button to open the booking form.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[3]/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click on 'Per una Partita' tab to switch to match-specific booking form and verify if any matches can be selected or if the form allows input despite no matches.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[3]/div[2]/div/div[2]/form/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Fill the booking form fields with valid data: select a date, number of people, table preference, and enter client contact information, then submit the booking request to test validation and reservation.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[3]/div[2]/div/div[2]/form/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Select a valid date from the calendar for the booking, then continue filling the rest of the booking form fields (number of people, table preference, contact info).
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[2]/div/div/div[3]/button[12]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Fill in number of people, table preference, client name, email, phone, special requests, and recurring booking option, then submit the booking form.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[3]/div[2]/div/div[2]/form/div[6]/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Mario Rossi')
        

        # Click 'Conferma prenotazione' button to submit the booking request and verify form validation and booking confirmation.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[3]/div[2]/div/div[2]/form/div[9]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Manually clear the phone input field, re-enter the phone number, then attempt to submit the booking form again to verify if validation error clears and booking can be confirmed.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[3]/div[2]/div/div[2]/form/div[6]/div[3]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[3]/div[2]/div/div[2]/form/div[6]/div[3]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[3]/div[2]/div/div[2]/form/div[6]/div[3]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('+39 345 678 9012')
        

        # Conclude the test by reporting that the booking form validation correctly prevents booking on closed days, but this blocks booking submission even with valid inputs. No match-specific booking could be tested due to no matches available.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[3]/div[2]/div/div[2]/form/div[10]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Assert that the booking form validates all fields successfully by checking no validation error messages are visible
        validation_errors = await frame.locator('xpath=//form//div[contains(@class, "error")]').count()
        assert validation_errors == 0, "There are validation errors in the booking form."
        # Assert booking confirmation message or booking success indicator is visible after submission
        confirmation_message = await frame.locator('xpath=//div[contains(text(), "Prenotazione confermata") or contains(text(), "Booking confirmed")]').count()
        assert confirmation_message > 0, "Booking confirmation message not found, booking may have failed."
        # Assert that the booking is associated with the correct venue name
        venue_name_text = await frame.locator('xpath=//h1[contains(text(), "banana12")]').count()
        assert venue_name_text > 0, "Venue name 'banana12' not found on confirmation page."
        # Assert that the booking is associated with a match or shows appropriate message if no matches are scheduled
        scheduled_matches_text = await frame.locator('xpath=//div[contains(text(), "Nessuna partita in programma") or contains(text(), "scheduled matches")]').count()
        assert scheduled_matches_text > 0, "Scheduled matches info not found or booking not associated with a match."
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    