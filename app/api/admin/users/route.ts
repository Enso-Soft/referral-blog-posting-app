import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase-admin'
import { getAuthFromRequest } from '@/lib/auth-admin'

// GET: 사용자 목록 조회 (Admin 전용)
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth || !auth.isAdmin) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다' },
        { status: 403 }
      )
    }

    const db = getDb()
    const snapshot = await db.collection('users').orderBy('email').get()

    const users = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data()
        // 할당된 제품 수 조회
        const productsSnapshot = await db
          .collection('users')
          .doc(doc.id)
          .collection('products')
          .count()
          .get()

        return {
          id: doc.id,
          email: data.email,
          displayName: data.displayName,
          role: data.role,
          assignedProductCount: productsSnapshot.data().count,
        }
      })
    )

    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error('GET users error:', error)
    return NextResponse.json(
      { success: false, error: '사용자 목록 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}
