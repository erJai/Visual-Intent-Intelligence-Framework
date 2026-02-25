import fs from 'fs';
import path from 'path';
import { IntentAnalyzer } from './core/intentAnalyzer.js';

export class VisualIntentAssert {
    constructor() {
        this.analyzer = new IntentAnalyzer();
    }

    _ensureDir(filePath) {
        const dir = path.dirname(path.resolve(filePath));
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    /**
     * Asserts that two images have the same semantic intent.
     * Throws Error if the intent does not match.
     */
    async assertIntent(expectedImagePath, actualImagePath) {
        if (!fs.existsSync(expectedImagePath)) {
            throw new Error(`Baseline image not found: ${expectedImagePath}`);
        }
        if (!fs.existsSync(actualImagePath)) {
            throw new Error(`Actual image not found: ${actualImagePath}`);
        }

        const result = await this.analyzer.analyze(expectedImagePath, actualImagePath);

        if (result.status === 'failed') {
            throw new Error(
                `Visual Intent Regression Detected!\nMethod: ${result.method}\nReason: ${result.reason}\nPixels Changed: ${result.diffPixels || 'N/A'}`
            );
        }

        return result;
    }

    /**
     * Helper method to assert intent directly from a Playwright Page or Locator.
     */
    async assertPlaywrightElement(pageOrLocator, expectedImagePath, tempActualPath = 'actual.png') {
        this._ensureDir(tempActualPath);
        this._ensureDir(expectedImagePath);

        // Capture element/page screenshot
        await pageOrLocator.screenshot({ path: tempActualPath });

        // If baseline doesn't exist, create it (auto-baseline generation)
        if (!fs.existsSync(expectedImagePath)) {
            console.log(`Creating new baseline image at: ${expectedImagePath}`);
            await pageOrLocator.screenshot({ path: expectedImagePath });
            return { status: 'passed', method: 'baseline_creation', reason: 'Baseline created' };
        }

        // Assert intent
        try {
            return await this.assertIntent(expectedImagePath, tempActualPath);
        } finally {
            if (fs.existsSync(tempActualPath)) {
                fs.unlinkSync(tempActualPath);
            }
        }
    }
}
