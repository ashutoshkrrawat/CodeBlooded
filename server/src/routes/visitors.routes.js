import express from 'express';
import {increaseVisitorCount} from '../controllers/visitors.controller.js';

const router = express.Router();

// Increment visitor count
router.post('/count', increaseVisitorCount);

export default router;