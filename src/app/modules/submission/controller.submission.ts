import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { submissionServices } from './service.submission';

const createSubmission = catchAsync(async (req, res) => {
  const studentId = req.user.id;
  const result = await submissionServices.createSubmission(studentId, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Project submitted successfully',
    data: result,
  });
});

const editSubmission = catchAsync(async (req, res) => {
  const studentId = req.user.id;
  const id = req.params['id'] as string;
  const result = await submissionServices.editSubmission(studentId, id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Submission updated successfully',
    data: result,
  });
});

const getMySubmissions = catchAsync(async (req, res) => {
  const studentId = req.user.id;
  const result = await submissionServices.getMySubmissions(studentId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Your submissions retrieved successfully',
    data: result,
  });
});

const getAllSubmissions = catchAsync(async (req, res) => {
  const query = req.query as Record<string, string>;
  const filters = {
    status: query.status as 'PENDING' | 'APPROVED' | 'REJECTED' | undefined,
    assignmentNumber: query.assignmentNumber ? Number(query.assignmentNumber) : undefined,
    searchTerm: query.searchTerm,
  };
  const paginationOptions = {
    page: query.page ? Number(query.page) : undefined,
    limit: query.limit ? Number(query.limit) : undefined,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder as 'asc' | 'desc' | undefined,
  };

  const result = await submissionServices.getAllSubmissions(filters, paginationOptions);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Submissions retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSubmissionStats = catchAsync(async (_req, res) => {
  const result = await submissionServices.getSubmissionStats();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Submission statistics retrieved successfully',
    data: result,
  });
});

const updateSubmissionStatus = catchAsync(async (req, res) => {
  const mentorId = req.user.id;
  const id = req.params['id'] as string;
  const result = await submissionServices.updateSubmissionStatus(mentorId, id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Submission ${req.body.status === 'APPROVED' ? 'approved' : 'rejected'} successfully`,
    data: result,
  });
});

const getMentorActivity = catchAsync(async (req, res) => {
  const mentorId = req.user.id;
  const query = req.query as Record<string, string>;
  const result = await submissionServices.getMentorActivity(mentorId, {
    page: query.page ? Number(query.page) : undefined,
    limit: query.limit ? Number(query.limit) : undefined,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Activity log retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const submissionControllers = {
  createSubmission,
  editSubmission,
  getMySubmissions,
  getAllSubmissions,
  getSubmissionStats,
  updateSubmissionStatus,
  getMentorActivity,
};
