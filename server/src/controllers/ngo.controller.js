import NGO from '../model/Ngo.model.js';
import {asyncHandler} from '../utility';
import statusCode from '../constants/statusCode.js';
import {ApiResponse} from '../utility/';
import {ApiError} from '../utility';
import cookieOptions from '../constants/cookieOptions.js';
import Issue from '../model/Issue.model.js';
import Report from '../model/Report.model.js';
import {uploadToCloudinary} from '../services/cloudinary.service.js';

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

    const {title, description, type, severity, pinCode, location, date, fundsRequired} =
        req.body;

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
        handledBy: ngo._id
    });

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
    const ngoCode = req.ngoCode;

    if (!ngoCode) {
        throw new ApiError(statusCode.BAD_REQUEST, 'NGO Code is required');
    }

    const ngo = await NGO.findOne({NGOcode: ngoCode});

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
                reports,
                'Reports fetched successfully'
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

