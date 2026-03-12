import { z } from 'zod';
import { slugSchema } from './auth.validator.js';

/*
| COMMON SCHEMAS
*/

const lessonIdSchema = z
  .string({
    required_error: 'Lesson ID is required'
  })
  .uuid({ message: 'Invalid lesson ID format' });

const attachmentIdSchema = z
  .string({
    required_error: 'Attachment ID is required'
  })
  .uuid({ message: 'Invalid attachment ID format' });

/*
| ADD LESSON ATTACHMENT
*/

export const addLessonAttachmentSchema = z.object({
  params: z.object({
    slug: slugSchema,
    lessonId: lessonIdSchema
  }),
  body: z.object({
    fileName: z
      .string({
        required_error: 'File name is required'
      })
      .min(2, { message: 'File name must be at least 2 characters' })
      .max(255, { message: 'File name cannot exceed 255 characters' })
      .trim(),

    fileUrl: z
      .string({
        required_error: 'File URL is required'
      })
      .url({ message: 'Invalid file URL' }),

    fileSize: z
      .number({
        invalid_type_error: 'File size must be a number'
      })
      .min(0, { message: 'File size cannot be negative' })
      .optional()
  })
});

/*
| GET LESSON ATTACHMENTS
*/

export const getLessonAttachmentsSchema = z.object({
  params: z.object({
    slug: slugSchema,
    lessonId: lessonIdSchema
  })
});

/*
| UPDATE LESSON ATTACHMENT
*/

export const updateLessonAttachmentSchema = z.object({
  params: z.object({
    slug: slugSchema,
    lessonId: lessonIdSchema,
    attachmentId: attachmentIdSchema
  }),
  body: z
    .object({
      fileName: z
        .string()
        .min(2, { message: 'File name must be at least 2 characters' })
        .max(255)
        .trim()
        .optional(),

      fileUrl: z.string().url({ message: 'Invalid file URL' }).optional(),

      fileSize: z
        .number({
          invalid_type_error: 'File size must be a number'
        })
        .min(0)
        .optional()
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update'
    })
});

/*
| DELETE LESSON ATTACHMENT
*/

export const deleteLessonAttachmentSchema = z.object({
  params: z.object({
    slug: slugSchema,
    lessonId: lessonIdSchema,
    attachmentId: attachmentIdSchema
  })
});
