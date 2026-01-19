import { z } from 'zod'

// Firestore Timestamp 스키마 (런타임에서 다양한 형태로 올 수 있음)
export const TimestampSchema = z.union([
  // Firebase Admin SDK 형식
  z.object({
    _seconds: z.number(),
    _nanoseconds: z.number(),
  }),
  // Firestore 클라이언트 SDK 형식
  z.object({
    seconds: z.number(),
    nanoseconds: z.number(),
  }),
  // Date 객체
  z.date(),
  // toDate 메서드를 가진 Timestamp 객체 (any로 처리)
  z.custom<{ toDate: () => Date }>((val) => {
    return val !== null && typeof val === 'object' && 'toDate' in val && typeof val.toDate === 'function'
  }),
])

// Product 스키마
export const ProductSchema = z.object({
  name: z.string(),
  affiliateLink: z.string().url(),
})

export type Product = z.infer<typeof ProductSchema>

// BlogPost 스키마
export const BlogPostSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  userEmail: z.string().email().optional(),
  title: z.string(),
  content: z.string(),
  keywords: z.array(z.string()),
  products: z.array(ProductSchema).optional(),
  publishedUrl: z.string().url().optional(),
  postType: z.enum(['general', 'affiliate']).optional(),
  status: z.enum(['draft', 'published']),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  metadata: z.object({
    originalPath: z.string().optional(),
    wordCount: z.number(),
  }),
})

export type BlogPost = z.infer<typeof BlogPostSchema>

// 생성 요청용 스키마 (id, timestamps 제외)
export const CreatePostSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다'),
  content: z.string(),
  keywords: z.array(z.string()).default([]),
  products: z.array(ProductSchema).optional(),
  postType: z.enum(['general', 'affiliate']).default('general'),
  status: z.enum(['draft', 'published']).default('draft'),
  metadata: z.object({
    originalPath: z.string().optional(),
    wordCount: z.number(),
  }).optional(),
})

export type CreatePostInput = z.infer<typeof CreatePostSchema>

// 수정 요청용 스키마 (부분 업데이트)
export const UpdatePostSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  products: z.array(ProductSchema).optional(),
  publishedUrl: z.string().url().optional(),
  postType: z.enum(['general', 'affiliate']).optional(),
  status: z.enum(['draft', 'published']).optional(),
  metadata: z.object({
    originalPath: z.string().optional(),
    wordCount: z.number(),
  }).optional(),
})

export type UpdatePostInput = z.infer<typeof UpdatePostSchema>
