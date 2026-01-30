import Router from 'express';

import {
    registerNGO,
    loginNGO,
    getNGOProfile,
    updateNGOProfile,
    raiseManualIssue,
    deleteIssue,
    submitReport,
    getMyReports,
    uploadReportImages,
} from '../controllers/ngo.controller.js';

//Todo: Make auth.controller.js
import {authenticateNGO} from '../middlewares/auth.middleware.js';
import upload from '../middlewares/upload.middleware.js';

const router = Router();

// Auth
router.post('/register', registerNGO);
router.post('/login', loginNGO);

// Profile View
router.get('/profile', authenticateNGO, getNGOProfile);
router.put('/profile', authenticateNGO, updateNGOProfile);

// Issues related routes
router.post('/raiseIssue', authenticateNGO, raiseManualIssue);
router.delete('/deleteIssue/:issueId', authenticateNGO, deleteIssue);

// Report Submission
router.post('/report-submission', authenticateNGO, submitReport);
router.get('/report-submission/me', authenticateNGO, getMyReports);
router.post(
    '/upload-images',
    authenticateNGO,
    upload.array('images', 10),
    uploadReportImages
);


export default router;
