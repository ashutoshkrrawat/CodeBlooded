import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const ngoSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
            enum: ['Health', 'Education', 'Disaster', 'Environment', 'Other'],
            index: true,
        },
        NGOcode: {
            type: String,
            unique: true,
            default: function () {
                return 'NGO-' + crypto.randomBytes(4).toString('hex').toUpperCase();
            },
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please fill a valid email address',
            ],
            index: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false,
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        about: {
            type: String,
            trim: true,
            default: '',
        },
        website: {
            type: String,
            trim: true,
            default: '',
        },

        currentFund: {
            type: Number,
            default: 0,
            min: 0,
        },
        
        refreshToken: {
            type: String,
            select: false,
        },
    },
    { timestamps: true }
);

// Hash password before saving
ngoSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare password
ngoSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT access token
ngoSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        { userId: this._id, name: this.name, ngoCode: this.NGOcode, role: 'ngo' },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '7d' }
    );
};
// Method to generate JWT refresh token
ngoSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { userId: this._id, name: this.name, ngoCode: this.NGOcode, role: 'ngo' },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );
};

const NGO = mongoose.model('NGO', ngoSchema);
export default NGO;