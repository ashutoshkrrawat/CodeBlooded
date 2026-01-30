import Router from 'express';

import {
    createPaymentOrder,
    verifyPayment,
    paymentFailed,
    getPaymentDetails,
} from '../controllers/payment.controller.js';

const router = Router();

router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPayment);
router.post('/failed', paymentFailed);
router.get('/:orderId', getPaymentDetails);

export default router;
