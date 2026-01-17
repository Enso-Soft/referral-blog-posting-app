import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase-admin'
import { getAuthFromRequest } from '@/lib/auth-admin'

// GET: 특정 사용자에게 할당된 제품 ID 목록 조회 (Admin 전용)
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth || !auth.isAdmin) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId가 필요합니다' },
        { status: 400 }
      )
    }

    const db = getDb()
    // 최상위 products 컬렉션에서 userId로 필터링
    const snapshot = await db
      .collection('products')
      .where('userId', '==', userId)
      .select('originalProductId')
      .get()

    // originalProductId 목록 반환 (naver 제품 ID)
    const productIds = snapshot.docs.map((doc) => doc.data().originalProductId)

    return NextResponse.json({ success: true, productIds })
  } catch (error) {
    console.error('GET user products error:', error)
    return NextResponse.json(
      { success: false, error: '제품 목록 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}
