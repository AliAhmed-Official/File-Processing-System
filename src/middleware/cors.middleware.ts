import cors from 'cors';
import { config } from '../config';

export const corsMiddleware = cors({
  origin: config.SOCKET_CORS_ORIGIN,
  methods: ['GET', 'POST'],
  credentials: true,
});
