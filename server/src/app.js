import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import checkHealth from './controllers/checkHealth.controller.js';
import {errorHandler} from './middlewares/index.js';
import morgan from 'morgan';
import webhookRoutes from './routes/webhook.routes.js';
import userRoutes from './routes/user.routes.js';
import ngoRoutes from './routes/ngo.routes.js';
import paymentRoutes from './routes/payment.routes.js';

const app = express();

app.use(morgan('dev'));

const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);

app.use('/api/v1/webhooks/razorpay', express.raw({type: 'application/json'}));

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(cookieParser());

// API Routes

app.get('/', checkHealth);
app.get('/api/v1/check-health', checkHealth);

app.use('/api/v1/webhooks', webhookRoutes);

app.use('/api/v1/user', userRoutes);
app.use('/api/v1/ngo', ngoRoutes);
app.use('/api/v1/payment', paymentRoutes);

// Error Handling
app.use(errorHandler());

export default app;
