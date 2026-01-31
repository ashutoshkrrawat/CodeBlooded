import Issue from '../model/Issue.model.js';
import NGO from '../model/Ngo.model.js';
import {asyncHandler, ApiError, ApiResponse} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';
import {analyzeCrisis} from '../services/ml.service.js';
import getRefinedAnalysis, {
    checkCrisisUpdate,
} from '../services/gemini.service.js';
import NodeGeocoder from 'node-geocoder';

// Initialize Geocoder (OpenStreetMap is free, no key required)
const geocoder = NodeGeocoder({
    provider: 'openstreetmap',
});

// Reusable handler for both API and Cron
export const handleCrisisReporting = async (
    text,
    source = 'manual',
    location = ''
) => {
    // 1. Initial ML Analysis
    const rawAiResult = await analyzeCrisis(text, source, location);
    if (!rawAiResult) return null;

    const {
        is_crisis,
        location: locationData,
        type_classification,
    } = rawAiResult;

    if (!is_crisis) {
        // Run full analysis just to return the structured non-crisis result if needed
        const fullAnalysis = await getRefinedAnalysis(text, rawAiResult);
        return {is_crisis: false, aiAnalysis: fullAnalysis};
    }

    // 2. New Issue Creation
    const aiResult = await getRefinedAnalysis(text, rawAiResult);

    const detectedLocation = aiResult?.location?.name || 'Unknown';
    let geoCoordinates = {
        type: 'Point',
        coordinates: [0, 0],
    };

    // Try to get coordinates from ML or Geocoder
    // if (locationData?.coordinates?.lat && locationData?.coordinates?.lon) {
    //     geoCoordinates.coordinates = [
    //         locationData.coordinates.lon,
    //         locationData.coordinates.lat,
    //     ];
    // } else if (rawAiResult?.location?.coordinates?.lat) {
    //     geoCoordinates.coordinates = [
    //         locationData.coordinates.lon,
    //         locationData.coordinates.lat,
    //     ];
    // }

    // Fallback Geocoding
    if (
        geoCoordinates.coordinates[0] === 0 &&
        detectedLocation &&
        detectedLocation !== 'Unknown'
    ) {
        try {
            const geoRes = await geocoder.geocode(detectedLocation);
            if (geoRes.length > 0) {
                geoCoordinates.coordinates = [
                    geoRes[0].longitude,
                    geoRes[0].latitude,
                ];
            }
        } catch (e) {
            console.warn('Geocoding failed');
        }
    }

    const severityScore = aiResult.severity?.overall || 0;
    const crisisType = aiResult.type_classification?.type || 'Others';

    const matchingNGOs = await NGO.find({
        address: {$regex: detectedLocation, $options: 'i'},
    });

    const newIssue = await Issue.create({
        title: `Crisis Alert: ${crisisType} in ${detectedLocation}`,
        description: text,
        type: mapCrisisTypeToEnum(crisisType),
        severity: severityScore,
        // ❌ REMOVED: location: aiResult?.location.name,
        // ✅ Use aiAnalysis.location.name instead on frontend
        coordinates: geoCoordinates,
        date: new Date(),
        aiAnalysis: aiResult,
        handledBy: matchingNGOs.map((ngo) => ngo._id),
        isEmailSent: false,
    });

    return {is_crisis: true, status: 'created', issue: newIssue};
};

export const processCrisisReport = asyncHandler(async (req, res) => {
    const {text, source = 'Economic Times'} = req.body;
    const location = ''; // Default if not provided in body, or destructure if available

    if (!text) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'Crisis report text is required'
        );
    }

    // Delegate to reusable handler
    const result = await handleCrisisReporting(text, source, location);

    if (!result) {
        throw new ApiError(statusCode.INTERNAL_SERVER_ERROR, 'Analysis failed');
    }

    console.log(result);

    if (!result.is_crisis) {
        return res.status(statusCode.OK).json(
            new ApiResponse(
                statusCode.OK,
                {
                    issue: {
                        title: 'No Crisis Detected',
                        description: text,
                        aiAnalysis: result.aiAnalysis,
                    },
                },
                'Report analyzed: Not a crisis, no action taken.'
            )
        );
    }

    return res
        .status(
            result.status === 'created' ? statusCode.CREATED : statusCode.OK
        )
        .json({
            statusCode:
                result.status === 'created'
                    ? statusCode.CREATED
                    : statusCode.OK,
            data: {
                issue: result.issue,
                status: result.status,
            },
            success: true,
        });
});

// Helper to map ML types to Schema Enum
const mapCrisisTypeToEnum = (mlType) => {
    if (!mlType) return 'others';
    const type = mlType.toLowerCase();
    if (
        ['disaster', 'flood', 'earthquake', 'fire', 'cyclone', 'tsunami'].some(
            (t) => type.includes(t)
        )
    )
        return 'disaster';
    if (
        ['disease', 'epidemic', 'virus', 'outbreak', 'health'].some((t) =>
            type.includes(t)
        )
    )
        return 'disease';
    return 'others';
};
