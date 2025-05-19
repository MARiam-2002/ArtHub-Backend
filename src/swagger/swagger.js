import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// اقرأ swagger.json فقط (لا تستخدم yaml هنا)
const swaggerDocument = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'swagger.json'), 'utf8')
);

const router = Router();
router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
export default router;
