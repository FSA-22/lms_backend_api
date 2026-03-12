import { z } from 'zod';
import { slugSchema } from './auth.validator.js';
import { courseIdSchema } from './course.validator.js';

/*
| COMMON SCHEMAS
*/

const lessonIdSchema = z
  .string({
    required_error: 'Lesson ID is required'
  })
  .uuid({ message: 'Invalid lesson ID format' });

/*
| CREATE LESSON
*/

export const createLessonSchema = z.object({
  params: z.object({
    slug: slugSchema,
    courseId: courseIdSchema
  }),
  body: z.object({
    title: z
      .string({
        required_error: 'Lesson title is required'
      })
      .min(3, { message: 'Lesson title must be at least 3 characters' })
      .max(200, { message: 'Lesson title cannot exceed 200 characters' })
      .trim(),

    content: z
      .string({
        required_error: 'Lesson content is required'
      })
      .min(1, { message: 'Lesson content cannot be empty' }),

    isPublished: z.boolean().optional()
  })
});

/*
| UPDATE LESSON
*/

export const updateLessonSchema = z.object({
  params: z.object({
    slug: slugSchema,
    courseId: courseIdSchema,
    lessonId: lessonIdSchema
  }),
  body: z
    .object({
      title: z
        .string()
        .min(3, { message: 'Lesson title must be at least 3 characters' })
        .max(200)
        .trim()
        .optional(),

      content: z.string().optional(),

      order: z
        .number({
          invalid_type_error: 'Order must be a number'
        })
        .int({ message: 'Order must be an integer' })
        .min(1, { message: 'Order must be at least 1' })
        .optional(),

      isPublished: z.boolean().optional()
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update'
    })
});

/*
| GET LESSON BY ID
*/

export const getLessonByIdSchema = z.object({
  params: z.object({
    slug: slugSchema,
    courseId: courseIdSchema,
    lessonId: lessonIdSchema
  })
});

/*
| DELETE LESSON
*/

export const deleteLessonSchema = z.object({
  params: z.object({
    slug: slugSchema,
    courseId: courseIdSchema,
    lessonId: lessonIdSchema
  })
});

/*
| GET LESSONS BY COURSE (WITH OPTIONAL PAGINATION)
*/

export const getLessonsByCourseSchema = z.object({
  params: z.object({
    slug: slugSchema,
    courseId: courseIdSchema
  }),
  query: z
    .object({
      page: z.coerce.number().min(1).optional(),
      limit: z.coerce.number().min(1).max(100).optional()
    })
    .optional()
});
