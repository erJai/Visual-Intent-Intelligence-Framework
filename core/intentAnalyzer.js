import { compareImages } from './pixelDiff.js';
import { VisionClient } from './visionLlm.js';

export class IntentAnalyzer {
    constructor() {
        this.visionClient = new VisionClient();
    }

    /**
     * The core pipeline:
     * 1. Try fast pixel matching.
     * 2. If passed -> Fast Success.
     * 3. If failed -> Send to LLM for Intent match.
     */
    async analyze(baseImagePath, actualImagePath) {
        console.log(`Comparing: Base [${baseImagePath}] vs Actual [${actualImagePath}]`);

        // Step 1: Lightweight structural pass
        const pixelResult = compareImages(baseImagePath, actualImagePath);

        if (pixelResult.matched) {
            console.log('Fast Pass: Images are identical structurally.');
            return {
                status: 'passed',
                method: 'pixelmatch',
                reason: '100% pixel match',
                diffPixels: 0,
            };
        }

        const diffPixels = pixelResult.diffPixels;
        console.log(`Pixel difference detected: ${diffPixels} pixels. Engaging Vision LLM...`);

        // Step 2: Semantic Intent Pass
        const intentResult = await this.visionClient.analyzeIntent(baseImagePath, actualImagePath);

        // Handle LLM API Errors
        if (intentResult.error) {
            console.error(`Vision API Error: ${intentResult.error}`);
            return {
                status: 'failed',
                method: 'vision_llm_error',
                reason: intentResult.reason || 'API Error',
                diffPixels,
            };
        }

        // Handle successful LLM evaluation
        const isMatch = intentResult.is_intent_match;
        const reason = intentResult.reason || 'No reason provided';

        if (isMatch) {
            console.log('Vision Pass: Semantic intent is identical despite pixel shifts.');
            return {
                status: 'passed',
                method: 'vision_llm',
                reason,
                diffPixels,
            };
        } else {
            console.warn(`Vision Fail: True visual regression detected! Reason: ${reason}`);
            return {
                status: 'failed',
                method: 'vision_llm',
                reason,
                diffPixels,
            };
        }
    }
}
