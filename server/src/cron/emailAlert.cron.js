import cron from 'node-cron';
import Issue from '../model/Issue.model.js';
import User from '../model/User.model.js';

// Send emailAlert via CRON and NodeMailer to all the Users that might be affected by certain issues with high severity in their locality

export const startSevereIssueAlertCron = () => {
    cron.schedule(
        '0 13 * * *',
        async () => {
            try {
                console.log('Running severe issue alert cron');

                // Fetch severe issues
                const issues = await Issue.find({
                    severity: {$gt: 65},
                    isEmailSent: false,
                });

                if (!issues.length) {
                    console.log('No severe issues found');
                    return;
                }

                // Group issues by pinCode
                const issuesByPinCode = {};

                for (const issue of issues) {
                    if (!issue.pinCode) continue;

                    if (!issuesByPinCode[issue.pinCode]) {
                        issuesByPinCode[issue.pinCode] = [];
                    }

                    issuesByPinCode[issue.pinCode].push(issue);
                }

                // For each pinCode, notify users
                for (const pinCode of Object.keys(issuesByPinCode)) {
                    const users = await User.find({pinCode});

                    if (!users.length) continue;

                    for (const user of users) {
                        await sendSevereIssueAlertEmail({
                            to: user.email,
                            name: user.name,
                            pinCode,
                            issues: issuesByPinCode[pinCode],
                        });
                    }
                }

                await Issue.updateMany(
                    {_id: {$in: issues.map((i) => i._id)}},
                    {$set: {isEmailSent: true}}
                );

                console.log('Severe issue alert emails sent');
            } catch (error) {
                console.error('Severe issue alert cron failed:', error.message);
            }
        },
        {
            timezone: 'Asia/Kolkata',
        }
    );
};
