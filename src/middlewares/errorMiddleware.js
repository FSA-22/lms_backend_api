import AppError from '../utils/appError.js';
import { NODE_ENV } from '../config/env.js'; // Ensure this points to your config file

// --- HELPER FUNCTIONS TO TRANSLATE PRISMA ERRORS ---

// Handle Unique Constraint Violations (Code P2002)
// Example: User tries to sign up with an email that already exists.
const handlePrismaUniqueError = (err) => {
  const field = err.meta.target ? err.meta.target.join(', ') : 'field';
  const message = `Duplicate field value: ${field}. Please use another value!`;
  return new AppError(message, 400);
};

// Handle Foreign Key Violations (Code P2003)
// Example: Creating a Course with an Instructor ID that doesn't exist.
const handlePrismaForeignKeyError = (err) => {
  const message = `Foreign key constraint failed: The referenced record does not exist.`;
  return new AppError(message, 400);
};

// Handle Validation Errors (Code P2000-P2025 generic)
// Example: Sending text to a field that expects a number.
const handlePrismaValidationError = (err) => {
  const message = `Invalid input data: ${err.message}`;
  return new AppError(message, 400);
};

// --- ERROR SENDERS ---

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
    });
  }
  // Programming or other unknown error: don't leak details
  else {
    console.error('ERROR', err);
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

// --- MAIN MIDDLEWARE ---

const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    // CLONE THE ERROR OBJECT
    // We create a copy so we don't mutate the original 'err' directly in unexpected ways
    let error = { ...err, message: err.message };
    error.name = err.name; // Copy name explicitly 

    // 1. Handle Prisma "Unique Constraint" (P2002)
    // Matches the @@unique constraints in your User and Role models
    if (err.code === 'P2002') error = handlePrismaUniqueError(err);

    // 2. Handle Prisma "Foreign Key" (P2003)
    // Matches the @relation fields in your Course and Lesson models
    if (err.code === 'P2003') error = handlePrismaForeignKeyError(err);

    // 3. Handle General Validation Errors
    if (err.name === 'PrismaClientValidationError') error = handlePrismaValidationError(err);

    sendErrorProd(error, res);
  }
};

export default errorMiddleware;