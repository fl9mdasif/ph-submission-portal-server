import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import prisma from '../../../shared/prisma';
import { paginationHelper } from '../../../shared/paginationHelper';
import pick from '../../../shared/pick';
import { TPaginationOptions } from '../../interface/pagination';
import {
  TCreateSubmission,
  TEditSubmission,
  TSubmissionFilters,
  TUpdateSubmissionStatus,
} from './interface.submission';
import { Prisma, SubmissionStatus } from '@prisma/client';

const createSubmission = async (studentId: string, payload: TCreateSubmission) => {
  const existing = await prisma.submission.findFirst({
    where: { studentId, assignmentNumber: payload.assignmentNumber },
  });

  if (existing) {
    throw new ApiError(
      httpStatus.CONFLICT,
      `You have already submitted assignment ${payload.assignmentNumber}`,
    );
  }

  const submission = await prisma.submission.create({
    data: { ...payload, studentId, liveLink: payload.liveLink || null },
    include: { student: { select: { name: true, email: true } } },
  });

  return submission;
};

const editSubmission = async (studentId: string, id: string, payload: TEditSubmission) => {
  const submission = await prisma.submission.findUnique({ where: { id } });

  if (!submission || submission.studentId !== studentId) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Submission not found');
  }

  if (submission.edited) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only edit a submission once');
  }

  if (submission.assignmentNumber !== payload.assignmentNumber) {
    const clash = await prisma.submission.findFirst({
      where: { studentId, assignmentNumber: payload.assignmentNumber, id: { not: id } },
    });
    if (clash) {
      throw new ApiError(
        httpStatus.CONFLICT,
        `You have already submitted assignment ${payload.assignmentNumber}`,
      );
    }
  }

  const updated = await prisma.submission.update({
    where: { id },
    data: {
      ...payload,
      liveLink: payload.liveLink || null,
      edited: true,
      status: 'PENDING',
      feedback: null,
    },
    include: { student: { select: { name: true, email: true } } },
  });

  return updated;
};

const getMySubmissions = async (studentId: string) => {
  return prisma.submission.findMany({
    where: { studentId },
    orderBy: { assignmentNumber: 'asc' },
  });
};

const getAllSubmissions = async (
  filters: TSubmissionFilters,
  paginationOptions: TPaginationOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(paginationOptions);

  const where: Prisma.SubmissionWhereInput = {};
  if (filters.status) {
    where.status = filters.status as SubmissionStatus;
  }
  if (filters.assignmentNumber) {
    where.assignmentNumber = filters.assignmentNumber;
  }
  if (filters.searchTerm) {
    where.OR = [
      { projectName: { contains: filters.searchTerm, mode: 'insensitive' } },
      { student: { name: { contains: filters.searchTerm, mode: 'insensitive' } } },
      { student: { email: { contains: filters.searchTerm, mode: 'insensitive' } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: { student: { select: { name: true, email: true } } },
    }),
    prisma.submission.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getSubmissionStats = async () => {
  const grouped = await prisma.submission.groupBy({
    by: ['status'],
    _count: { status: true },
  });

  const stats = { PENDING: 0, APPROVED: 0, REJECTED: 0, total: 0 };
  for (const group of grouped) {
    stats[group.status as keyof typeof stats] = group._count.status;
    stats.total += group._count.status;
  }

  return stats;
};

const updateSubmissionStatus = async (
  mentorId: string,
  id: string,
  payload: TUpdateSubmissionStatus,
) => {
  const submission = await prisma.submission.findUnique({ where: { id } });
  if (!submission) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Submission not found');
  }

  const [updated] = await prisma.$transaction([
    prisma.submission.update({
      where: { id },
      data: {
        status: payload.status,
        feedback: payload.feedback ?? null,
      },
      include: { student: { select: { name: true, email: true } } },
    }),
    prisma.activityLog.create({
      data: {
        mentorId,
        submissionId: id,
        action: payload.status === 'APPROVED' ? 'APPROVED_SUBMISSION' : 'REJECTED_SUBMISSION',
        detail: `${submission.projectName} (assignment ${submission.assignmentNumber})`,
      },
    }),
  ]);

  return updated;
};

const getMentorActivity = async (mentorId: string, paginationOptions: TPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(paginationOptions);

  const [data, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: { mentorId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.activityLog.count({ where: { mentorId } }),
  ]);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const submissionServices = {
  createSubmission,
  editSubmission,
  getMySubmissions,
  getAllSubmissions,
  getSubmissionStats,
  updateSubmissionStatus,
  getMentorActivity,
};
