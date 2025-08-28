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
        # Start testing login flow by clicking 'Accedi come Locale' button on homepage.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/header/div/div/div[2]/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Fill in login credentials and submit the form to test login functionality.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/form/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('test.venue@sports.local')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/form/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('TestVenue2025!')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Test venue browsing flow by clicking 'Vedi tutti i locali' button on homepage to verify functional and UI consistency.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/section[3]/div/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Test venue detail view by clicking 'Visualizza' button on the first venue card to verify UI and functional consistency.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/main/div[3]/section/div/article/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Scroll down to check booking form and secondary buttons for color consistency and UI correctness.
        await page.mouse.wheel(0, 600)
        

        # Scroll further down to check booking form secondary buttons for correct white/neutral background and button hierarchy compliance.
        await page.mouse.wheel(0, 400)
        

        # Assert page title is correct
        assert await page.title() == 'SPOrTS - Sports Bar Management'
        
        # Assert navigation links are present and correct
        nav_links = await page.locator('nav >> a').all_text_contents()
        expected_nav_links = ['Partite', 'Locali', 'App', 'Guida TV', 'Chi Siamo']
        assert nav_links == expected_nav_links
        
        # Assert venue name is displayed correctly
        venue_name = await page.locator('text=sportive').first().text_content()
        assert venue_name.strip() == 'sportive'
        
        # Assert venue description placeholder text is present
        venue_desc = await page.locator('text=Il locale non ha ancora aggiunto una descrizione.').first().text_content()
        assert 'Il locale non ha ancora aggiunto una descrizione.' in venue_desc
        
        # Assert contact phone and address are displayed and no pink background in contact section
        contact_section = await page.locator('section.contact-info').first()
        contact_phone = await contact_section.locator('text=234323432354').first().text_content()
        contact_address = await contact_section.locator('text=Indirizzo non disponibile').first().text_content()
        assert contact_phone.strip() == '234323432354'
        assert contact_address.strip() == 'Indirizzo non disponibile'
        contact_bg_color = await contact_section.evaluate('(el) => window.getComputedStyle(el).backgroundColor')
        assert contact_bg_color != 'rgb(255, 192, 203)'  # No invasive pink background
        
        # Assert booking button uses primary orange color #FF7043
        booking_button = await page.locator('button:has-text("Prenota ora")').first()
        booking_button_color = await booking_button.evaluate('(el) => window.getComputedStyle(el).backgroundColor')
        assert booking_button_color == 'rgb(255, 112, 67)'  # #FF7043 in rgb
        
        # Assert input fields have white background and grey border
        input_fields = await page.locator('input').all()
        for input_field in input_fields:
            bg_color = await input_field.evaluate('(el) => window.getComputedStyle(el).backgroundColor')
            border_color = await input_field.evaluate('(el) => window.getComputedStyle(el).borderColor')
            assert bg_color == 'rgb(255, 255, 255)'  # white background
            assert border_color == 'rgb(128, 128, 128)' or border_color == 'rgb(169, 169, 169)'  # grey border
        
        # Assert soft pink #FFE5E5 used only for active/selected states
        active_elements = await page.locator('.active, .selected').all()
        for elem in active_elements:
            bg_color = await elem.evaluate('(el) => window.getComputedStyle(el).backgroundColor')
            assert bg_color == 'rgb(255, 229, 229)'  # #FFE5E5 in rgb
        
        # Assert secondary buttons have white or neutral background
        secondary_buttons = await page.locator('button.secondary').all()
        for btn in secondary_buttons:
            bg_color = await btn.evaluate('(el) => window.getComputedStyle(el).backgroundColor')
            assert bg_color in ['rgb(255, 255, 255)', 'rgb(245, 245, 245)']  # white or neutral background
        
        # Assert no invasive pink backgrounds in contact/info sections
        info_sections = await page.locator('section.contact-info, section.info-card').all()
        for section in info_sections:
            bg_color = await section.evaluate('(el) => window.getComputedStyle(el).backgroundColor')
            assert bg_color != 'rgb(255, 192, 203)'  # no invasive pink background
        
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    