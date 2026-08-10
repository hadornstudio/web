import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics';

export function useAnalyticsOverview(days = 30) {
  return useQuery({
    queryKey: ['analytics', 'overview', days],
    queryFn: () => analyticsApi.overview(days),
    select: (res) => res.data,
  });
}
