import Router from 'express';

import {
    createPaymentOrder,
    verifyPayment,
    paymentFailed,
    getPaymentDetails,
    getUserDonationSummary,
    getAllUsersDonations,
    getDonationsByNgo,
} from '../controllers/payment.controller.js';
import {verifyAccessToken} from '../middlewares/index.js';

const router = Router();

router.post('/create-order', verifyAccessToken, createPaymentOrder);
router.post('/verify-payment', verifyPayment);
router.post('/failed', paymentFailed);
router.get('/user/donations', verifyAccessToken, getUserDonationSummary);
router.get('/user-donations', getAllUsersDonations);
router.get('/ngo-donations', getDonationsByNgo);
router.get('/:orderId', getPaymentDetails);

export default router;
