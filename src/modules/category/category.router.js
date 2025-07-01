import { Router } from 'express';
import * as controller from './category.controller.js';
import { isAuthenticated } from '../../middleware/authentication.middleware.js';
const router = Router();

router.post('/', isAuthenticated, controller.createCategory);
router.put('/:id', isAuthenticated, controller.updateCategory);
router.delete('/:id', isAuthenticated, controller.deleteCategory);
router.get('/', controller.getCategories);
router.get('/:id', controller.getCategory);

export default router;
