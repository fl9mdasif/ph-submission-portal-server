export type TCreateSubmission = {
  assignmentNumber: number;
  projectName: string;
  repoUrl: string;
  liveLink?: string;
  description: string;
};

export type TEditSubmission = {
  assignmentNumber: number;
  projectName: string;
  repoUrl: string;
  liveLink?: string;
  description: string;
};

export type TUpdateSubmissionStatus = {
  status: 'APPROVED' | 'REJECTED';
  feedback?: string;
};

export type TSubmissionFilters = {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  assignmentNumber?: number;
  searchTerm?: string;
};
