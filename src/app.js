import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import env from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './errors/AppError.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin === '*' ? true : env.corsOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.use('/api', routes);

app.use((req, res, next) => {
  next(new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404));
});

app.use(errorHandler);

export default app;
