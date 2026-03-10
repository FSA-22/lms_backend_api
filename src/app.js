import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { CLIENT_URL, NODE_ENV } from './config/env.js';

import AppError from './utils/appError.js';
import errorMiddleware from './middlewares/errorMiddleware.js';
import { globalLimiter } from './middlewares/limiter.middleware.js';

/*
| ROUTES
*/

import superuserRouter from './routes/superUser.route.js';
import authRouter from './routes/auth.route.js';
import userRouter from './routes/user.route.js';
import courseRouter from './routes/course.route.js';
import enrollRouter from './routes/enrollment.route.js';
import progressRouter from './routes/progress.route.js';
import assessmentRouter from './routes/assessment.route.js';
import assessmentResultRoute from './routes/assessmentResult.route.js';
import lessonsRouter from './routes/lesson.route.js';
import studentDashboardRouter from './routes/studentDashboard.route.js';
import certificateRouter from './routes/certificate.route.js';
import adminRouter from './routes/admin.route.js';
import lessonContentRouter from './routes/lessonContent.route.js';
import lessonAttachmentRouter from './routes/lessonAttachment.route.js';
import assessmentQuestionRouter from './routes/assessmentQuestion.route.js';
import studentAnswerRouter from './routes/studentAnswer.route.js';

const app = express();

/*
| GLOBAL MIDDLEWARE
*/

app.use(globalLimiter);

app.use(helmet());

app.use(
  cors({
    origin: CLIENT_URL || '*',
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

/*
| HEALTH CHECK
*/

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

/*
| ROUTES
*/

app.use('/api/v1/auth', authRouter);

app.use('/api/v1', superuserRouter);
app.use('/api/v1', userRouter);
app.use('/api/v1', courseRouter);
app.use('/api/v1', enrollRouter);
app.use('/api/v1', progressRouter);
app.use('/api/v1', assessmentRouter);
app.use('/api/v1', assessmentQuestionRouter);
app.use('/api/v1', assessmentResultRoute);
app.use('/api/v1', lessonsRouter);
app.use('/api/v1', studentDashboardRouter);
app.use('/api/v1', certificateRouter);
app.use('/api/v1', adminRouter);
app.use('/api/v1', lessonContentRouter);
app.use('/api/v1', lessonAttachmentRouter);
app.use('/api/v1', studentAnswerRouter);

/*
| HANDLE UNKNOWN ROUTES
*/

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
/*
| GLOBAL ERROR HANDLER
*/

app.use(errorMiddleware);

export default app;
