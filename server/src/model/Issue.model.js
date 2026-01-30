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
        status: {
            type: String,
            enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'FALSE_ALARM'],
            default: 'OPEN',
            index: true,
        },
        severity: {
            type: Number,
            required: true,
            min: 0,
            max: 1,
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
        // GeoJSON for proximity searches
        coordinates: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                index: '2dsphere',
            },
        },
        date: {
            type: Date,
            default: Date.now,
            required: true,
        },
        handledBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'NGO',
            },
        ],
        aiAnalysis: {
            type: mongoose.Schema.Types.Mixed,
        },
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
            default: 0,
        },
        resourcesRequired: [
            {
                resourceType: String,
                quantity: Number,
                unit: String,
            },
        ],
    },
    {timestamps: true}
);

const Issue = mongoose.model('Issue', issueSchema);
export default Issue;
