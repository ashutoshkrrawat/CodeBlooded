import Router from 'express';
import { handleReportAnalysis, handleQuickVerify } from '../controllers/reportAnalysis.controller.js';

const router = Router();

router.get('/fetch')

export default router;
