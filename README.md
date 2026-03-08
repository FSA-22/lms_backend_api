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

| Layer              | Technology        |
| ------------------ | ----------------- |
| Runtime            | Node.js           |
| Framework          | Express.js        |
| Language           | JavaScript        |
| Database           | Supabase (prisma) |
| Cache / Rate Limit | Redis             |
| Authentication     | JWT               |
| Validation         | Zod / Joi         |
| API Docs           | Swagger (OpenAPI) |
| Testing            | Jest              |
| Containerization   | Docker            |
| CI/CD              | GitHub Actions    |

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
│   │   ├── env.js                 # Environment variables
│   │   ├── db.js                  # MongoDB connection
│   │   ├── redis.js               # Redis client
│   │   └── swagger.js             # Swagger setup
│   │
│   ├── constants/
│   │   ├── roles.js               # User roles
│   │   └── permissions.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── course.controller.js
│   │   ├── lesson.controller.js
│   │   ├── enrollment.controller.js
│   │   └── assessment.controller.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── course.routes.js
│   │   ├── lesson.routes.js
│   │   ├── enrollment.routes.js
│   │   └── assessment.routes.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   ├── rateLimit.middleware.js
│   │   ├── validation.middleware.js
│   │   └── error.middleware.js
│   │
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── course.validator.js
│   │   └── lesson.validator.js
│   │
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── password.js
│   │   ├── pagination.js
│   │   └── logger.ts
│   │
│   ├── app.js                     # Express app
│   └── server.js                  # App entry point
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

JWT_SECRET=''
JWT_EXPIRES_IN=1d

REDIS_URL=redis://localhost:6379

---

## 🌐 API Base URL

All endpoints below use this base URL.

Local development: localhost:5000/api/v1

---

# 🔐 Authentication

## Local development: localhost:5000/api/v1/auth

-- RegisterTenant = POST - auth/register-org
this endpoint registers a new organization and assigned an user an ADMIN automatically and return organization slug
request body below:
{
"companyName": "TS Academy",
"firstName": "Simeon",
"lastName": "FSA",
"email": "admin@tsacademy.com",
"password": "Password123"
}

Response:
{
"success": true,
"message": "Organization created successfully",
"organization": {
"name": "TS Academy",
"slug": "ts-academy"
}
}

-- TenantAdmin = POST - /ts-academy/admin/login
request body below:
{
"email": "admin@tsacademy.com",
"password": "Password123"
}

---

-- InstructorRegister = POST - /ts-academy/register/instructor

request body:
{
"firstName": "John",
"lastName": "Doe",
"email": "instructor@tsacademy.com",
"password": "Password123!"
}

-- InstructorLogin = POST - /ts-academy/instructor/login
request body:
{
"email": "instructor@tsacademy.com",
"password": "Password123!"
}

---

-- StudentRegisters = POST - /ts-academy/register/student

request body:
{
"firstName": "John",
"lastName": "Doe",
"email": "student@tsacademy.com",
"password": "Password123"
}

-- InstructorLogin = POST - /ts-academy/student/login
request body:
{
"email": "student@tsacademy.com",
"password": "Password123"
}

---

---

-- CreateRefreshToken = POST - /ts-academy-2/refresh

request body:
{
"email": "student@tsacademy.com",
"password": "Password123"
}

---

-- LogOut = POST - /ts-academy/logout

request body:
{
"email": "anyuser@gmail.com",
"password": "123123"
}

---

Most endpoints require a JWT token.

Include it in headers: Authorization: Bearer <access_token>
You can obtain the token using the login endpoint.
