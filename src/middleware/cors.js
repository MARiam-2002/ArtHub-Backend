
import cors from 'cors';

export const corsOptions = {
  origin: ['https://art-hub-backend.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

export default cors(corsOptions); 
