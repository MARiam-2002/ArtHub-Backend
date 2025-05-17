import { Router } from 'express';
import { verifyFirebaseToken } from '../../middleware/firebase.middleware.js';
import * as chatController from './controller/chat.js';

const router = Router();

router.get('/', verifyFirebaseToken, chatController.getChats);
router.get('/:chatId/messages', verifyFirebaseToken, chatController.getMessages);
router.post('/:chatId/messages', verifyFirebaseToken, chatController.sendMessage);
router.post('/create', verifyFirebaseToken, chatController.createChat);

export default router; 