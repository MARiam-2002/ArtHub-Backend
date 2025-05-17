import { Router } from 'express';
import { getHomeData, search } from './home.controller.js';
const router = Router();

router.get('/', getHomeData);
router.get('/search', search);

export default router; 