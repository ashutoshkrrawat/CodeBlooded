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
            type: String,
            required: true,
            trim: true,
        },
        pinCode: {
            type: String,
            trim: true,
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
    },
    {timestamps: true}
);

const Issue = mongoose.model('Issue', issueSchema);
export default Issue;
