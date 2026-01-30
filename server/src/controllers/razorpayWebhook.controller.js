import crypto from 'crypto';
import Payment from '../model/Payment.model.js';
import NGO from '../model/Ngo.model.js';
import statusCode from '../constants/statusCode.js';
import {ApiError} from '../utility';

export const handleRazorpayWebhook = async (req, res) => {
    const webhookSignature = req.headers['x-razorpay-signature'];

    if (!webhookSignature) {
        return res.sendStatus(statusCode.BAD_REQUEST);
    }

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(req.body)
        .digest('hex');

    if (expectedSignature !== webhookSignature) {
        return res.sendStatus(statusCode.UNAUTHORIZED);
    }

    const event = req.body.event;
    const payload = req.body.payload;

    try {
        switch (event) {
            case 'payment.captured': {
                const paymentEntity = payload.payment.entity;

                const payment = await Payment.findOne({
                    razorpayOrderId: paymentEntity.order_id,
                });

                if (!payment || payment.status === 'paid') break;

                payment.razorpayPaymentId = paymentEntity.id;
                payment.status = 'paid';
                payment.isVerified = true;
                payment.method = paymentEntity.method;
                payment.paidAt = new Date(paymentEntity.created_at * 1000);

                await payment.save();

                await NGO.findByIdAndUpdate(payment.ngoId, {
                    $inc: {currentFund: payment.amount},
                });

                break;
            }

            case 'payment.failed': {
                const paymentEntity = payload.payment.entity;

                await Payment.findOneAndUpdate(
                    {razorpayOrderId: paymentEntity.order_id},
                    {
                        status: 'failed',
                        failureReason:
                            paymentEntity.error_description || 'Payment failed',
                    }
                );
                break;
            }

            case 'refund.processed': {
                const refundEntity = payload.refund.entity;

                await Payment.findOneAndUpdate(
                    {razorpayPaymentId: refundEntity.payment_id},
                    {
                        status: 'refunded',
                        refundId: refundEntity.id,
                        refundedAt: new Date(refundEntity.created_at * 1000),
                    }
                );
                break;
            }

            default:
                break;
        }

        return res.status(200).json({received: true});
    } catch (err) {
        return res.sendStatus(statusCode.INTERNAL_SERVER_ERROR);
    }
};
