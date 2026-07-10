import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCases, getProjects, getLedger, submitCaseEvaluation, uploadMedicalReport } from '../lib/api';

export function useCases() {
  return useQuery({ queryKey: ['cases'], queryFn: getCases });
}

export function useProjects() {
  return useQuery({ queryKey: ['projects'], queryFn: getProjects });
}

export function useLedger() {
  return useQuery({ queryKey: ['ledger'], queryFn: getLedger });
}

export function useSubmitEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitCaseEvaluation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cases'] }),
  });
}

export function useUploadMedicalReport() {
  return useMutation({
    mutationFn: uploadMedicalReport,
  });
}
