import NGO from '../model/Ngo.model.js';
import {asyncHandler} from '../utility';
import statusCode from '../constants/statusCode.js';
import {ApiResponse} from '../utility/';
import {ApiError} from '../utility';
import cookieOptions from '../constants/cookieOptions.js';

export const registerNGO = asyncHandler(async (req, res) => {
    const data = req.body;
    const {name, type, email, password, about, website} = req.body;

    if (!name || !type || !email || !password) {
        throw new ApiError(statusCode.BAD_REQUEST, 'Missing required fields');
    }

    const existingNGO = await NGO.findOne({email});
    if (existingNGO) {
        throw new ApiError(
            statusCode.CONFLICT,
            'NGO with this email already exists'
        );
    }

    const newNGO = new NGO({name, type, email, password, about, website});
    await newNGO.save();

    return res
        .status(statusCode.CREATED)
        .json(
            new ApiResponse(
                statusCode.CREATED,
                {NGOcode: newNGO.NGOcode},
                'NGO registered successfully'
            )
        );
});

export const loginNGO = asyncHandler(async (req, res) => {
    const {ngoCode, email, password} = req.body;

    if ((!ngoCode && !email) || !password) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'NGO Code or Email and password are required'
        );
    }

    const ngo = ngoCode
        ? await NGO.findOne({NGOcode: ngoCode}).select(
              '+password +refreshToken'
          )
        : await NGO.findOne({email}).select('+password +refreshToken');

    if (!ngo) {
        throw new ApiError(statusCode.NOT_FOUND, 'NGO not found');
    }

    const isPasswordValid = await ngo.comparePassword(password);
    if (!isPasswordValid) {
        throw new ApiError(statusCode.UNAUTHORIZED, 'Invalid password');
    }

    const accessToken = ngo.generateAccessToken();
    const refreshToken = ngo.generateRefreshToken();

    ngo.refreshToken = refreshToken;
    await ngo.save();

    res.cookie('accessToken', accessToken, cookieOptions)
        .cookie('refreshToken', refreshToken, cookieOptions)
        .status(statusCode.OK)
        .json(
            new ApiResponse(
                statusCode.OK,
                {ngoCode: ngo.NGOcode},
                'NGO logged in successfully'
            )
        );
});

export const getNGOProfile = asyncHandler(async (req, res) => {
    const ngoCode = req.ngoCode;

    if (!ngoCode) {
        throw new ApiError(statusCode.BAD_REQUEST, 'NGO Code is required');
    }

    const ngo = await NGO.findOne({NGOcode: ngoCode}).select(
        '-password -refreshToken'
    );

    if (!ngo) {
        throw new ApiError(statusCode.NOT_FOUND, 'NGO not found');
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                statusCode.OK,
                ngo,
                'NGO profile fetched successfully'
            )
        );
});

export const updateNGOProfile = asyncHandler(async (req, res) => {
    const {
        name,
        type,
        ngoCode,
        about,
        website,
        email,
        phone,
        address,
        currentFund,
    } = req.body;

    if (!ngoCode) {
        throw new ApiError(statusCode.BAD_REQUEST, 'NGO Code is required');
    }

    const ngo = await NGO.findOne({NGOcode: ngoCode});

    if (!ngo) {
        throw new ApiError(statusCode.NOT_FOUND, 'NGO not found');
    }

    if (email && (email !== ngo.email)) {
        const existingNGO = await NGO.findOne({email});
        if (existingNGO) {
            throw new ApiError(
                statusCode.CONFLICT,
                'Email already in use by another NGO'
            );
        }
    }

    // Update allowed fields
    const allowedFields = [
        'name',
        'type',
        'about',
        'website',
        'email',
        'phone',
        'address',
        'currentFund',
        'address'
    ];

    allowedFields.forEach((field) => {
        if (req.body[field] !== undefined && req.body[field] !== null) {
            ngo[field] = req.body[field];
        }
    });

    // Save updated NGO
    await ngo.save();

    const updatedNGO = ngo.toObject();
    delete updatedNGO.password;
    delete updatedNGO.refreshToken;

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(
                statusCode.OK,
                updatedNGO,
                'NGO profile updated successfully'
            )
        );
});
