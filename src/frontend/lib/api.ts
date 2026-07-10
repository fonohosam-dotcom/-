export const apiFetch = async (url: string, options?: RequestInit) => {
  const response = await fetch(`/api${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return response.json();
};

export const getCases = () => apiFetch('/cases').then(res => res.cases || res);
export const getProjects = () => apiFetch('/projects').then(res => res.projects || res);
export const getLedger = () => apiFetch('/ledger').then(res => res.ledger || res);
export const submitCaseEvaluation = (data: any) => apiFetch('/cases/evaluate', { method: 'POST', body: JSON.stringify(data) });
export const uploadMedicalReport = (data: any) => apiFetch('/medical/upload', { method: 'POST', body: JSON.stringify(data) });
