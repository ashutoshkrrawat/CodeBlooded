import Router from 'express';

import {
    registerNGO,
    loginNGO,
    getNGOProfile,
    updateNGOProfile,
} from '../controllers/ngo.controller.js';

//Todo: Make auth.controller.js
import {authenticateNGO} from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', registerNGO);
router.post('/login', loginNGO);
router.get('/profile', authenticateNGO, getNGOProfile);
router.put('/profile', authenticateNGO, updateNGOProfile);

export default router;
