import Router from 'express';

import {
    createPaymentOrder,
    verifyPayment,
    paymentFailed,
    getPaymentDetails,
} from '../controllers/payment.controller.js';
import {verifyAccessToken} from '../middlewares/index.js';

const router = Router();

router.post('/create-order', verifyAccessToken, createPaymentOrder);
router.post('/verify', verifyPayment);
router.post('/failed', paymentFailed);
router.get('/:orderId', getPaymentDetails);

export default router;
