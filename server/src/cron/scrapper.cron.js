import cron from 'node-cron';
import {scrapeAllDisasterNews} from '../scraper/index.js';
import {handleCrisisReporting} from '../controllers/crisis.controller.js';

export const startScraperCron = () => {
    // Run every day at 4:00 AM
    cron.schedule('0 4 * * *', async () => {
        console.log('Running daily scraper cron job at 4 AM');
        try {
            const articles = await scrapeAllDisasterNews();

            console.log(
                `Scraper found ${articles.length} articles. Processing...`
            );

            for (const article of articles) {
                try {
                    // Use article content as the report text
                    // Source is the link or 'Economic Times'
                    const text = article.content || article.title;
                    if (!text) continue;

                    const result = await handleCrisisReporting(
                        text,
                        'Scraper - Economic Times',
                        ''
                    );

                    if (result && result.status) {
                        console.log(
                            `Article "${article.title.substring(0, 30)}..." processed: ${result.status}`
                        );
                    }
                } catch (err) {
                    console.error(
                        `Error processing article "${article.title}":`,
                        err.message
                    );
                }
            }
            console.log('Scraper cron job processed all articles.');
        } catch (error) {
            console.error('Error during scraper cron job:', error);
        }
    });
};
