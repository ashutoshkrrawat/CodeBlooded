import cron from 'node-cron';
import axios from 'axios';
import Issue from '../model/Issue.model.js';

const ISSUE_API_URL = process.env.MODEL_SERVER_URL;

let cronStarted = false;

// Calls the API to fetch all the ongoing issues at 10 AM everyday
// Fetches all the issues from the Model_Server and all deletes one month old issues
export const startIssueCron = () => {

    if (cronStarted) return;
    cronStarted = true;

    cron.schedule(
        '0 10 * * *',
        async () => {
            try {
                console.log('Running daily issue sync cron!');

                const response = await axios.get(ISSUE_API_URL);
                const issues = response.data;

                if (!Array.isArray(issues)) {
                    console.error('Invalid issues response');
                    return;
                }

                for (const issue of issues) {
                    await Issue.create({
                        title: issue?.title,
                        description: issue?.description,
                        type: issue?.type,
                        severity: issue?.severity,
                        pinCode: issue?.pinCode,
                        location: issue?.location,
                        date: new Date(issue.date),
                    });
                }

                // Delete issues older than 1 month
                const oneMonthAgo = new Date();
                oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

                const deleteResult = await Issue.deleteMany({
                    date: {$lt: oneMonthAgo},
                });

                console.log(`Inserted ${issues.length} issues`);
            } catch (error) {
                console.error('Issue cron failed:', error.message);
            }
        },
        {
            timezone: 'Asia/Kolkata',
        }
    );
};
