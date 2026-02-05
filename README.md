# Learning Management System (LMS) Backend API

A **scalable, secure, and production-ready backend API** for a Learning Management System (LMS), built following **industry best practices**.  
This project is designed as a **sellable capstone** and a strong **portfolio-grade backend system**.

---

## 📌 Overview

This LMS backend provides the core infrastructure required to manage users, courses, lessons, enrollments, assessments, and learning progress.  
The architecture follows **clean separation of concerns**, **role-based access control**, and **enterprise-level backend standards**.

---

## 🚀 Core Features

### Authentication & Security

- JWT-based authentication
- Role-Based Access Control (Admin, Instructor, Student)
- Secure password hashing
- Rate limiting & request throttling
- Helmet security headers
- Input validation & sanitization

### LMS Functionality

- User management
- Course creation & publishing
- Lesson and content management
- Student enrollment tracking
- Assessments & submissions
- Progress tracking

### Backend Infrastructure

- Pagination, filtering & search
- Redis caching & rate limiting
- Centralized error handling
- API request logging & monitoring
- Swagger OpenAPI documentation
- Unit & integration testing
- Dockerized environment
- CI/CD with GitHub Actions

---

## 🛠 Technology Stack

| Layer              | Technology         |
| ------------------ | ------------------ |
| Runtime            | Node.js            |
| Framework          | Express.js         |
| Language           | TypeScript         |
| Database           | MongoDB (Mongoose) |
| Cache / Rate Limit | Redis              |
| Authentication     | JWT                |
| Validation         | Zod / Joi          |
| API Docs           | Swagger (OpenAPI)  |
| Testing            | Jest               |
| Containerization   | Docker             |
| CI/CD              | GitHub Actions     |

---

## 📂 Project Structure

```text
lms-backend/
│
├── .github/
│   └── workflows/
│       └── ci.yml                 # CI pipeline
│
├── src/
│   ├── config/
│   │   ├── env.ts                 # Environment variables
│   │   ├── db.ts                  # MongoDB connection
│   │   ├── redis.ts               # Redis client
│   │   └── swagger.ts             # Swagger setup
│   │
│   ├── constants/
│   │   ├── roles.ts               # User roles
│   │   └── permissions.ts
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── course.controller.ts
│   │   ├── lesson.controller.ts
│   │   ├── enrollment.controller.ts
│   │   └── assessment.controller.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── course.service.ts
│   │   ├── enrollment.service.ts
│   │   └── assessment.service.ts
│   │
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── course.model.ts
│   │   ├── lesson.model.ts
│   │   ├── enrollment.model.ts
│   │   ├── assessment.model.ts
│   │   └── submission.model.ts
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── course.routes.ts
│   │   ├── lesson.routes.ts
│   │   ├── enrollment.routes.ts
│   │   └── assessment.routes.ts
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── role.middleware.ts
│   │   ├── rateLimit.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── error.middleware.ts
│   │
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   ├── course.validator.ts
│   │   └── lesson.validator.ts
│   │
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   ├── pagination.ts
│   │   └── logger.ts
│   │
│   ├── app.ts                     # Express app
│   └── server.ts                  # App entry point
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── .gitignore
├── tsconfig.json
├── package.json
└── README.md
```

PORT=5000
NODE_ENV=development

MONGO_URI=mongodb://localhost:27017/lms

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d

REDIS_URL=redis://localhost:6379
