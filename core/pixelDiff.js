import fs from 'fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { config } from './config.js';

/**
 * Compares two images using pixelmatch.
 * Returns an object containing matched bool, diff count, and dimensions.
 */
export function compareImages(baseImgPath, actualImgPath, diffOutPath = null) {
    try {
        const img1 = PNG.sync.read(fs.readFileSync(baseImgPath));
        const img2 = PNG.sync.read(fs.readFileSync(actualImgPath));

        const { width, height } = img1;
        const diff = new PNG({ width, height });

        // Fallback warning if dimensions differ
        if (img1.width !== img2.width || img1.height !== img2.height) {
            console.warn("Image dimensions do not match, pixelmatch might fail or give inaccurate results.");
        }

        const numDiffPixels = pixelmatch(
            img1.data,
            img2.data,
            diffOutPath ? diff.data : null,
            width,
            height,
            { threshold: config.PIXELMATCH_THRESHOLD }
        );

        if (diffOutPath) {
            fs.writeFileSync(diffOutPath, PNG.sync.write(diff));
        }

        return {
            matched: numDiffPixels === 0,
            diffPixels: numDiffPixels,
            totalPixels: width * height,
        };
    } catch (error) {
        console.error(`Error during pixelmatch: ${error.message}`);
        return { matched: false, diffPixels: -1, totalPixels: 0, error: error.message };
    }
}
