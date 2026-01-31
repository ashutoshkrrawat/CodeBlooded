import Router from 'express';
import {getRecommendedNGOs} from '../controllers/recommendation.controller.js';

import {verifyAccessToken} from '../middlewares/index.js';

const router = Router();

router.get('/', getRecommendedNGOs);

export default router;
