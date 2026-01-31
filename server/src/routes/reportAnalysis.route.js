import Router from 'express';
import { handleReportAnalysis, handleQuickVerify } from '../controllers/reportAnalysis.controller.js';

const router = Router();

// Full report analysis with multiple images
router.post('/report-analysis', handleReportAnalysis);

// Quick single image verification
router.post('/quick-verify', handleQuickVerify);

export default router;
