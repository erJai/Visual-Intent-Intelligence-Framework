# Visual Intent Intelligence Framework (JavaScript)

Modern web applications are dynamic, and traditional pixel-based visual testing methods (where even a 1-pixel shift fails a test) are incredibly brittle and high-maintenance.

This framework introduces a **2-pass Semantic Visual Testing Strategy**:
1. **Pass 1 - Fast Pixel Match**: Uses `pixelmatch` to quickly verify if the structural layout is identical. (Fastest, zero cost)
2. **Pass 2 - Intelligent Semantic Match**: If Pass 1 fails due to a pixel discrepancy (e.g. minor padding shift, font rendering differences, etc.), the framework forwards the baseline and the newly captured image to a Vision LLM. The AI determines if the *semantic intent* is broken (e.g. element missing, text altered, button not visible) or if it's merely a harmless rendering shift.

By leveraging Vision Models (like GPT-4o, Claude 3.5 Sonnet, or GLM-4V) specifically for the "edge cases", this framework drastically reduces False Positives in automated visual regression runs, while reliably catching True Negatives.

## Core Stack
* **Language**: Node.js (JavaScript ES Modules)
* **Pixel Processing**: `pixelmatch` + `pngjs`
* **Vision Interface**: Generic OpenAI API client (Compatible with major Vision models)
* **Demo Test Runner**: Playwright

## Directory Structure

```text
visual_intent_framework/
│
├── package.json
├── core/
│   ├── config.js             # LLM API keys and model choices
│   ├── visionLlm.js          # Interacts with Vision LLM (GLM-4V/OpenAI) for intent extraction
│   ├── pixelDiff.js          # pixelmatch-based lightweight pre-check
│   └── intentAnalyzer.js     # Master logic combining pixel diff and semantic analysis
│
├── api.js                    # Main developer-facing class `VisualIntentAssert`
└── exampleTest.js            # Example Playwright/Selenium integration
```

## Setup & Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file in the root of the project with your Vision API configuration:

```env
# Example OpenAI configuration
LLM_BASE_URL="https://api.openai.com/v1"
LLM_API_KEY="sk-..."
LLM_VISION_MODEL="gpt-4o"

# Pixelmatch severity tolerance (0 to 1)
PIXELMATCH_THRESHOLD=0.1
```

*(Note: The framework defaults to OpenAI, but `LLM_BASE_URL` can be pointed to any OpenAI-schema compatible endpoint like vLLM, DeepSeek, or ZhipuAI/GLM).*

### 3. Run the Example Playwright Test
The included script demonstrates the framework by automatically creating a baseline, and then artificially injecting harmless CSS changes vs breaking semantic changes.

```bash
node exampleTest.js
```

### Usage in other Frameworks
You can import the `VisualIntentAssert` class into any Playwright setup:

```javascript
import { VisualIntentAssert } from './api.js';

const via = new VisualIntentAssert();

// A generic "assert" passing exact file paths
await via.assertIntent('baseline.png', 'actual_capture.png');

// Or using the Playwright locator helper
await via.assertPlaywrightElement(page.locator('#submitBtn'), 'baselines/submit_btn.png');
```
