import nodemailer from 'nodemailer';
import path from 'path';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.APP_NAME,
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

export default sendEmail;
