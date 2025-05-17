import cors from 'cors';

export const corsOptions = {
  origin: '*', // يمكنك تخصيصها لاحقًا
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export default cors(corsOptions); 