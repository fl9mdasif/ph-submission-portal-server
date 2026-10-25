import { z } from 'zod';

const createSubmissionSchema = z.object({
  body: z.object({
    assignmentNumber: z
      .number({ message: 'Assignment number is required' })
      .int()
      .min(1, 'Assignment number must be between 1 and 15')
      .max(15, 'Assignment number must be between 1 and 15'),
    projectName: z
      .string({ message: 'Project name is required' })
      .trim()
      .min(3, 'Project name must be at least 3 characters'),
    repoUrl: z
      .string({ message: 'Repository URL is required' })
      .url('Must be a valid URL')
      .regex(/github\.com|gitlab\.com|bitbucket\.org/, 'Must be a GitHub, GitLab, or Bitbucket URL'),
    liveLink: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    description: z
      .string({ message: 'Description is required' })
      .trim()
      .min(20, 'Description must be at least 20 characters'),
  }),
});

const editSubmissionSchema = createSubmissionSchema;

const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED'], { message: 'Status must be APPROVED or REJECTED' }),
    feedback: z.string().trim().optional(),
  }),
});

export const submissionValidations = {
  createSubmissionSchema,
  editSubmissionSchema,
  updateStatusSchema,
};
