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

    // 비정규화된 productCount 사용 (N+1 쿼리 방지)
    const users = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        assignedProductCount: data.productCount ?? 0,
      }
    })

    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error('GET users error:', error)
    return NextResponse.json(
      { success: false, error: '사용자 목록 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}
