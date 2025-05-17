import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json' assert { type: 'json' };

export default [swaggerUi.serve, swaggerUi.setup(swaggerDocument)]; 