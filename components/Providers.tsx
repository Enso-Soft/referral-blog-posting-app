'use client'

import { ReactNode } from 'react'
import { AuthProvider } from '@/components/AuthProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import { PostsProvider } from '@/context/PostsProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { QueryProvider } from '@/components/QueryProvider'

interface ProvidersProps {
  children: ReactNode
}

/**
 * 앱 전역 Provider들을 래핑하는 컴포넌트
 * ErrorBoundary로 클라이언트 측 에러도 처리
 * QueryProvider로 TanStack Query 캐싱 지원
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <AuthProvider>
            <PostsProvider>{children}</PostsProvider>
          </AuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </QueryProvider>
  )
}
