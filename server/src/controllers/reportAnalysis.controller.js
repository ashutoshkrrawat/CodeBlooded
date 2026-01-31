import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { asyncHandler, ApiError, ApiResponse } from '../utility/index.js';
import statusCode from '../constants/statusCode.js';
import upload from '../middlewares/upload.middleware.js';
import { uploadToCloudinary } from '../services/cloudinary.service.js';

dotenv.config();

const ai = new GoogleGenAI(
    { apiKey: process.env.GEMINI_API_KEY }
);

/**
 * Verify if an image matches the provided description and check for AI generation
 */
async function verifyImage(imageUrl, reportData) {
    const { title, description, fundsUsed, location } = reportData;
    
    // Fetch image and convert to base64
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const base64ImageData = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = imageUrl.includes(".png") ? "image/png" : "image/jpeg";
    
    const contents = [
        {
            inlineData: {
                mimeType: mimeType,
                data: base64ImageData,
            },
        },
        {
            text: `You are an expert image verification system for an NGO crisis relief platform.
Your task is to verify proof-of-work images submitted by field workers.

REPORT DATA:
- Title: "${title}"
- Description of work: "${description}"
- Funds utilized: ${fundsUsed ? `₹${fundsUsed}` : "Not specified"}
- Location: ${location ? `Lat: ${location.latitude}, Lng: ${location.longitude}` : "Not provided"}

ANALYSIS REQUIRED:
1. **Content Verification**: Does the image show relief/humanitarian work matching the description?
2. **AI Detection**: Is this image AI-generated or digitally manipulated?
3. **Location Consistency**: Based on visible environmental cues, does it appear consistent with India?
4. **Authenticity Markers**: Look for signs of genuine field work vs. staged/fake submissions.
5. **Fund Justification**: Does the visible work appear consistent with the claimed expenditure?

Respond ONLY with a JSON object:
{
    "verification": {
        "status": "VERIFIED" | "SUSPICIOUS" | "REJECTED",
        "confidence": 0.95,
        "matches_description": true,
        "description_analysis": "Explanation of how well the image matches the claimed work"
    },
    "ai_detection": {
        "is_ai_generated": false,
        "confidence": 0.90,
        "indicators": []
    },
    "location_analysis": {
        "appears_consistent": true,
        "confidence": 0.85,
        "observations": "Environmental cues analyzed",
        "anomalies": []
    },
    "fund_assessment": {
        "appears_justified": true,
        "confidence": 0.80,
        "observations": "Whether visible work justifies the claimed expenditure"
    },
    "authenticity": {
        "appears_genuine": true,
        "red_flags": [],
        "positive_indicators": ["Signs of genuine field work"]
    },
    "overall_score": 85,
    "recommendation": "APPROVE" | "MANUAL_REVIEW" | "REJECT",
    "summary": "Brief overall assessment"
}`
        },
    ];

    const aiResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: contents,
    });

    const text = aiResponse.text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(text);
}

/**
 * Analyze multiple images for a comprehensive report
 */
async function analyzeMultipleImages(imageUrls, reportData) {
    const results = [];
    
    for (const imageData of imageUrls) {
        try {
            const analysis = await verifyImage(imageData.url, reportData);
            results.push({
                filename: imageData.filename,
                url: imageData.url,
                analysis
            });
        } catch (error) {
            results.push({
                filename: imageData.filename,
                url: imageData.url,
                error: error.message
            });
        }
    }
    
    return results;
}

/**
 * Generate overall report assessment from individual image analyses
 */
async function generateOverallAssessment(imageAnalyses, reportData) {
    const contents = [
        {
            text: `You are evaluating a proof-of-work report from an NGO field worker.

REPORT DATA:
- Title: ${reportData.title}
- Description: ${reportData.description}
- Funds Used: ₹${reportData.fundsUsed || 0}
- Location: ${reportData.location ? `Lat: ${reportData.location.latitude}, Lng: ${reportData.location.longitude}` : "Not provided"}
- Submitted at: ${new Date().toISOString()}
- Number of images: ${imageAnalyses.length}

INDIVIDUAL IMAGE ANALYSES:
${JSON.stringify(imageAnalyses, null, 2)}

Provide an OVERALL assessment as JSON:
{
    "overall_status": "APPROVED" | "PENDING_REVIEW" | "REJECTED",
    "confidence_score": 0.85,
    "summary": "Overall assessment of the report",
    "key_concerns": [],
    "verified_elements": ["List what was verified"],
    "fund_utilization_assessment": "Whether funds seem appropriately used",
    "recommendation": "Action recommendation",
    "fraud_risk": "LOW" | "MEDIUM" | "HIGH",
    "notes_for_reviewer": "Additional notes if manual review needed"
}`
        }
    ];

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: contents,
    });

    const text = response.text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(text);
}

/**
 * Upload images to Cloudinary
 */
async function uploadImagesToCloudinary(files) {
    const uploadResults = [];
    
    for (const file of files) {
        const result = await uploadToCloudinary(file.buffer, 'ngo/report-analysis');
        uploadResults.push({
            filename: file.originalname,
            url: result.secure_url,
            public_id: result.public_id
        });
    }
    
    return uploadResults;
}

/**
 * Main handler for report analysis
 * Expects multipart form data with:
 * - images: Array of image files (proof of work)
 * - title: Report title
 * - description: Text description of the work done
 * - fundsUsed: Amount of funds utilized
 * - latitude: (optional) GPS latitude
 * - longitude: (optional) GPS longitude
 */
export const handleReportAnalysis = (req, res, next) => {
    upload.array('images', 10)(req, res, async (err) => {
        if (err) {
            return res.status(statusCode.BAD_REQUEST).json(
                new ApiResponse(statusCode.BAD_REQUEST, err.message, null)
            );
        }

        const { title, description, fundsUsed, latitude, longitude } = req.body;
        const files = req.files;

        // Validation
        if (!files || files.length === 0) {
            return res.status(statusCode.BAD_REQUEST).json(
                new ApiResponse(
                    statusCode.BAD_REQUEST,
                    "At least one image is required as proof of work",
                    null
                )
            );
        }

        if (!title) {
            return res.status(statusCode.BAD_REQUEST).json(
                new ApiResponse(statusCode.BAD_REQUEST, "Title is required", null)
            );
        }

        if (!description) {
            return res.status(statusCode.BAD_REQUEST).json(
                new ApiResponse(statusCode.BAD_REQUEST, "Description is required", null)
            );
        }

        // Parse location if provided
        const location = latitude && longitude 
            ? { latitude: parseFloat(latitude), longitude: parseFloat(longitude) }
            : null;

        const reportData = {
            title,
            description,
            fundsUsed: fundsUsed ? parseFloat(fundsUsed) : null,
            location
        };

        try {
            console.log(`📊 Analyzing report: "${title}" with ${files.length} images...`);
            
            // Upload images to Cloudinary
            console.log(`☁️ Uploading ${files.length} images to Cloudinary...`);
            const uploadedImages = await uploadImagesToCloudinary(files);
            
            // Analyze each image using Cloudinary URLs
            console.log(`🔍 Analyzing images with AI...`);
            const imageAnalyses = await analyzeMultipleImages(uploadedImages, reportData);
            
            // Generate overall assessment
            console.log(`📝 Generating overall assessment...`);
            const overallAssessment = await generateOverallAssessment(imageAnalyses, reportData);

            // Calculate aggregate statistics
            const stats = {
                total_images: files.length,
                verified_count: imageAnalyses.filter(r => r.analysis?.verification?.status === "VERIFIED").length,
                suspicious_count: imageAnalyses.filter(r => r.analysis?.verification?.status === "SUSPICIOUS").length,
                rejected_count: imageAnalyses.filter(r => r.analysis?.verification?.status === "REJECTED").length,
                ai_generated_count: imageAnalyses.filter(r => r.analysis?.ai_detection?.is_ai_generated).length
            };

            return res.status(statusCode.OK).json(
                new ApiResponse(
                    statusCode.OK,
                    "Report analyzed successfully",
                    {
                        report: {
                            title,
                            description,
                            fundsUsed: reportData.fundsUsed,
                            location,
                            submitted_at: new Date().toISOString()
                        },
                        uploaded_images: uploadedImages,
                        statistics: stats,
                        image_analyses: imageAnalyses,
                        overall_assessment: overallAssessment
                    }
                )
            );

        } catch (error) {
            console.error("Report analysis error:", error);

            return res.status(statusCode.INTERNAL_SERVER_ERROR).json(
                new ApiResponse(
                    statusCode.INTERNAL_SERVER_ERROR,
                    "Failed to analyze report: " + error.message,
                    null
                )
            );
        }
    });
};

/**
 * Quick verify endpoint for single image
 */
export const handleQuickVerify = (req, res, next) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            return res.status(statusCode.BAD_REQUEST).json(
                new ApiResponse(statusCode.BAD_REQUEST, err.message, null)
            );
        }

        const { title, description, fundsUsed, latitude, longitude } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(statusCode.BAD_REQUEST).json(
                new ApiResponse(statusCode.BAD_REQUEST, "Image is required", null)
            );
        }

        if (!description) {
            return res.status(statusCode.BAD_REQUEST).json(
                new ApiResponse(statusCode.BAD_REQUEST, "Description is required", null)
            );
        }

        const location = latitude && longitude 
            ? { latitude: parseFloat(latitude), longitude: parseFloat(longitude) }
            : null;

        const reportData = {
            title: title || "Quick Verification",
            description,
            fundsUsed: fundsUsed ? parseFloat(fundsUsed) : null,
            location
        };

        try {
            // Upload to Cloudinary
            const cloudinaryResult = await uploadToCloudinary(file.buffer, 'ngo/report-analysis');
            
            // Analyze the image
            const analysis = await verifyImage(cloudinaryResult.secure_url, reportData);

            return res.status(statusCode.OK).json(
                new ApiResponse(
                    statusCode.OK,
                    "Image verified successfully",
                    {
                        filename: file.originalname,
                        url: cloudinaryResult.secure_url,
                        analysis
                    }
                )
            );
        } catch (error) {
            return res.status(statusCode.INTERNAL_SERVER_ERROR).json(
                new ApiResponse(
                    statusCode.INTERNAL_SERVER_ERROR,
                    "Verification failed: " + error.message,
                    null
                )
            );
        }
    });
};
