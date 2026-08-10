import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inquiriesApi } from '../api/inquiries';

export function useAdminInquiries() {
  return useQuery({
    queryKey: ['inquiries', 'admin'],
    queryFn: () => inquiriesApi.adminList(),
    select: (res) => res.data.inquiries,
  });
}

export function useUpdateInquiryStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => inquiriesApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inquiries'] }),
  });
}
