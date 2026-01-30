import crypto from 'crypto';
import razorpay from '../config/razorpay.config.js';
import Payment from '../model/Payment.model.js';
import NGO from '../model/Ngo.model.js';
import statusCode from '../constants/statusCode.js';
import {asyncHandler} from '../utility';
import {ApiError} from '../utility';
import {ApiResponse} from '../utility';

export const createPaymentOrder = asyncHandler(async (req, res) => {
    const {ngoId, amount, donorName, donorEmail, donorPhone} = req.body;

    if (!ngoId || !amount) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'NGO ID and amount are required'
        );
    }

    const ngo = await NGO.findById(ngoId);
    if (!ngo) {
        throw new ApiError(statusCode.NOT_FOUND, 'NGO not found');
    }

    const order = await razorpay.orders.create({
        amount: amount * 100,
        currency: 'INR',
        receipt: `RCPT_${Date.now()}`,
    });

    const payment = await Payment.create({
        ngoId,
        donorName,
        donorEmail,
        donorPhone,
        amount,
        currency: 'INR',
        razorpayOrderId: order.id,
        receipt: order.receipt,
        status: 'created',
    });

    return res.status(statusCode.CREATED).json(
        new ApiResponse(
            statusCode.CREATED,
            {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                key: process.env.RAZORPAY_KEY_ID,
            },
            'Payment order created'
        )
    );
});

export const verifyPayment = asyncHandler(async (req, res) => {
    const {razorpay_order_id, razorpay_payment_id, razorpay_signature} =
        req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'Payment verification data missing'
        );
    }

    const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    if (generatedSignature !== razorpay_signature) {
        throw new ApiError(
            statusCode.UNAUTHORIZED,
            'Invalid payment signature'
        );
    }

    const payment = await Payment.findOne({
        razorpayOrderId: razorpay_order_id,
    });

    if (!payment) {
        throw new ApiError(statusCode.NOT_FOUND, 'Payment record not found');
    }

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = 'paid';
    payment.isVerified = true;
    payment.paidAt = new Date();

    await payment.save();

    await NGO.findByIdAndUpdate(payment.ngoId, {
        $inc: {currentFund: payment.amount},
    });

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(
                statusCode.OK,
                null,
                'Payment verified successfully'
            )
        );
});

export const paymentFailed = asyncHandler(async (req, res) => {
    const {razorpay_order_id, reason} = req.body;

    if (!razorpay_order_id) {
        throw new ApiError(statusCode.BAD_REQUEST, 'Order ID is required');
    }

    const payment = await Payment.findOne({
        razorpayOrderId: razorpay_order_id,
    });

    if (!payment) {
        throw new ApiError(statusCode.NOT_FOUND, 'Payment not found');
    }

    payment.status = 'failed';
    payment.failureReason = reason || 'Payment failed';

    await payment.save();

    return res
        .status(statusCode.OK)
        .json(new ApiResponse(statusCode.OK, null, 'Payment marked as failed'));
});

export const getPaymentDetails = asyncHandler(async (req, res) => {
    const {orderId} = req.params;

    const payment = await Payment.findOne({
        razorpayOrderId: orderId,
    });

    if (!payment) {
        throw new ApiError(statusCode.NOT_FOUND, 'Payment not found');
    }

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(statusCode.OK, payment, 'Payment details fetched')
        );
});
