import { useQuery } from '@tanstack/react-query'

export function useEcosQuery() {
  // To be implemented in Phase 3
  return useQuery({
    queryKey: ['ecosData'],
    queryFn: async () => {
      const res = await fetch('/api/ecos')
      if (!res.ok) throw new Error('Failed to fetch ECOS data')
      return res.json()
    },
  })
}
