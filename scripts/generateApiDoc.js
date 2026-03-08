import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType, TabStopPosition, TabStopType
} from 'docx';
import fs from 'fs';

// ── Helpers ──────────────────────────────────────────────────────────────────

const heading = (text, level = HeadingLevel.HEADING_1) =>
  new Paragraph({ heading: level, spacing: { before: 300, after: 100 }, children: [new TextRun({ text, bold: true })] });

const para = (text) =>
  new Paragraph({ spacing: { after: 80 }, children: [new TextRun(text)] });

const bold = (text) => new TextRun({ text, bold: true });
const normal = (text) => new TextRun(text);
const italic = (text) => new TextRun({ text, italics: true });
const code = (text) => new TextRun({ text, font: 'Consolas', size: 18, shading: { type: ShadingType.CLEAR, fill: 'E8E8E8' } });

const richPara = (...runs) =>
  new Paragraph({ spacing: { after: 80 }, children: runs });

const bullet = (text) =>
  new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun(text)] });

const codeBullet = (label, value) =>
  new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [bold(label + ': '), code(value)] });

const codeBlock = (lines) => lines.map(line =>
  new Paragraph({
    spacing: { after: 0 },
    children: [new TextRun({ text: line, font: 'Consolas', size: 18 })],
    shading: { type: ShadingType.CLEAR, fill: 'F5F5F5' },
    indent: { left: 400 }
  })
);

const spacer = () => new Paragraph({ spacing: { after: 120 }, children: [] });

const methodBadge = (method) => new TextRun({ text: method, bold: true, color: method === 'GET' ? '2E7D32' : method === 'POST' ? '1565C0' : method === 'PATCH' ? 'F57F17' : method === 'DELETE' ? 'C62828' : '333333' });

const endpoint = (method, path, description) =>
  new Paragraph({
    spacing: { before: 200, after: 60 },
    children: [methodBadge(method + ' '), code(path), normal('  —  ' + description)]
  });

const authLine = (roles) => richPara(bold('Auth: '), normal(roles));

const bodyBlock = (jsonLines) => [
  richPara(bold('Request Body:')),
  ...codeBlock(jsonLines)
];

const responseBlock = (status, jsonLines) => [
  richPara(bold(`Response ${status}:`)),
  ...codeBlock(jsonLines)
];

const divider = () => new Paragraph({
  spacing: { before: 200, after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' } },
  children: []
});

// ── Document ─────────────────────────────────────────────────────────────────

const doc = new Document({
  styles: {
    default: {
      document: { run: { size: 22, font: 'Calibri' } }
    }
  },
  sections: [{
    properties: {},
    children: [

      // ─── TITLE ───
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [new TextRun({ text: 'TSC Academy — LMS Backend API', bold: true, size: 48 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [new TextRun({ text: 'Complete API Documentation', size: 28, color: '666666' })]
      }),

      // ─── OVERVIEW ───
      heading('Overview'),
      para('Multi-tenant Learning Management System (LMS) REST API built with Node.js, Express 5, Prisma ORM, and PostgreSQL. Supports tenant-scoped operations, role-based access control (RBAC), and soft-delete patterns throughout.'),
      spacer(),
      richPara(bold('Base URL: '), code('http://localhost:{PORT}/api/v1')),
      spacer(),

      // ─── TECH STACK ───
      heading('Tech Stack', HeadingLevel.HEADING_2),
      bullet('Runtime: Node.js (ES Modules)'),
      bullet('Framework: Express 5'),
      bullet('ORM: Prisma 7'),
      bullet('Database: PostgreSQL'),
      bullet('Auth: JWT (access token) + HttpOnly cookie (refresh token)'),
      bullet('Validation: Zod'),
      bullet('Security: Helmet, CORS, bcryptjs, express-rate-limit (Redis-backed)'),
      bullet('Logging: Morgan'),
      spacer(),

      // ─── AUTH ───
      heading('Authentication', HeadingLevel.HEADING_2),
      para('All protected endpoints require a Bearer token in the Authorization header:'),
      ...codeBlock(['Authorization: Bearer <accessToken>']),
      para('Refresh tokens are stored as HttpOnly secure cookies (refreshToken) and rotated on each refresh.'),
      spacer(),

      // ─── ROLES ───
      heading('Roles', HeadingLevel.HEADING_2),
      bullet('SUPER_ADMIN — Platform-level super user'),
      bullet('ADMIN — Tenant admin (created on org registration)'),
      bullet('INSTRUCTOR — Creates/manages courses and lessons'),
      bullet('STUDENT — Enrolls in courses, completes lessons, takes assessments'),
      bullet('SUPERUSER — Elevated access across tenants'),
      spacer(),

      heading('URL Convention', HeadingLevel.HEADING_2),
      para('Most routes are tenant-scoped via the :slug parameter:'),
      ...codeBlock(['/api/v1/:slug/resource']),
      divider(),

      // ════════════════════════════════════════════════════════════════════════
      // 1. AUTH ROUTES
      // ════════════════════════════════════════════════════════════════════════
      heading('1. Auth Routes — /api/v1/auth'),

      // Register Org
      endpoint('POST', '/auth/register-org', 'Register a new tenant (organization) + its admin user'),
      ...bodyBlock([
        '{',
        '  "companyName": "string (required)",',
        '  "firstName": "string (required)",',
        '  "lastName": "string (required)",',
        '  "email": "string (required)",',
        '  "password": "string (required)"',
        '}'
      ]),
      ...responseBlock('201', [
        '{',
        '  "message": "Tenant registered successfully",',
        '  "slug": "my-company",',
        '  "token": "jwt..."',
        '}'
      ]),
      divider(),

      // Login
      endpoint('POST', '/auth/:slug/:role/login', 'Login for any role within a tenant'),
      ...bodyBlock([
        '{',
        '  "email": "string (required)",',
        '  "password": "string (required)"',
        '}'
      ]),
      ...responseBlock('200', [
        '{',
        '  "message": "Login successful",',
        '  "accessToken": "jwt...",',
        '  "user": {',
        '    "id": "uuid",',
        '    "firstName": "...",',
        '    "lastName": "...",',
        '    "email": "...",',
        '    "roles": ["ADMIN"]',
        '  }',
        '}'
      ]),
      para('Also sets refreshToken HttpOnly cookie.'),
      divider(),

      // Register Instructor
      endpoint('POST', '/auth/:slug/register/instructor', 'Register a new instructor under a tenant'),
      ...bodyBlock([
        '{',
        '  "firstName": "string (required)",',
        '  "lastName": "string (required)",',
        '  "email": "string (required)",',
        '  "password": "string (required)"',
        '}'
      ]),
      ...responseBlock('201', [
        '{ "message": "Instructor registered successfully", "instructor": { ...userObject } }'
      ]),
      divider(),

      // Register Student
      endpoint('POST', '/auth/:slug/register/student', 'Register a new student under a tenant'),
      para('Body: Same as instructor registration.'),
      ...responseBlock('201', [
        '{ "message": "Student registered successfully", "student": { ...userObject } }'
      ]),
      divider(),

      // Logout
      endpoint('POST', '/auth/:slug/logout', 'Revoke refresh token and clear cookie'),
      authLine('Required (any role)'),
      para('Body: None (uses refreshToken cookie).'),
      ...responseBlock('200', ['{ "message": "Logged out successfully" }']),
      divider(),

      // Refresh
      endpoint('POST', '/auth/:slug/refresh', 'Rotate refresh token and get new access token'),
      para('Body: None (uses refreshToken cookie). Sets new cookie.'),
      ...responseBlock('200', ['{ "accessToken": "jwt..." }']),
      divider(),

      // ════════════════════════════════════════════════════════════════════════
      // 2. SUPER USER LOGIN
      // ════════════════════════════════════════════════════════════════════════
      heading('2. Super User Login — /api/v1'),

      endpoint('POST', '/superuser/login', 'Super admin login'),
      ...bodyBlock([
        '{',
        '  "email": "string (required)",',
        '  "password": "string (required)"',
        '}'
      ]),
      ...responseBlock('200', [
        '{ "message": "Super admin login successful", "accessToken": "jwt..." }'
      ]),
      divider(),

      // ════════════════════════════════════════════════════════════════════════
      // 3. USER ROUTES
      // ════════════════════════════════════════════════════════════════════════
      heading('3. User Routes — /api/v1'),

      endpoint('GET', '/:slug/me', 'Get current authenticated user'),
      authLine('Required (any role)'),
      ...responseBlock('200', [
        '{ "id": "uuid", "firstName": "...", "lastName": "...", "email": "...", "roles": ["STUDENT"] }'
      ]),
      divider(),

      endpoint('GET', '/:slug/users', 'Get all users (paginated)'),
      authLine('ADMIN, SUPERUSER'),
      richPara(bold('Query: '), code('?page=1&limit=10')),
      ...responseBlock('200', [
        '{',
        '  "meta": { "total": 50, "page": 1, "lastPage": 5 },',
        '  "data": [{',
        '    "id": "uuid", "firstName": "...", "lastName": "...",',
        '    "email": "...", "isActive": true, "roles": ["STUDENT"]',
        '  }]',
        '}'
      ]),
      divider(),

      endpoint('GET', '/:slug/users/:id', 'Get user by ID'),
      authLine('ADMIN, SUPERUSER'),
      para('Response 200: Full user object with roles.'),
      divider(),

      endpoint('PATCH', '/:slug/users/:id', 'Update user profile'),
      authLine('ADMIN, SUPERUSER (or self)'),
      ...bodyBlock([
        '{',
        '  "firstName": "string (optional)",',
        '  "lastName": "string (optional)",',
        '  "password": "string (optional)"',
        '}'
      ]),
      ...responseBlock('200', ['{ "message": "User updated successfully" }']),
      divider(),

      endpoint('DELETE', '/:slug/users/:id', 'Deactivate user (soft)'),
      authLine('ADMIN, SUPERUSER'),
      ...responseBlock('200', ['{ "message": "User deactivated" }']),
      divider(),

      // ════════════════════════════════════════════════════════════════════════
      // 4. COURSE ROUTES
      // ════════════════════════════════════════════════════════════════════════
      heading('4. Course Routes — /api/v1'),

      endpoint('POST', '/:slug/courses', 'Create a new course'),
      authLine('INSTRUCTOR, ADMIN'),
      ...bodyBlock([
        '{',
        '  "title": "string (required)",',
        '  "description": "string (optional)"',
        '}'
      ]),
      ...responseBlock('201', [
        '{',
        '  "message": "Course created successfully",',
        '  "course": {',
        '    "id": "uuid", "title": "...",',
        '    "description": "...", "isPublished": false, "createdAt": "..."',
        '  }',
        '}'
      ]),
      divider(),

      endpoint('GET', '/:slug/courses', 'Get courses (paginated, role-scoped)'),
      authLine('All roles'),
      richPara(bold('Query: '), code('?page=1&limit=10&published=true')),
      para('Visibility: Students → published only. Instructors → own courses. Admins → all.'),
      ...responseBlock('200', [
        '{',
        '  "page": 1, "limit": 10, "total": 25, "totalPages": 3,',
        '  "courses": [{ "id": "uuid", "title": "...", "description": "...",',
        '    "isPublished": true, "createdAt": "...", "instructorId": "uuid" }]',
        '}'
      ]),
      divider(),

      endpoint('GET', '/:slug/courses/:courseId', 'Get course by ID'),
      authLine('All roles (visibility rules apply)'),
      para('Response 200: Full course object.'),
      divider(),

      endpoint('PATCH', '/:slug/courses/:courseId', 'Update a course'),
      authLine('ADMIN, INSTRUCTOR (owner only)'),
      ...bodyBlock([
        '{',
        '  "title": "string (optional)",',
        '  "description": "string (optional)",',
        '  "isPublished": "boolean (optional)"',
        '}'
      ]),
      ...responseBlock('200', ['{ "message": "Course updated", "course": { ...courseObject } }']),
      divider(),

      endpoint('DELETE', '/:slug/courses/:courseId', 'Soft delete a course'),
      authLine('ADMIN, INSTRUCTOR (owner only)'),
      ...responseBlock('200', ['{ "message": "Course deleted" }']),
      divider(),

      // ════════════════════════════════════════════════════════════════════════
      // 5. LESSON ROUTES
      // ════════════════════════════════════════════════════════════════════════
      heading('5. Lesson Routes — /api/v1'),

      endpoint('POST', '/:slug/courses/:courseId/lessons', 'Create a lesson (order auto-incremented)'),
      authLine('INSTRUCTOR (owner), ADMIN, SUPERUSER'),
      ...bodyBlock([
        '{',
        '  "title": "string (required)",',
        '  "content": "string (optional)"',
        '}'
      ]),
      ...responseBlock('201', ['{ "message": "Lesson created", "lesson": { ...lessonObject } }']),
      divider(),

      endpoint('GET', '/:slug/courses/:courseId/lessons', 'Get all lessons for a course'),
      authLine('All roles (students must be enrolled)'),
      para('Response 200: Array of lesson objects ordered by order ASC.'),
      divider(),

      endpoint('GET', '/:slug/courses/:courseId/lessons/:lessonId', 'Get single lesson'),
      authLine('All roles (students must be enrolled)'),
      para('Response 200: Lesson object including course data.'),
      divider(),

      endpoint('PATCH', '/:slug/courses/:courseId/lessons/:lessonId', 'Update a lesson'),
      authLine('INSTRUCTOR (owner), ADMIN, SUPERUSER'),
      ...bodyBlock([
        '{',
        '  "title": "string (optional)",',
        '  "content": "string (optional)",',
        '  "order": "integer (optional)",',
        '  "isPublished": "boolean (optional)"',
        '}'
      ]),
      ...responseBlock('200', ['{ "message": "Lesson updated", "lesson": { ...lessonObject } }']),
      divider(),

      endpoint('DELETE', '/:slug/courses/:courseId/lessons/:lessonId', 'Soft delete a lesson'),
      authLine('INSTRUCTOR (owner), ADMIN, SUPERUSER'),
      ...responseBlock('200', ['{ "message": "Lesson deleted" }']),
      divider(),

      // ════════════════════════════════════════════════════════════════════════
      // 6. ENROLLMENT ROUTES
      // ════════════════════════════════════════════════════════════════════════
      heading('6. Enrollment Routes — /api/v1'),

      endpoint('POST', '/:slug/courses/:courseId/enrollments', 'Enroll in a course'),
      authLine('STUDENT only'),
      para('Body: None (userId derived from token). Course must be published.'),
      ...responseBlock('201', [
        '{',
        '  "success": true,',
        '  "message": "Enrolled successfully",',
        '  "enrollment": { ...enrollmentObject }',
        '}'
      ]),
      divider(),

      endpoint('GET', '/:slug/courses/:courseId/enrollments', 'Get course enrollments (paginated)'),
      authLine('INSTRUCTOR (owner), ADMIN, SUPERUSER'),
      richPara(bold('Query: '), code('?page=1&limit=10&search=...')),
      ...responseBlock('200', [
        '{',
        '  "success": true, "page": 1, "limit": 10, "total": 40, "totalPages": 4,',
        '  "enrollments": [{ ...enrollment, "user": { ...userObject } }]',
        '}'
      ]),
      divider(),

      // ════════════════════════════════════════════════════════════════════════
      // 7. PROGRESS ROUTES
      // ════════════════════════════════════════════════════════════════════════
      heading('7. Progress Routes — /api/v1'),

      endpoint('POST', '/:slug/progress/:lessonId', 'Mark lesson as completed (idempotent)'),
      authLine('STUDENT (must be enrolled)'),
      para('Body: None.'),
      ...responseBlock('200', [
        '{',
        '  "success": true,',
        '  "message": "Lesson marked as completed",',
        '  "data": {',
        '    "totalLessons": 10,',
        '    "completedLessons": 5,',
        '    "lessonsCompleted": false,',
        '    "lessonProgressPercentage": 50',
        '  }',
        '}'
      ]),
      divider(),

      // ════════════════════════════════════════════════════════════════════════
      // 8. ASSESSMENT ROUTES
      // ════════════════════════════════════════════════════════════════════════
      heading('8. Assessment Routes — /api/v1'),

      endpoint('POST', '/:slug/courses/:courseId/assessments', 'Create an assessment'),
      authLine('INSTRUCTOR (owner), ADMIN'),
      ...bodyBlock([
        '{',
        '  "title": "string (required)",',
        '  "type": "QUIZ | EXAM | ASSIGNMENT (required)",',
        '  "totalMarks": "integer (required)"',
        '}'
      ]),
      ...responseBlock('201', ['{ "success": true, "data": { ...assessmentObject } }']),
      divider(),

      endpoint('GET', '/:slug/courses/:courseId/assessments', 'Get all assessments for a course'),
      authLine('INSTRUCTOR, ADMIN'),
      ...responseBlock('200', [
        '{ "success": true, "data": [{ ...assessment, "course": { "id": "...", "title": "..." } }] }'
      ]),
      divider(),

      endpoint('GET', '/:slug/courses/:courseId/assessments/:assessmentId', 'Get assessment by ID'),
      authLine('INSTRUCTOR (owner), ADMIN'),
      ...responseBlock('200', [
        '{ "success": true, "data": { ...assessment, "course": {...}, "results": [...] } }'
      ]),
      divider(),

      endpoint('PATCH', '/:slug/courses/:courseId/assessments/:assessmentId', 'Update an assessment'),
      authLine('INSTRUCTOR (owner), ADMIN'),
      ...bodyBlock([
        '{',
        '  "title": "string (optional)",',
        '  "type": "QUIZ | EXAM | ASSIGNMENT (optional)",',
        '  "totalMarks": "integer (optional)"',
        '}'
      ]),
      ...responseBlock('200', ['{ "success": true, "data": { ...updatedAssessment } }']),
      divider(),

      endpoint('DELETE', '/:slug/courses/:courseId/assessments/:assessmentId', 'Soft delete assessment + results'),
      authLine('INSTRUCTOR (owner), ADMIN'),
      ...responseBlock('200', ['{ "success": true, "message": "Assessment deleted successfully (soft delete)" }']),
      divider(),

      endpoint('GET', '/:slug/courses/:courseId/student/assessments', 'Get assessments (student view)'),
      authLine('STUDENT, INSTRUCTOR, ADMIN'),
      para('Student must have completed ALL lessons in the course first.'),
      ...responseBlock('200', ['{ "success": true, "data": [{ ...assessmentObject }] }']),
      divider(),

      // ════════════════════════════════════════════════════════════════════════
      // 9. ASSESSMENT RESULT ROUTES
      // ════════════════════════════════════════════════════════════════════════
      heading('9. Assessment Result Routes — /api/v1'),

      endpoint('POST', '/:slug/assessments/:assessmentId/submit', 'Submit assessment result'),
      authLine('STUDENT (must be enrolled + all lessons completed)'),
      para('One submission per assessment. Pass threshold = 50% of totalMarks.'),
      ...bodyBlock([
        '{',
        '  "score": 85.0  // number, 0 to totalMarks',
        '}'
      ]),
      ...responseBlock('201', [
        '{ "success": true, "message": "Assessment submitted successfully", "data": { ...resultObject } }'
      ]),
      divider(),

      endpoint('GET', '/:slug/assessments/:assessmentId/results', 'Get all results for an assessment'),
      authLine('INSTRUCTOR (owner), ADMIN, SUPERUSER'),
      ...responseBlock('200', [
        '{',
        '  "success": true, "count": 15,',
        '  "data": [{ ...result, "user": { "id", "firstName", "lastName", "email" } }]',
        '}'
      ]),
      divider(),

      endpoint('GET', '/:slug/students/:studentId/results', 'Get student\'s own results'),
      authLine('STUDENT (own results only)'),
      ...responseBlock('200', [
        '{ "success": true, "count": 3, "data": [{ ...result, "assessment": {...} }] }'
      ]),
      divider(),

      // ════════════════════════════════════════════════════════════════════════
      // 10. CERTIFICATE ROUTES
      // ════════════════════════════════════════════════════════════════════════
      heading('10. Certificate Routes — /api/v1'),

      endpoint('POST', '/:slug/courses/:courseId/certificates/:userId', 'Issue a certificate'),
      authLine('INSTRUCTOR (owner), ADMIN, SUPERUSER'),
      para('Body: None. Student must have completed the course. Idempotent.'),
      ...responseBlock('201', [
        '{ "success": true, "message": "Certificate issued", "data": { ...certificateObject } }'
      ]),
      divider(),

      endpoint('GET', '/:slug/users/:userId/certificates', 'Get all certificates of a user'),
      authLine('INSTRUCTOR, ADMIN, SUPERUSER'),
      ...responseBlock('200', [
        '{ "success": true, "count": 2, "data": [{ ...certificate, "course": {...} }] }'
      ]),
      divider(),

      endpoint('GET', '/:slug/courses/:courseId/certificates', 'Get all certificates for a course'),
      authLine('INSTRUCTOR, ADMIN, SUPERUSER'),
      ...responseBlock('200', [
        '{ "success": true, "count": 5, "data": [{ ...certificate, "user": {...} }] }'
      ]),
      divider(),

      endpoint('GET', '/:slug/certificates/:certificateId', 'Get single certificate'),
      authLine('All roles'),
      ...responseBlock('200', [
        '{ "success": true, "data": { ...certificate, "user": {...}, "course": {...} } }'
      ]),
      divider(),

      endpoint('PATCH', '/:slug/certificates/:certificateId/revoke', 'Revoke a certificate'),
      authLine('INSTRUCTOR (owner), ADMIN, SUPERUSER'),
      ...bodyBlock([
        '{',
        '  "reason": "string (required, min 5 chars)"',
        '}'
      ]),
      ...responseBlock('200', [
        '{ "success": true, "message": "Certificate revoked", "data": { ...revokedCertificate } }'
      ]),
      divider(),

      // ════════════════════════════════════════════════════════════════════════
      // 11. STUDENT DASHBOARD
      // ════════════════════════════════════════════════════════════════════════
      heading('11. Student Dashboard — /api/v1'),

      endpoint('GET', '/:slug/me/dashboard', 'Get student progress dashboard'),
      authLine('STUDENT'),
      ...responseBlock('200', [
        '[',
        '  {',
        '    "courseId": "uuid",',
        '    "title": "Course Name",',
        '    "totalLessons": 10,',
        '    "completedLessons": 7,',
        '    "percentage": 70',
        '  }',
        ']'
      ]),
      divider(),

      // ════════════════════════════════════════════════════════════════════════
      // 12. ADMIN ROUTES
      // ════════════════════════════════════════════════════════════════════════
      heading('12. Admin Routes — /api/v1'),

      endpoint('GET', '/:slug/overview', 'Dashboard overview (counts)'),
      authLine('ADMIN'),
      ...responseBlock('200', [
        '{',
        '  "success": true,',
        '  "data": {',
        '    "totalUsers": 100, "totalCourses": 20,',
        '    "totalEnrollments": 300, "totalCertificates": 50',
        '  }',
        '}'
      ]),
      divider(),

      endpoint('GET', '/:slug/stats/users', 'User count grouped by role'),
      authLine('ADMIN'),
      ...responseBlock('200', [
        '{ "success": true, "data": [{ "roleId": "uuid", "roleName": "STUDENT", "count": 80 }] }'
      ]),
      divider(),

      endpoint('GET', '/:slug/stats/enrollments', 'Enrollment count grouped by status'),
      authLine('ADMIN'),
      ...responseBlock('200', [
        '{ "success": true, "data": [{ "status": "ACTIVE", "_count": { "_all": 200 } }] }'
      ]),
      divider(),

      endpoint('PATCH', '/:slug/users/:userId', 'Update a user\'s role'),
      authLine('ADMIN (cannot self-demote, cannot remove last admin)'),
      ...bodyBlock([
        '{',
        '  "role": "INSTRUCTOR | STUDENT | ADMIN"',
        '}'
      ]),
      ...responseBlock('200', ['{ "success": true, "message": "Role updated successfully" }']),
      divider(),

      endpoint('PATCH', '/:slug/courses/:courseId/approve', 'Approve a course'),
      authLine('ADMIN'),
      para('Body: None.'),
      ...responseBlock('200', ['{ "success": true, "message": "Course approved" }']),
      divider(),

      endpoint('GET', '/:slug/certificates', 'List all certificates for tenant'),
      authLine('ADMIN'),
      ...responseBlock('200', ['{ "success": true, "data": [{ ...certificateObject }] }']),
      divider(),

      endpoint('GET', '/:slug/audit-logs', 'Get audit logs (paginated)'),
      authLine('ADMIN'),
      richPara(bold('Query: '), code('?page=1&limit=20')),
      ...responseBlock('200', [
        '{',
        '  "success": true,',
        '  "data": [{',
        '    "id": "uuid", "action": "UPDATE_TENANT_SETTINGS",',
        '    "entityType": "Tenant",',
        '    "user": { "id", "firstName", "lastName", "email" },',
        '    "createdAt": "..."',
        '  }],',
        '  "pagination": { "page": 1, "limit": 20, "total": 100 }',
        '}'
      ]),
      divider(),

      endpoint('PATCH', '/:slug/settings', 'Update tenant settings'),
      authLine('ADMIN'),
      ...bodyBlock([
        '{',
        '  "name": "string (optional)",',
        '  "slug": "string (optional)",',
        '  "logoUrl": "string (optional)",',
        '  "website": "string (optional)",',
        '  "supportEmail": "string (optional)"',
        '}'
      ]),
      para('At least one field required.'),
      ...responseBlock('200', [
        '{',
        '  "success": true,',
        '  "message": "Tenant settings updated successfully",',
        '  "data": { "id", "name", "slug", "logoUrl", "website", "supportEmail" }',
        '}'
      ]),
      divider(),

      // ════════════════════════════════════════════════════════════════════════
      // ENUMS
      // ════════════════════════════════════════════════════════════════════════
      heading('Enums'),
      codeBullet('AssessmentType', 'QUIZ | EXAM | ASSIGNMENT'),
      codeBullet('SubscriptionStatus', 'ACTIVE | CANCELLED | EXPIRED'),
      codeBullet('CertificateStatus', 'ACTIVE | REVOKED'),
      codeBullet('EnrollmentStatus', 'ACTIVE | COMPLETED | DROPPED | CANCELLED'),
      codeBullet('CourseStatus', 'PENDING | APPROVED | REJECTED'),
      divider(),

      // ════════════════════════════════════════════════════════════════════════
      // ERROR FORMAT
      // ════════════════════════════════════════════════════════════════════════
      heading('Error Response Format'),
      para('All errors follow a consistent shape:'),
      ...codeBlock(['{ "success": false, "message": "Error description" }']),
      spacer(),
      heading('Common HTTP Status Codes', HeadingLevel.HEADING_3),
      bullet('400 — Bad Request (validation failure)'),
      bullet('401 — Unauthenticated (missing/invalid token)'),
      bullet('403 — Forbidden (insufficient role)'),
      bullet('404 — Not Found'),
      bullet('409 — Conflict (duplicate resource)'),
      bullet('500 — Internal Server Error'),
      divider(),

      // ════════════════════════════════════════════════════════════════════════
      // ENV VARS
      // ════════════════════════════════════════════════════════════════════════
      heading('Environment Variables'),
      bullet('PORT — Server port'),
      bullet('CLIENT_URL — Allowed CORS origin'),
      bullet('NODE_ENV — development | production'),
      bullet('ACCESS_TOKEN_SECRET — JWT signing secret'),
      bullet('REFRESH_TOKEN_SECRET — Refresh token secret'),
      bullet('ACCESS_TOKEN_EXPIRES_IN — Access token TTL'),
      bullet('REFRESH_TOKEN_EXPIRES_IN — Refresh token TTL'),
      bullet('DATABASE_URL — PostgreSQL connection string'),
      bullet('DIRECT_URL — Direct DB connection (for migrations)'),
      bullet('CERTIFICATE_SECRET — HMAC secret for certificate verification hashes'),
      bullet('REDIS_HOST / REDIS_PORT / REDIS_PASSWORD — Redis for rate limiting'),
      bullet('SUPER_USER_NAME / SUPER_USER_EMAIL / SUPERUSER_PASSWORD — Seed super admin'),
    ]
  }]
});

// ── Write to disk ────────────────────────────────────────────────────────────

const buffer = await Packer.toBuffer(doc);
const outPath = './LMS_API_Documentation.docx';
fs.writeFileSync(outPath, buffer);
console.log(`Document generated: ${outPath}`);
