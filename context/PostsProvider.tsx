'use client'

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    type Query,
    type DocumentData,
    type QueryConstraint,
} from 'firebase/firestore'
import { getFirebaseDb } from '@/lib/firebase'
import { useAuth } from '@/components/AuthProvider'
import type { BlogPost } from '@/lib/firestore'

// Types
type StatusFilter = 'all' | 'draft' | 'published'
type TypeFilter = 'all' | 'general' | 'affiliate'

interface PostsContextType {
    posts: BlogPost[]
    loading: boolean
    error: string | null
    filter: StatusFilter
    setFilter: (filter: StatusFilter) => void
    typeFilter: TypeFilter
    setTypeFilter: (filter: TypeFilter) => void
    scrollPosition: number
    setScrollPosition: (position: number) => void
}

const PostsContext = createContext<PostsContextType | undefined>(undefined)

export function PostsProvider({ children }: { children: ReactNode }) {
    const { user, isAdmin, loading: authLoading } = useAuth()
    // rawPosts: Firestore에서 가져온 원본 데이터
    const [rawPosts, setRawPosts] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Persistent state
    const [filter, setFilter] = useState<StatusFilter>('all')
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
    const [scrollPosition, setScrollPosition] = useState(0)

    // Firestore 구독 (filter만 의존성으로 사용, typeFilter는 클라이언트 사이드 필터링)
    useEffect(() => {
        if (authLoading) return

        if (!user) {
            setRawPosts([])
            setLoading(false)
            setError('로그인이 필요합니다')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const db = getFirebaseDb()
            const postsRef = collection(db, 'blog_posts')
            const constraints: QueryConstraint[] = []

            if (!isAdmin) {
                constraints.push(where('userId', '==', user.uid))
            }

            if (filter !== 'all') {
                constraints.push(where('status', '==', filter))
            }

            constraints.push(orderBy('createdAt', 'desc'))

            const q = query(postsRef, ...constraints) as Query<DocumentData>

            const unsubscribe = onSnapshot(
                q,
                (snapshot) => {
                    const posts = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as BlogPost[]
                    setRawPosts(posts)
                    setLoading(false)
                },
                (err) => {
                    console.error('Firestore subscription error:', err)
                    setError('데이터를 불러오는 중 오류가 발생했습니다')
                    setLoading(false)
                }
            )

            return () => unsubscribe()
        } catch (err) {
            console.error('Failed to setup subscription:', err)
            setError('데이터를 불러오는 중 오류가 발생했습니다')
            setLoading(false)
        }
    }, [user, isAdmin, authLoading, filter]) // typeFilter 제거 - 클라이언트 사이드 필터링

    // Client-side filtering for postType (useMemo로 캐싱)
    const posts = useMemo(() => {
        if (typeFilter === 'all') return rawPosts
        return rawPosts.filter(post => {
            if (typeFilter === 'affiliate') return post.postType === 'affiliate'
            if (typeFilter === 'general') return post.postType === 'general' || !post.postType
            return true
        })
    }, [rawPosts, typeFilter])

    const contextValue = useMemo(
        () => ({
            posts,
            loading,
            error,
            filter,
            setFilter,
            typeFilter,
            setTypeFilter,
            scrollPosition,
            setScrollPosition,
        }),
        [posts, loading, error, filter, typeFilter, scrollPosition]
    )

    return (
        <PostsContext.Provider value={contextValue}>
            {children}
        </PostsContext.Provider>
    )
}

export function usePostsContext() {
    const context = useContext(PostsContext)
    if (context === undefined) {
        throw new Error('usePostsContext must be used within a PostsProvider')
    }
    return context
}
