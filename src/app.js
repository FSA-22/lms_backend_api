import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { CLIENT_URL, NODE_ENV } from './config/env.js';
import authRouter from './routes/auth.route.js';
import userRouter from './routes/user.route.js';
import courseRouters from './routes/course.route.js';
import enrollRouter from './routes/enrollment.route.js';
import progressRouter from './routes/progress.route.js';
import assessmentRouter from './routes/assessment.route.js';
import assessmentResultRoute from './routes/assessmentResult.route.js';
import lessonsRouter from './routes/lesson.route.js';
import studentDashboardRouter from './routes/studentDashboard.route.js';

const app = express();

/*
   Core Middlewares
*/

// Security headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    origin: CLIENT_URL || '*',
    credentials: true
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger (dev only)
if (NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

/*
   auths
*/

app.use('/api/v1/auth', authRouter);

app.use('/api/v1', userRouter);
app.use('/api/v1/', courseRouters);
app.use('/api/v1/', enrollRouter);
app.use('/api/v1/', progressRouter);
app.use('/api/v1/', assessmentRouter);
app.use('/api/v1/', assessmentResultRoute);
app.use('/api/v1/', lessonsRouter);
app.use('/api/v1/', studentDashboardRouter);

/*
   404 Handler
*/
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

/*
   Global Error Handler
*/
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

export default app;
