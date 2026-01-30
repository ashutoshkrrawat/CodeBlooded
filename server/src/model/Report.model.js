import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: String,

        },
        issueSolvedAt: {
            type: Date,
            required: true,
        },

        // In smallest currency unit (e.g., paise for INR)
        capitalUtilised: {
            type: Number,
            required: true,
            min: 0,
        },

        images: [
            {
                type: String, // Cloudinary URL or any image URL
                trim: true,
            },
        ],

        ngoId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'NGO',
            required: true,
            index: true,
        },

        contributors: [
            {
                type: String,
                trim: true,
            },
        ],

        issueSolved: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Issue',
        },
    },
    {timestamps: true}
);

const Report = mongoose.model('Report', reportSchema);
export default Report;
