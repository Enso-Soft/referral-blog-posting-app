import { z } from 'zod'
import { BlogPostSchema } from './post'

// 기본 API 응답 스키마
export const BaseResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  details: z.string().optional(),
})

// 포스트 목록 조회 응답
export const PostsListResponseSchema = BaseResponseSchema.extend({
  posts: z.array(BlogPostSchema).optional(),
  total: z.number().optional(),
  hasMore: z.boolean().optional(),
})

export type PostsListResponse = z.infer<typeof PostsListResponseSchema>

// 단일 포스트 조회 응답
export const PostDetailResponseSchema = BaseResponseSchema.extend({
  post: BlogPostSchema.optional(),
})

export type PostDetailResponse = z.infer<typeof PostDetailResponseSchema>

// 포스트 생성 응답
export const CreatePostResponseSchema = BaseResponseSchema.extend({
  id: z.string().optional(),
})

export type CreatePostResponse = z.infer<typeof CreatePostResponseSchema>

// 포스트 수정 응답
export const UpdatePostResponseSchema = BaseResponseSchema

export type UpdatePostResponse = z.infer<typeof UpdatePostResponseSchema>

// 포스트 삭제 응답
export const DeletePostResponseSchema = BaseResponseSchema

export type DeletePostResponse = z.infer<typeof DeletePostResponseSchema>

// 타입 가드 헬퍼 함수
export function isSuccessResponse<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): data is z.infer<T> & { success: true } {
  const result = schema.safeParse(data)
  return result.success && (result.data as { success: boolean }).success === true
}

// 안전한 API 응답 파싱 함수
export function parseApiResponse<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (!result.success) {
    const errors = result.error.issues
    console.error('API Response validation failed:', errors)
    return {
      success: false,
      error: errors.map((e) => e.message).join(', '),
    }
  }
  return { success: true, data: result.data }
}
