import {GoogleGenAI} from '@google/genai';
import {z} from 'zod';
import {zodToJsonSchema} from 'zod-to-json-schema';
import dotenv from 'dotenv';
import path from 'path';
import {fileURLToPath} from 'url';
dotenv.config({
    path: path.resolve(process.cwd(), '.env'),
});

if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is missing from environment variables!');
} else {
    console.log(`✅ GEMINI service initialized.`);
}

const crisisJsonSchema = {
    type: 'object',
    properties: {
        is_crisis: {
            type: 'boolean',
            description: 'Whether the situation is a crisis',
        },
        type_classification: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    enum: [
                        'Flood',
                        'Fire',
                        'Earthquake',
                        'Cyclone',
                        'Epidemic',
                        'Food Shortage',
                        'Landslide',
                        'Drought',
                        'Storm',
                        'Outbreak',
                        'Others',
                    ],
                    description: 'The type of crisis',
                },
                confidence: {
                    type: 'number',
                    description: 'Confidence score 0-1',
                },
            },
            required: ['type', 'confidence'],
        },
        location: {
            type: 'object',
            properties: {
                name: {type: 'string', description: 'City/Place name'},
                coordinates: {
                    type: 'object',
                    properties: {
                        lat: {type: 'number'},
                        lon: {type: 'number'},
                    },
                    required: ['lat', 'lon'],
                },
            },
            required: ['name', 'coordinates'],
        },
        severity: {
            type: 'object',
            properties: {
                overall: {type: 'number', description: 'Overall severity 0-1'},
                dimensions: {
                    type: 'object',
                    properties: {
                        human_impact: {type: 'number'},
                        infrastructure_damage: {type: 'number'},
                        geographic_scale: {type: 'number'},
                        temporal_urgency: {type: 'number'},
                    },
                    required: [
                        'human_impact',
                        'infrastructure_damage',
                        'geographic_scale',
                        'temporal_urgency',
                    ],
                },
            },
            required: ['overall', 'dimensions'],
        },
        urgency: {
            type: 'object',
            properties: {
                level: {
                    type: 'string',
                    enum: ['critical', 'high', 'medium', 'low'],
                },
                is_urgent: {type: 'boolean'},
            },
            required: ['level', 'is_urgent'],
        },
        priority: {
            type: 'object',
            properties: {
                level: {
                    type: 'string',
                    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
                },
                score: {type: 'number'},
            },
            required: ['level', 'score'],
        },
        explanation: {
            type: 'object',
            properties: {
                content: {
                    type: 'string',
                    description: 'Professional summary with emoji',
                },
            },
            required: ['content'],
        },
    },
    required: [
        'is_crisis',
        'type_classification',
        'location',
        'severity',
        'urgency',
        'priority',
        'explanation',
    ],
};

const crisisZodSchema = z.object({
    is_crisis: z.boolean(),
    type_classification: z.object({
        type: z.string(),
        confidence: z.number(),
    }),
    location: z.object({
        name: z.string(),
        coordinates: z.object({
            lat: z.number(),
            lon: z.number(),
        }),
    }),
    severity: z.object({
        overall: z.number(),
        dimensions: z.object({
            human_impact: z.number(),
            infrastructure_damage: z.number(),
            geographic_scale: z.number(),
            temporal_urgency: z.number(),
        }),
    }),
    urgency: z.object({
        level: z.string(),
        is_urgent: z.boolean(),
    }),
    priority: z.object({
        level: z.string(),
        score: z.number(),
    }),
    explanation: z.object({
        content: z.string(),
    }),
});

const getRefinedAnalysis = async (originalText, mlOutput) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn('GEMINI_API_KEY is not set. Returning raw ML output.');
            return mlOutput;
        }

        const ai = new GoogleGenAI({apiKey});

        const prompt = `
        You are an expert Crisis Response Coordinator.
        Your task is to validate and refine the preliminary analysis provided by an automated ML system against the original source text.

        Instructions:
        1. Analyze the 'Original Source Text' to understand the ground truth of the situation.
        2. Review the 'Preliminary ML Analysis'.
        3. Correct any inaccuracies in the ML analysis (e.g., wrong location, incorrect crisis type, understated severity) based on the text.
        4. If the ML analysis missed critical details (like specific casualty counts, infrastructure damage, or urgency cues), add them.
        5. Ensure the final output strictly follows the required JSON structure.
        
        Original Source Text:
        "${originalText}"
        
        Preliminary ML Analysis:
        ${JSON.stringify(mlOutput)}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: crisisJsonSchema,
            },
        });

        let responseText;
        if (typeof response.text === 'function') {
            responseText = response.text();
        } else if (response.text) {
            responseText = response.text;
        } else {
            responseText = JSON.stringify(response);
        }

        const parsedJson = JSON.parse(responseText);

        const crisisData = crisisZodSchema.parse(parsedJson);
        return crisisData;
    } catch (error) {
        console.error('Gemini Refinement Failed:', error.message);
        if (error.issues) {
            console.error(
                'Validation Issues:',
                JSON.stringify(error.issues, null, 2)
            );
        }
        return mlOutput;
    }
};

export default getRefinedAnalysis;
