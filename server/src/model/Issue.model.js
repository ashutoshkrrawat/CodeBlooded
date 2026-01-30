import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        type: {
            type: String,
            enum: ['disaster', 'disease', 'others'],
            required: true,
            index: true,
        },
        severity: {
            type: Number,
            required: true,
            trim: true,
        },
        pinCode: {
            type: String,
            trim: true,
            required: true,
            index: true,
        },
        location: {
            type: String,
            required: true,
            trim: true,
        },
        date: {
            type: Date,
            required: true,
        },
        handledBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'NGO',
            },
        ],
        isEmailSent: {
            type: Boolean,
            default: false,
            index: true,
        },
        // Below are for manual issue creation by NGOs
        raisedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'NGO',
        },
        fundsRequired: {
            type: Number,
            min: 0,
        },
    },
    {timestamps: true}
);

const Issue = mongoose.model('Issue', issueSchema);
export default Issue;
