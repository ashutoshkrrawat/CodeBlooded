import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        ngoId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'NGO',
            required: true,
            index: true,
        },

        // Razorpay identifiers
        razorpayOrderId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        razorpayPaymentId: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
        },
        razorpaySignature: {
            type: String,
            select: false,
        },

        // Payment details

        //! Note: Amount is in the smallest currency unit (e.g., paise for INR)
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            default: 'INR',
        },
        receipt: {
            type: String,
        },

        status: {
            type: String,
            enum: ['created', 'paid', 'failed', 'refunded'],
            default: 'created',
            index: true,
        },

        method: {
            type: String,
            default: '',
        },

        isVerified: {
            type: Boolean,
            default: false,
            index: true,
        },

        failureReason: {
            type: String,
            default: '',
        },

        // Refund details (optional)
        refundId: {
            type: String,
            default: '',
        },
        refundedAt: {
            type: Date,
        },

        paidAt: {
            type: Date,
        },
    },
    {timestamps: true}
);

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
