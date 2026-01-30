import nodemailer from 'nodemailer';
import {severeIssueAlertTemplate} from '../constants/emailTemplate.js';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASS
    },
});

const sendEmail = async ({to, subject, html}) => {
    await transporter.sendMail({
        from: `<${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    });
};

export const sendSevereIssueAlertEmail = async ({
    to,
    name,
    pinCode,
    issues,
}) => {
    if (!to || !issues || !issues.length) return;

    await sendEmail({
        to,
        subject: 'Severe Issue Alert in Your Area',
        html: severeIssueAlertTemplate({
            name,
            pinCode,
            issues,
        }),
    });
};

export default sendEmail;
