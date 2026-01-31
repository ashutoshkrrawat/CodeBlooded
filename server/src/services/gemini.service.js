import {GoogleGenerativeAI} from '@google/generative-ai';
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

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash-lite',
            systemInstruction:
                'You are an expert Crisis Response Coordinator. Your task is to validate and refine the preliminary analysis provided by an automated ML system against the original source text.',
        });

        const prompt = `
        Instructions:
        1. Analyze the 'Original Source Text' to understand the ground truth of the situation.
        2. Review the 'Preliminary ML Analysis'.
        3. Correct any inaccuracies in the ML analysis (e.g., wrong location, incorrect crisis type, understated severity) based on the text.
        4. If the ML analysis missed critical details (like specific casualty counts, infrastructure damage, or urgency cues), add them.
        5. Ensure the final output strictly follows the required JSON structure.
        6. Be formal in explanation and avoid unnecessary use of emojis.
        
        Original Source Text:
        "${originalText}"
        
        Preliminary ML Analysis:
        ${JSON.stringify(mlOutput)}
        `;

        const result = await model.generateContent({
            contents: [{role: 'user', parts: [{text: prompt}]}],
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: crisisJsonSchema,
            },
        });

        const responseText = result.response.text();
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

export const checkCrisisUpdate = async (newText, mlOutput, existingIssue) => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash-lite',
            systemInstruction: `You are an expert crisis analyst. Compare a NEW incoming report with an EXISTING recorded issue.
            
            Inputs:
            1. New Report Text
            2. ML Analysis of New Report
            3. Existing Issue Data (from DB)

            Task:
            Determine if the new report provides NEW or UPDATED info (e.g., higher severity, new location details, different crisis type, more casualties).
            - If it's effectively the same or less info, return has_updates=false.
            - If there are material changes, return has_updates=true and the FULL updated analysis object (merging old and new info, prioritizing new facts).
            
            Return JSON matching the schema.`,
        });

        // Use a slightly modified schema that includes 'has_updates'
        const updateSchema = {
            type: 'object',
            properties: {
                has_updates: {type: 'boolean'},
                updated_analysis: crisisJsonSchema, // Reuse existing schema definition
            },
            required: ['has_updates'],
        };

        const prompt = `
        EXISTING ISSUE: ${JSON.stringify(existingIssue)}
        
        NEW REPORT: ${newText}
        
        NEW REPORT ML DATA: ${JSON.stringify(mlOutput)}
        
        Analyze for updates.
        `;

        const result = await model.generateContent({
            contents: [{role: 'user', parts: [{text: prompt}]}],
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: updateSchema,
            },
        });

        const responseText = result.response.text();
        return JSON.parse(responseText);
    } catch (error) {
        console.error('Gemini Update Check Failed:', error);
        return {has_updates: false};
    }
};

export const verifyNgoNeeds = async (candidates) => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: 'gemini-3-flash-preview',
            systemInstruction: `You are a crisis resource allocator. Analyze NGOs to determine funding priority.
            
            Principles:
            1. High Aggregate Severity of nearby crises increases priority.
            2. Low Current Funds increases priority significantly.
            3. High Funds decreases priority even if severity is high (they can handle it).
            
            Output a JSON object with a list of scored NGOs.`,
        });

        // Minimize tokens: Only send essential data for top candidates
        const minimalInput = candidates.map((n) => ({
            id: n._id,
            funds: n.currentFund,
            severity: n.metrics.totalSeverityPoints,
            issues: n.metrics.activeIncidentsNearby,
        }));

        const schema = {
            type: 'object',
            properties: {
                analysis: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: {type: 'string'},
                            score: {
                                type: 'number',
                                description: 'Urgency score 0-100',
                            },
                            reason: {
                                type: 'string',
                                description: 'Brief reason for score',
                            },
                        },
                        required: ['id', 'score'],
                    },
                },
            },
        };

        const result = await model.generateContent({
            contents: [
                {role: 'user', parts: [{text: JSON.stringify(minimalInput)}]},
            ],
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: schema,
            },
        });

        return JSON.parse(result.response.text());
    } catch (error) {
        console.warn('Gemini NGO analysis failed:', error.message);
        return {analysis: []};
    }
};

export default getRefinedAnalysis;
