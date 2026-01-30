import Issue from '../model/Issue.model.js';
import NGO from '../model/Ngo.model.js';
import {asyncHandler, ApiError, ApiResponse} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';
import {analyzeCrisis} from '../services/ml.service.js';
import getRefinedAnalysis from '../services/gemini.service.js';
import NodeGeocoder from 'node-geocoder';

// Initialize Geocoder (OpenStreetMap is free, no key required)
const geocoder = NodeGeocoder({
    provider: 'openstreetmap',
});

export const processCrisisReport = asyncHandler(async (req, res) => {
    const {text, source, location} = req.body;

    if (!text) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'Crisis report text is required'
        );
    }

    const rawAiResult = await analyzeCrisis(text, source, location);

    if (!rawAiResult) {
        throw new ApiError(
            statusCode.INTERNAL_SERVER_ERROR,
            'Failed to analyze crisis report'
        );
    }

    let aiResult;
    try {
        aiResult = await getRefinedAnalysis(text, rawAiResult);
    } catch (e) {
        console.error('Refinement failed, using raw result', e);
        aiResult = rawAiResult;
    }
    const {
        is_crisis,
        location: locationData,
        severity,
        priority,
        type_classification,
        explanation,
    } = aiResult;

    if (!is_crisis) {
        return res.status(statusCode.OK).json(
            new ApiResponse(
                statusCode.OK,
                {
                    issue: {
                        title: 'No Crisis Detected',
                        description: text,
                        aiAnalysis: aiResult,
                    },
                },
                'Report analyzed: Not a crisis, no action taken.'
            )
        );
    }

    const detectedLocation = locationData?.name || location || 'Unknown';
    const severityScore = severity?.overall || 0;
    const priorityLevel = priority?.level || 'LOW';
    const crisisType = type_classification?.type || 'Others';

    // Extract Lat/Lon for GeoJSON
    let geoCoordinates = {
        type: 'Point',
        coordinates: [0, 0], // Default [Lon, Lat]
    };

    if (locationData?.coordinates?.lat && locationData?.coordinates?.lon) {
        geoCoordinates.coordinates = [
            locationData.coordinates.lon,
            locationData.coordinates.lat,
        ];
    } else if (rawAiResult?.location?.coordinates?.lat) {
        // Fallback to raw ML result if Gemini dropped it
        geoCoordinates.coordinates = [
            rawAiResult.location.coordinates.lon,
            rawAiResult.location.coordinates.lat,
        ];
    }

    // Fallback Geocoding if coordinates are still missing (0,0)
    if (
        geoCoordinates.coordinates[0] === 0 &&
        geoCoordinates.coordinates[1] === 0 &&
        detectedLocation &&
        detectedLocation !== 'Unknown'
    ) {
        try {
            console.log(`🌍 Geocoding location: ${detectedLocation}`);
            const geoRes = await geocoder.geocode(detectedLocation);
            if (geoRes.length > 0) {
                geoCoordinates.coordinates = [
                    geoRes[0].longitude,
                    geoRes[0].latitude,
                ];
                console.log(
                    `✅ Geocoded to: ${geoCoordinates.coordinates.join(', ')}`
                );
            }
        } catch (err) {
            console.warn(
                `⚠️ Geocoding failed for ${detectedLocation}:`,
                err.message
            );
        }
    }

    const matchingNGOs = await NGO.find({
        address: {$regex: detectedLocation, $options: 'i'},
    });

    const ngoIds = matchingNGOs.map((ngo) => ngo._id);

    const newIssue = await Issue.create({
        title: `Crisis Alert: ${crisisType} in ${detectedLocation}`,
        description: text,
        type: mapCrisisTypeToEnum(crisisType),
        severity: severityScore,
        pinCode: '000000',
        location: detectedLocation,
        coordinates: geoCoordinates, // Save GeoJSON
        date: new Date(),
        aiAnalysis: aiResult,
        handledBy: ngoIds,
        isEmailSent: false,
    });

    return res.status(statusCode.CREATED).json({
        statusCode: statusCode.CREATED,
        data: {
            issue: newIssue,
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
