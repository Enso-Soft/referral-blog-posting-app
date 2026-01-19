'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/components/AuthProvider'
import { queryKeys } from '@/lib/query-client'
import type { BlogPost } from '@/lib/schemas'

interface PostsQueryParams {
  status?: 'all' | 'draft' | 'published'
  limit?: number
  lastId?: string
}

interface PostsListData {
  posts: BlogPost[]
  total: number
  hasMore: boolean
}

async function fetchPosts(
  token: string | null,
  params: PostsQueryParams
): Promise<PostsListData> {
  if (!token) {
    throw new Error('인증이 필요합니다')
  }

  const searchParams = new URLSearchParams()
  if (params.status && params.status !== 'all') {
    searchParams.set('status', params.status)
  }
  if (params.limit) {
    searchParams.set('limit', params.limit.toString())
  }
  if (params.lastId) {
    searchParams.set('lastId', params.lastId)
  }

  const response = await fetch(`/api/posts?${searchParams}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || '포스트 목록을 불러오는데 실패했습니다')
  }

  const data = await response.json()
  return {
    posts: data.posts || [],
    total: data.total || 0,
    hasMore: data.hasMore || false,
  }
}

/**
 * TanStack Query 기반 포스트 목록 조회 hook
 */
export function usePostsQuery(params: PostsQueryParams = {}) {
  const { getAuthToken, user, loading: authLoading } = useAuth()

  return useQuery({
    queryKey: queryKeys.posts.list({
      status: params.status,
    }),
    queryFn: async () => {
      const token = await getAuthToken()
      return fetchPosts(token, params)
    },
    enabled: !authLoading && !!user,
    staleTime: 1 * 60 * 1000, // 1분간 fresh
  })
}
