import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore'
import { getFirebaseDb } from './firebase'

export interface Product {
  name: string
  affiliateLink: string
}

export interface BlogPost {
  id?: string
  userId: string           // 작성자 UID
  userEmail?: string       // 작성자 이메일 (표시용)
  title: string
  content: string
  keywords: string[]
  products?: Product[]     // 제품 목록
  status: 'draft' | 'published'
  platform: 'tistory' | 'naver' | 'both'
  createdAt: Timestamp
  updatedAt: Timestamp
  metadata: {
    originalPath?: string
    wordCount: number
  }
}

const COLLECTION_NAME = 'blog_posts'

// Get all posts
export async function getPosts(status?: 'draft' | 'published'): Promise<BlogPost[]> {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')]

  if (status) {
    constraints.unshift(where('status', '==', status))
  }

  const q = query(collection(getFirebaseDb(), COLLECTION_NAME), ...constraints)
  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as BlogPost[]
}

// Get single post
export async function getPost(id: string): Promise<BlogPost | null> {
  const docRef = doc(getFirebaseDb(), COLLECTION_NAME, id)
  const snapshot = await getDoc(docRef)

  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as BlogPost
}

// Create post
export async function createPost(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = Timestamp.now()
  const docRef = await addDoc(collection(getFirebaseDb(), COLLECTION_NAME), {
    ...post,
    createdAt: now,
    updatedAt: now,
  })
  return docRef.id
}

// Update post
export async function updatePost(id: string, data: Partial<BlogPost>): Promise<void> {
  const docRef = doc(getFirebaseDb(), COLLECTION_NAME, id)
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

// Delete post
export async function deletePost(id: string): Promise<void> {
  const docRef = doc(getFirebaseDb(), COLLECTION_NAME, id)
  await deleteDoc(docRef)
}

// Subscribe to posts (real-time)
export function subscribeToPosts(
  callback: (posts: BlogPost[]) => void,
  status?: 'draft' | 'published'
): () => void {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')]

  if (status) {
    constraints.unshift(where('status', '==', status))
  }

  const q = query(collection(getFirebaseDb(), COLLECTION_NAME), ...constraints)

  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as BlogPost[]
    callback(posts)
  })
}

// Subscribe to single post
export function subscribeToPost(
  id: string,
  callback: (post: BlogPost | null) => void
): () => void {
  const docRef = doc(getFirebaseDb(), COLLECTION_NAME, id)

  return onSnapshot(docRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null)
      return
    }

    callback({
      id: snapshot.id,
      ...snapshot.data(),
    } as BlogPost)
  })
}

// Utility: Extract excerpt from HTML
export function extractExcerpt(html: string, maxLength: number = 200): string {
  const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}

// Utility: Count words in HTML
export function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  return text.length
}

// Utility: Extract first image as thumbnail
export function extractThumbnail(html: string): string {
  const match = html.match(/<img[^>]+src="([^"]+)"/)
  return match ? match[1] : ''
}
