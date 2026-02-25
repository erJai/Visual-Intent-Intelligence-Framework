import fs from 'fs';
import OpenAI from 'openai';
import { config } from './config.js';

function encodeImage(imagePath) {
    const imageBuffer = fs.readFileSync(imagePath);
    return imageBuffer.toString('base64');
}

export class VisionClient {
    constructor() {
        this.client = new OpenAI({
            baseURL: config.LLM_BASE_URL,
            apiKey: config.LLM_API_KEY || 'sk-mock-key',
        });
        this.model = config.LLM_VISION_MODEL;
    }

    /**
     * Sends both images to the Vision LLM to ask if they are semantically identical.
     */
    async analyzeIntent(baseImgPath, actualImgPath) {
        const base64Base = encodeImage(baseImgPath);
        const base64Actual = encodeImage(actualImgPath);

        const prompt = `You are an expert QA automation engineer assisting with visual testing.
You are given two images: a Baseline image (expected) and an Actual image (current).
Compare them to determine if the semantic intent and structure are identical.
Ignore minor pixel shifts (e.g. elements moving by a few pixels), rendering differences,
or different anti-aliasing.
However, if a functional element disappeared, text changed, colors drastically changed,
or the layout is completely broken, you must flag it as an anomaly.

Respond strictly with JSON containing:
{
  "is_intent_match": boolean,
  "reason": "string describing what changed or confirming no regression"
}`;

        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Base}`,
                                    detail: 'high',
                                },
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Actual}`,
                                    detail: 'high',
                                },
                            },
                        ],
                    },
                ],
                max_tokens: 300,
                response_format: { type: 'json_object' },
            });

            const resultText = response.choices[0].message.content;
            return JSON.parse(resultText);
        } catch (error) {
            return {
                is_intent_match: false,
                error: error.message,
                reason: 'Failed to call Vision API',
            };
        }
    }
}
