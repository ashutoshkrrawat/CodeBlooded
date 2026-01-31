import {asyncHandler, ApiResponse} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';
import {scrapeAllDisasterNews} from '../scraper/index.js';
import {handleCrisisReporting} from './crisis.controller.js';

export const triggerManualScrape = asyncHandler(async (req, res) => {
    console.log('Starting manual scraper trigger...');

    // 1. Scrape News
    const articles = await scrapeAllDisasterNews();
    const results = [];

    console.log(`Scraper found ${articles.length} articles. Processing...`);

    // 2. Process each article
    for (const article of articles) {
        try {
            const text = article.content || article.title;
            if (!text) continue;

            const result = await handleCrisisReporting(
                text,
                'Scraper - Manual Trigger',
                ''
            );

            console.log(result);

            if (result && result.status) {
                results.push({
                    title: article.title,
                    status: result.status,
                    issueId: result.issue?._id,
                    analysis: result.issue?.aiAnalysis,
                });
            } else {
                results.push({
                    title: article.title,
                    status: 'ignored/not-crisis',
                    analysis: result?.aiAnalysis,
                });
            }
        } catch (err) {
            console.error(
                `Error processing article "${article.title}":`,
                err.message
            );
            results.push({
                title: article.title,
                status: 'error',
                error: err.message,
            });
        }
    }

    return res.status(statusCode.OK).json(
        new ApiResponse(
            statusCode.OK,
            {
                totalScraped: articles.length,
                processed: results,
            },
            'Manual scraping completed successfully.'
        )
    );
});
