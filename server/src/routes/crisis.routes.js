import Router from 'express';
import {processCrisisReport} from '../controllers/crisis.controller.js';

const router = Router();

router.post('/process-report', processCrisisReport);

export default router;
