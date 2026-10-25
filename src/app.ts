import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import config from './config';
import router from './app/routes';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import notFound from './app/middlewares/notFound';
import sanitizeInput from './app/middlewares/sanitizeInput';

const app: Application = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://ph-instructor-client.vercel.app',
  'ph-instructor-client.vercel.app',
  config.client_url as string,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // server-to-server / Postman
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  }),
);

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sanitizeInput);

app.use('/api/v1', router);

app.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'PH Submission Portal API is running' });
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;
