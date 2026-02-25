import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { VisualIntentAssert } from './api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const via = new VisualIntentAssert();

async function testGoogleSearchIntent() {
    /**
     * Demonstrates capturing a baseline and then intentionally asserting against a slightly changed UI.
     */
    const baselineDir = path.join(__dirname, 'baselines');
    if (!fs.existsSync(baselineDir)) {
        fs.mkdirSync(baselineDir, { recursive: true });
    }
    const baselineImage = path.join(baselineDir, 'google_search_btn.png');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('Navigating to google.com...');
    await page.goto('https://www.google.com');

    const searchBox = page.locator('textarea[name="q"]');

    console.log('Checking visual intent of search area...');

    // The first time this runs, it will save the baseline.
    // The second time, it will check the intent.

    // To simulate a test we do two checks here in code
    console.log('\n--- Initial Run (Baseline Generation or Fast Match) ---');
    await via.assertPlaywrightElement(searchBox, baselineImage, 'temp_actual_1.png');

    // Now let's inject a CSS change to simulate a "Pixel Shift" but NO semantic change.
    console.log('\n--- Injecting harmless CSS shift (margin change) ---');
    await searchBox.evaluate(el => el.style.marginLeft = '10px');

    try {
        await via.assertPlaywrightElement(searchBox, baselineImage, 'temp_actual_2.png');
        console.log('SUCCESS: Framework correctly identified this as a harmless intent match despite pixel shifts!');
    } catch (e) {
        console.log(`FAILED: Framework threw an exception: ${e.message}`);
    }

    // Now let's inject a MALICIOUS change (semantic change like hiding the element or breaking text)
    console.log('\n--- Injecting breaking semantic change (hiding element text) ---');
    await searchBox.evaluate(el => el.style.visibility = 'hidden');

    try {
        await via.assertPlaywrightElement(page.locator('body'), baselineImage, 'temp_actual_3.png');
        console.log('FAILED: Framework mistakenly passed a visually broken element!');
    } catch (e) {
        console.log('SUCCESS: Framework correctly caught the hard visual regression:');
        console.log(e.message);
    }

    await browser.close();
}

testGoogleSearchIntent().catch(console.error);
