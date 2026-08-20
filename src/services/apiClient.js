const API_BASE_URL = 'http://localhost:5000/api';

/**
 * HireLens REST API Client Service:
 * Handles communication between React Frontend and Express Backend REST API.
 */

export async function analyzeSingleResumeApi(file, jobDescription) {
  const formData = new FormData();
  if (file) {
    formData.append('resume', file);
  }
  formData.append('jobDescription', jobDescription);

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error?.message || 'Failed to analyze resume via backend service.');
  }

  return data;
}

export async function analyzeBulkResumesApi(files, jobDescription) {
  const formData = new FormData();
  (files || []).forEach(file => {
    formData.append('resumes', file);
  });
  formData.append('jobDescription', jobDescription);

  const response = await fetch(`${API_BASE_URL}/analyze/bulk`, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error?.message || 'Failed to execute bulk analysis via backend service.');
  }

  return data;
}

export async function fetchCandidatesApi() {
  const response = await fetch(`${API_BASE_URL}/candidates`);
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error?.message || 'Failed to fetch candidates from backend API.');
  }
  return data.candidates;
}

export async function fetchCandidateByIdApi(id) {
  const response = await fetch(`${API_BASE_URL}/candidates/${id}`);
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error?.message || 'Candidate record not found on backend.');
  }
  return data.candidate;
}

export async function fetchCandidateEvidenceApi(id) {
  const response = await fetch(`${API_BASE_URL}/candidates/${id}/evidence`);
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error?.message || 'Candidate evidence not found on backend.');
  }
  return data.evidenceFields;
}

export async function fetchHistoryApi() {
  const response = await fetch(`${API_BASE_URL}/history`);
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error?.message || 'Failed to fetch analysis history from backend API.');
  }
  return data.history;
}
