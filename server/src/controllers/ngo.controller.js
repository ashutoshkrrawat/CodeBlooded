import NGO from '../model/Ngo.model.js';
import {asyncHandler} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';
import {ApiResponse} from '../utility/index.js';
import {ApiError} from '../utility/index.js';
import cookieOptions from '../constants/cookieOptions.js';
import Issue from '../model/Issue.model.js';
import Report from '../model/Report.model.js';
import {uploadToCloudinary} from '../services/cloudinary.service.js';
import {analyzeCrisis} from '../services/ml.service.js';

export const registerNGO = asyncHandler(async (req, res) => {
    const {name, type, email, password, address, phone, about, website} =
        req.body;

    // Required fields check
    if (!name || !type || !email || !password || !address || !phone) {
        throw new ApiError(statusCode.BAD_REQUEST, 'Missing required fields');
    }

    // Check if NGO already exists
    const existingNGO = await NGO.findOne({email});
    if (existingNGO) {
        throw new ApiError(
            statusCode.CONFLICT,
            'NGO with this email already exists'
        );
    }

    // Create NGO
    const newNGO = await NGO.create({
        name,
        type,
        email,
        password,
        address,
        phone,
        about,
        website,
    });

    return res.status(statusCode.CREATED).json(
        new ApiResponse(
            statusCode.CREATED,
            {
                NGOcode: newNGO.NGOcode,
                email: newNGO.email,
            },
            'NGO registered successfully'
        )
    );
});

export const loginNGO = asyncHandler(async (req, res) => {
    const {email, password} = req.body;

    if (!email || !password) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'Email and password are required'
        );
    }

    const ngo = await NGO.findOne({email}).select('+password +refreshToken');

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

    return res
        .cookie('accessToken', accessToken, cookieOptions)
        .cookie('refreshToken', refreshToken, cookieOptions)
        .status(statusCode.OK)
        .json(
            new ApiResponse(
                statusCode.OK,
                {ngoId: ngo?._id, email: ngo?.email},
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

    if (email && email !== ngo.email) {
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
        'address',
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

export const raiseManualIssue = asyncHandler(async (req, res) => {
    const ngoCode = req.ngoCode;

    const {
        title,
        description,
        type,
        severity,
        pinCode,
        location,
        date,
        fundsRequired,
    } = req.body;

    if (!ngoCode) {
        throw new ApiError(statusCode.BAD_REQUEST, 'NGO Code is required');
    }

    if (!title || !type || !severity || !location || !date) {
        throw new ApiError(statusCode.BAD_REQUEST, 'Missing required fields');
    }

    const ngo = await NGO.findOne({NGOcode: ngoCode});

    if (!ngo) {
        throw new ApiError(statusCode.NOT_FOUND, 'NGO not found');
    }

    const issue = await Issue.create({
        title,
        description,
        type,
        severity,
        pinCode,
        location,
        fundsRequired,
        date: new Date(date),
        raisedBy: ngo._id,
        handledBy: ngo._id,
    });

    // Run AI analysis asynchronously
    analyzeCrisis(description, 'manual_ngo', location)
        .then(async (result) => {
            if (result) {
                issue.aiAnalysis = result;
                await issue.save();
            }
        })
        .catch((err) => console.error('Background AI analysis failed:', err));

    return res
        .status(statusCode.CREATED)
        .json(
            new ApiResponse(
                statusCode.CREATED,
                issue,
                'Issue raised successfully'
            )
        );
});

export const deleteIssue = asyncHandler(async (req, res) => {
    const ngoCode = req.ngoCode;
    const {issueId} = req.params;

    if (!ngoCode) {
        throw new ApiError(statusCode.BAD_REQUEST, 'NGO Code is required');
    }

    if (!issueId) {
        throw new ApiError(statusCode.BAD_REQUEST, 'Issue ID is required');
    }

    const ngo = await NGO.findOne({NGOcode: ngoCode});

    if (!ngo) {
        throw new ApiError(statusCode.NOT_FOUND, 'NGO not found');
    }

    const issue = await Issue.findById(issueId);

    if (!issue) {
        throw new ApiError(statusCode.NOT_FOUND, 'Issue not found');
    }

    if (!issue.raisedBy || issue.raisedBy.toString() !== ngo._id.toString()) {
        throw new ApiError(
            statusCode.FORBIDDEN,
            'You are not authorized to delete this issue'
        );
    }

    await Issue.findByIdAndDelete(issueId);

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(statusCode.OK, null, 'Issue deleted successfully')
        );
});

export const submitReport = asyncHandler(async (req, res) => {
    const ngoCode = req.ngoCode;

    const {
        title,
        description,
        content,
        issueSolvedAt,
        capitalUtilised,
        images,
        contributors,
        issueSolved,
    } = req.body;

    if (!ngoCode) {
        throw new ApiError(statusCode.BAD_REQUEST, 'NGO Code is required');
    }

    if (
        !title ||
        !description ||
        !issueSolvedAt ||
        capitalUtilised === undefined
    ) {
        throw new ApiError(statusCode.BAD_REQUEST, 'Missing required fields');
    }

    const ngo = await NGO.findOne({NGOcode: ngoCode});

    if (!ngo) {
        throw new ApiError(statusCode.NOT_FOUND, 'NGO not found');
    }

    const report = await Report.create({
        title,
        description,
        content,
        issueSolvedAt: new Date(issueSolvedAt),
        capitalUtilised,
        images,
        contributors,
        issueSolved,
        ngoId: ngo._id,
    });

    return res
        .status(statusCode.CREATED)
        .json(
            new ApiResponse(
                statusCode.CREATED,
                report,
                'Report submitted successfully'
            )
        );
});

export const getMyReports = asyncHandler(async (req, res) => {
    const {ngoId} = req.body;

    if (!ngoId) {
        throw new ApiError(statusCode.BAD_REQUEST, 'NGO ID is required');
    }

    const ngo = await NGO.findById(ngoId);

    if (!ngo) {
        throw new ApiError(statusCode.NOT_FOUND, 'NGO not found');
    }

    const reports = await Report.find({ngoId: ngo._id})
        .sort({createdAt: -1})
        .populate('issueSolved', 'title type severity location date');

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(
                statusCode.OK,
                'Reports fetched successfully',
                reports
            )
        );
});

export const uploadReportImages = asyncHandler(async (req, res) => {
    if (!req.files || !req.files.length) {
        throw new ApiError(statusCode.BAD_REQUEST, 'No images provided');
    }

    const uploadResults = [];

    for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, 'ngo/reports');

        uploadResults.push(result.secure_url);
    }

    return res.status(statusCode.OK).json(
        new ApiResponse(
            statusCode.OK,
            {
                images: uploadResults,
            },
            'Images uploaded successfully'
        )
    );
});

export const getAllNGOs = async (req, res, next) => {
    try {
        const ngos = await NGO.find({})
            .select('-password -documents -__v -updatedAt')
            .lean();

        if (!ngos) {
            throw new ApiError(404, 'No NGOs found');
        }

        return res.status(200).json(
            new ApiResponse(200, 'NGOs fetched successfully', {
                count: ngos.length,
                ngos,
            })
        );
    } catch (error) {
        next(error);
    }
};

export const getNGOPublicProfile = asyncHandler(async (req, res) => {
    const {ngoId} = req.params;

    if (!ngoId) {
        throw new ApiError(statusCode.BAD_REQUEST, 'NGO ID is required');
    }

    const ngo = await NGO.findById(ngoId)
        .select(
            'name type NGOcode email address phone about website currentFund createdAt'
        )
        .lean();

    if (!ngo) {
        throw new ApiError(statusCode.NOT_FOUND, 'NGO not found');
    }

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(
                statusCode.OK,
                ngo,
                'NGO public profile fetched successfully'
            )
        );
});
