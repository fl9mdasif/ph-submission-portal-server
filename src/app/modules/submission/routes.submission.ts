import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { submissionRateLimiter } from '../../middlewares/rateLimiters';
import { submissionControllers } from './controller.submission';
import { submissionValidations } from './validation.submission';

const router = Router();

// static paths before dynamic params
router.get('/stats', auth('MENTOR'), submissionControllers.getSubmissionStats);
router.get('/activity', auth('MENTOR'), submissionControllers.getMentorActivity);
router.get('/my', auth('STUDENT'), submissionControllers.getMySubmissions);

router.get('/', auth('MENTOR'), submissionControllers.getAllSubmissions);

router.post(
  '/',
  auth('STUDENT'),
  submissionRateLimiter,
  validateRequest(submissionValidations.createSubmissionSchema),
  submissionControllers.createSubmission,
);

router.patch(
  '/:id/status',
  auth('MENTOR'),
  validateRequest(submissionValidations.updateStatusSchema),
  submissionControllers.updateSubmissionStatus,
);

router.patch(
  '/:id',
  auth('STUDENT'),
  validateRequest(submissionValidations.editSubmissionSchema),
  submissionControllers.editSubmission,
);

export const submissionRoutes = router;
