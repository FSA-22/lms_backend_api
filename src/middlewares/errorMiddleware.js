import { prisma } from '../lib/prisma.js';
import AppError from '../utils/appError.js';
import { NODE_ENV } from '../config/env.js';

/*
|--------------------------------------------------------------------------
| PRISMA ERROR HANDLERS
|--------------------------------------------------------------------------
*/

const handlePrismaUniqueError = (err) => {
  const fields = err.meta?.target?.join(', ') || 'field';
  return new AppError(`Duplicate value for ${fields}. Please use another value.`, 400);
};

const handlePrismaForeignKeyError = () => {
  return new AppError(`Invalid reference: The related record does not exist.`, 400);
};

const handlePrismaRecordNotFoundError = () => {
  return new AppError(`No record found with the provided identifier.`, 404);
};

const handlePrismaValidationError = (err) => {
  return new AppError(`Invalid input data. ${err.message}`, 400);
};

const handlePrismaValueTooLong = (err) => {
  const column = err.meta?.column_name || 'field';
  return new AppError(`Value too long for ${column}`, 400);
};

/*
|--------------------------------------------------------------------------
| ERROR RESPONSES
|--------------------------------------------------------------------------
*/

const sendErrorDev = (err, res) => {
  return res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message
    });
  }

  // Unknown errors
  console.error('UNEXPECTED ERROR 💥', err);

  return res.status(500).json({
    success: false,
    status: 'error',
    message: 'Something went wrong. Please try again later.'
  });
};

/*
|--------------------------------------------------------------------------
| MAIN ERROR MIDDLEWARE
|--------------------------------------------------------------------------
*/

const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (NODE_ENV === 'development') {
    return sendErrorDev(err, res);
  }

  // ----- PRODUCTION HANDLING -----
  let error = err;

  /*
  |--------------------------------------------------------------------------
  | PRISMA KNOWN REQUEST ERRORS
  |--------------------------------------------------------------------------
  */

  if (err instanceof prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        error = handlePrismaUniqueError(err);
        break;

      case 'P2003':
        error = handlePrismaForeignKeyError(err);
        break;

      case 'P2025':
        error = handlePrismaRecordNotFoundError(err);
        break;

      case 'P2000':
        error = handlePrismaValueTooLong(err);
        break;

      default:
        error = new AppError('Database operation failed.', 400);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | PRISMA VALIDATION ERRORS
  |--------------------------------------------------------------------------
  */

  if (err instanceof prisma.PrismaClientValidationError) {
    error = handlePrismaValidationError(err);
  }

  sendErrorProd(error, res);
};

export default errorMiddleware;
