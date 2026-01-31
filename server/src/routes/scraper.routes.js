import {Router} from 'express';
import {triggerManualScrape} from '../controllers/scraper.controller.js';

const router = Router();

router.route('/trigger').post(triggerManualScrape);

export default router;
