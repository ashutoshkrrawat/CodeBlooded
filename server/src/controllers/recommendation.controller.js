import NGO from '../model/Ngo.model.js';
import Issue from '../model/Issue.model.js';
import {asyncHandler, ApiResponse} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';

import {verifyNgoNeeds} from '../services/gemini.service.js';

export const getRecommendedNGOs = asyncHandler(async (req, res) => {
    // 1. Fetch all NGOs
    const ngos = await NGO.find({});

    // 2. Fetch all Active Issues
    const activeIssues = await Issue.find({
        status: {$in: ['OPEN', 'IN_PROGRESS']},
    });

    // 3. Calculate metrics for each NGO (but no score yet)
    let evaluatedNGOs = ngos
        .map((ngo) => {
            // Filter issues relevant to this NGO
            const relevantIssues = activeIssues.filter((issue) => {
                if (!issue.aiAnalysis?.location?.name || !ngo.address)
                    return false;

                const issueLoc = issue.aiAnalysis.location.name.toLowerCase();
                const ngoAddr = ngo.address.toLowerCase();

                return ngoAddr.includes(issueLoc) || issueLoc.includes(ngoAddr);
            });

            // Sum severity (0-1 scale)
            const totalSeverity = relevantIssues.reduce(
                (sum, issue) => sum + (issue.severity || 0),
                0
            );
            const issueCount = relevantIssues.length;

            // Return candidate only if relevant incidents exist
            if (issueCount === 0) return null;

            return {
                _id: ngo._id.toString(),
                name: ngo.name,
                address: ngo.address,
                phone: ngo.phone,
                email: ngo.email,
                type: ngo.type,
                website: ngo.website,
                currentFund: ngo.currentFund,
                metrics: {
                    activeIncidentsNearby: issueCount,
                    totalSeverityPoints: parseFloat(totalSeverity.toFixed(2)),
                    // No math formula score
                },
            };
        })
        .filter(Boolean); // Remove nulls

    // 4. Send to Gemini for Analysis
    if (evaluatedNGOs.length > 0) {
        const aiResult = await verifyNgoNeeds(evaluatedNGOs);

        if (aiResult?.analysis) {
            const scoreMap = new Map(aiResult.analysis.map((a) => [a.id, a]));

            evaluatedNGOs.forEach((ngo) => {
                const aiData = scoreMap.get(ngo._id);
                if (aiData) {
                    ngo.metrics.urgencyScore = aiData.score;
                    ngo.metrics.aiReasoning = aiData.reason;
                } else {
                    ngo.metrics.urgencyScore = 0; // Default if AI didn't score it
                }
            });
        }
    }

    // 5. Sort by AI Score
    evaluatedNGOs.sort(
        (a, b) => (b.metrics.urgencyScore || 0) - (a.metrics.urgencyScore || 0)
    );

    return res.status(statusCode.OK).json(
        new ApiResponse(
            statusCode.OK,
            'NGO recommendations based on funds and local crisis severity',
            {
                count: evaluatedNGOs.length,
                listing: evaluatedNGOs,
            }
        )
    );
});
