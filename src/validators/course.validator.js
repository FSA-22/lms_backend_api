import { z } from 'zod';

/*
|--------------------------------------------------------------------------
| COMMON SCHEMAS
|--------------------------------------------------------------------------
*/

const slugSchema = z
  .string({
    required_error: 'Tenant slug is required',
    invalid_type_error: 'Slug must be a string'
  })
  .min(3, { message: 'Slug must be at least 3 characters long' })
  .max(50, { message: 'Slug must not exceed 50 characters' })
  .regex(/^[a-z0-9-]+$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens'
  });

const courseIdSchema = z
  .string({
    required_error: 'Course ID is required'
  })
  .uuid({ message: 'Invalid course ID format' });

/*
|--------------------------------------------------------------------------
| CREATE COURSE
|--------------------------------------------------------------------------
*/

export const createCourseSchema = z.object({
  params: z.object({
    slug: slugSchema
  }),
  body: z.object({
    title: z
      .string({
        required_error: 'Course title is required'
      })
      .min(3, { message: 'Course title must be at least 3 characters' })
      .max(200, { message: 'Course title cannot exceed 200 characters' })
      .trim(),

    description: z
      .string({
        required_error: 'Course description is required'
      })
      .min(10, { message: 'Description must be at least 10 characters' })
      .max(2000, { message: 'Description cannot exceed 2000 characters' }),

    price: z
      .number({
        invalid_type_error: 'Price must be a number'
      })
      .min(0, { message: 'Price cannot be negative' })
      .optional(),

    isPublished: z.boolean().optional()
  })
});

/*
|--------------------------------------------------------------------------
| UPDATE COURSE
|--------------------------------------------------------------------------
*/

export const updateCourseSchema = z.object({
  params: z.object({
    slug: slugSchema,
    courseId: courseIdSchema
  }),
  body: z.object({
    title: z
      .string()
      .min(3, { message: 'Course title must be at least 3 characters' })
      .max(200)
      .trim()
      .optional(),

    description: z
      .string()
      .min(10, { message: 'Description must be at least 10 characters' })
      .max(2000)
      .optional(),

    price: z
      .number({
        invalid_type_error: 'Price must be a number'
      })
      .min(0)
      .optional(),

    isPublished: z.boolean().optional()
  })
});

/*
|--------------------------------------------------------------------------
| GET COURSE BY ID
|--------------------------------------------------------------------------
*/

export const getCourseByIdSchema = z.object({
  params: z.object({
    slug: slugSchema,
    courseId: courseIdSchema
  })
});

/*
|--------------------------------------------------------------------------
| DELETE COURSE
|--------------------------------------------------------------------------
*/

export const deleteCourseSchema = z.object({
  params: z.object({
    slug: slugSchema,
    courseId: courseIdSchema
  })
});

/*
|--------------------------------------------------------------------------
| GET COURSES (WITH OPTIONAL PAGINATION)
|--------------------------------------------------------------------------
*/

export const getCoursesSchema = z.object({
  params: z.object({
    slug: slugSchema
  }),
  query: z
    .object({
      page: z.coerce.number().min(1).optional(),
      limit: z.coerce.number().min(1).max(100).optional(),
      search: z.string().optional()
    })
    .optional()
});
