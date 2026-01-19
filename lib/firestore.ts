import { Timestamp } from 'firebase/firestore'

// Zod 스키마에서 타입 re-export (런타임 검증용)
export { BlogPostSchema, ProductSchema, CreatePostSchema, UpdatePostSchema } from './schemas'
export type { Product, BlogPost, CreatePostInput, UpdatePostInput } from './schemas'

// Firestore Timestamp 유틸리티
export type FirestoreTimestamp = Timestamp | { _seconds: number; _nanoseconds: number } | { seconds: number; nanoseconds: number }

/**
 * 다양한 형태의 Timestamp를 Date로 변환
 */
export function timestampToDate(timestamp: FirestoreTimestamp | Date | null | undefined): Date | null {
  if (!timestamp) return null

  // Date 객체인 경우
  if (timestamp instanceof Date) {
    return timestamp
  }

  // Firestore Timestamp (toDate 메서드 있음)
  if ('toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate()
  }

  // Admin SDK 형식 (_seconds)
  if ('_seconds' in timestamp) {
    return new Date(timestamp._seconds * 1000)
  }

  // 클라이언트 SDK 형식 (seconds)
  if ('seconds' in timestamp) {
    return new Date(timestamp.seconds * 1000)
  }

  return null
}

/**
 * Timestamp를 한국어 날짜 문자열로 변환
 */
export function formatTimestamp(
  timestamp: FirestoreTimestamp | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = timestampToDate(timestamp)
  if (!date) return ''

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }

  return new Intl.DateTimeFormat('ko-KR', options || defaultOptions).format(date)
}
