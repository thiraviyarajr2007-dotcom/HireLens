import { auth } from '../firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Helper to retrieve current Firebase ID Token or demo token
 */
async function getAuthHeaders() {
  const headers = {};
  try {
    if (auth && auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
      return headers;
    }
  } catch (e) {
    // Continue to check local demo session
  }

  const demoUser = localStorage.getItem('hirelens_demo_user');
  if (demoUser || import.meta.env.VITE_DEMO_MODE === 'true') {
    headers['Authorization'] = 'Bearer demo-token-recruiter';
  }
  return headers;
}

/**
 * HireLens REST API Client Service:
 * Handles communication between React Frontend and Express Backend REST API.
 */

export async function analyzeSingleResumeApi(file, jobDescription, jobId = null, runId = null) {
  const formData = new FormData();
  if (file) {
    formData.append('resume', file);
  }
  if (jobDescription) {
    formData.append('jobDescription', jobDescription);
  }
  if (jobId) {
    formData.append('jobId', jobId);
  }
  if (runId) {
    formData.append('runId', runId);
  }

  const authHeaders = await getAuthHeaders();
  const headers = { ...authHeaders };
  if (runId) {
    headers['x-run-id'] = runId;
  }

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers,
    body: formData
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error?.message || 'Failed to analyze resume via backend service.');
  }

  return data;
}

export async function analyzeBulkResumesApi(files, jobDescription, jobId = null) {
  const formData = new FormData();
  (files || []).forEach(file => {
    formData.append('resumes', file);
  });
  if (jobDescription) {
    formData.append('jobDescription', jobDescription);
  }
  if (jobId) {
    formData.append('jobId', jobId);
  }

  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/analyze/bulk`, {
    method: 'POST',
    headers,
    body: formData
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error?.message || 'Failed to execute bulk analysis via backend service.');
  }

  return data;
}

export async function fetchCandidatesApi() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/candidates`, { headers });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error?.message || 'Failed to fetch candidates from backend API.');
  }
  return data.candidates;
}

export async function fetchCandidateByIdApi(id) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/candidates/${id}`, { headers });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error?.message || 'Candidate record not found on backend.');
  }
  return data.candidate;
}

export async function fetchCandidateEvidenceApi(id) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/candidates/${id}/evidence`, { headers });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error?.message || 'Candidate evidence not found on backend.');
  }
  return data.evidenceFields;
}

export async function fetchHistoryApi() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/history`, { headers });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error?.message || 'Failed to fetch analysis history from backend API.');
  }
  return data.history;
}

export async function fetchEvaluationByIdApi(id) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/evaluations/${id}`, { headers });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error?.message || 'Evaluation audit record not found.');
  }
  return data.evaluation;
}

export async function runCounterfactualBiasApi(evaluationId, payload = {}) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/audit/counterfactual/${evaluationId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error?.message || 'Counterfactual bias test failed.');
  }
  return data.report;
}

export async function submitHumanOverrideApi(evaluationId, payload = {}) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/audit/override/${evaluationId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error?.message || 'Human override submission failed.');
  }
  return data;
}

export async function logIdentityRevealApi(evaluationId, payload = {}) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/audit/reveal/${evaluationId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error?.message || 'Failed to log identity reveal.');
  }
  return data.log;
}

export async function fetchAggregateFairnessApi() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/audit/aggregate`, { headers });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error?.message || 'Failed to fetch aggregate fairness analytics.');
  }
  return data.metrics;
}

export async function fetchJobsApi() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/jobs`, { headers });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error?.message || 'Failed to fetch jobs list.');
  }
  return data.jobs;
}

export async function createJobApi(jobDescription, overrides = {}) {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ jobDescription, ...overrides })
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error?.message || 'Failed to parse and save job.');
  }
  return data.job;
}

/**
 * SSE Real-Time Run Event Subscription (B16 fix)
 */
export function subscribeToRunEvents(runId, { onInit, onStage, onComplete, onError }) {
  const eventSource = new EventSource(`${API_BASE_URL}/analyze/${runId}/events`);

  eventSource.addEventListener('init', (e) => {
    try {
      const data = JSON.parse(e.data);
      onInit?.(data);
    } catch (err) {}
  });

  eventSource.addEventListener('stage', (e) => {
    try {
      const data = JSON.parse(e.data);
      onStage?.(data);
    } catch (err) {}
  });

  eventSource.addEventListener('complete', (e) => {
    try {
      const data = JSON.parse(e.data);
      onComplete?.(data);
    } catch (err) {}
    eventSource.close();
  });

  eventSource.addEventListener('error', (e) => {
    try {
      const data = e.data ? JSON.parse(e.data) : { error: 'Stream error' };
      onError?.(data);
    } catch (err) {
      onError?.({ error: 'Connection to stage event stream closed or unavailable' });
    }
    eventSource.close();
  });

  return () => {
    eventSource.close();
  };
}
