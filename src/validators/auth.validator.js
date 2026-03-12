import { z } from 'zod';

/*
| COMMON VALIDATORS
*/

export const slugSchema = z
  .string({
    required_error: 'Tenant slug is required',
    invalid_type_error: 'Slug must be a string'
  })
  .min(3, { message: 'Slug must be at least 3 characters long' })
  .max(50, { message: 'Slug must not exceed 50 characters' })
  .regex(/^[a-z0-9-]+$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens'
  });

const emailSchema = z
  .string({
    required_error: 'Email is required',
    invalid_type_error: 'Email must be a string'
  })
  .email({ message: 'Please provide a valid email address' })
  .trim()
  .toLowerCase();

const passwordSchema = z
  .string({
    required_error: 'Password is required',
    invalid_type_error: 'Password must be a string'
  })
  .min(8, { message: 'Password must be at least 8 characters long' })
  .max(128, { message: 'Password must not exceed 128 characters' });

/*
| LOGIN
*/

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema
  })
});

/*
| REGISTER TENANT (ORGANIZATION)
*/

export const registerTenantSchema = z.object({
  body: z.object({
    organizationName: z
      .string({
        required_error: 'Organization name is required',
        invalid_type_error: 'Organization name must be a string'
      })
      .min(3, { message: 'Organization name must be at least 3 characters long' })
      .max(100, { message: 'Organization name must not exceed 100 characters' })
      .trim(),

    slug: slugSchema,

    adminEmail: emailSchema,

    adminPassword: passwordSchema
  })
});

/*
| USER REGISTRATION BASE
*/

const userRegistrationBody = z.object({
  name: z
    .string({
      required_error: 'Name is required',
      invalid_type_error: 'Name must be a string'
    })
    .min(2, { message: 'Name must be at least 2 characters long' })
    .max(100, { message: 'Name must not exceed 100 characters' })
    .trim(),

  email: emailSchema,

  password: passwordSchema
});

/*
| REGISTER INSTRUCTOR
*/

export const registerInstructorSchema = z.object({
  params: z.object({
    slug: slugSchema
  }),
  body: userRegistrationBody
});

/*
| REGISTER STUDENT
*/

export const registerStudentSchema = z.object({
  params: z.object({
    slug: slugSchema
  }),
  body: userRegistrationBody
});

/*
| REFRESH TOKEN
*/

export const refreshTokenSchema = z.object({
  params: z.object({
    slug: slugSchema
  })
});
