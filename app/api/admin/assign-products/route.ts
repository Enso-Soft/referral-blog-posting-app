import { NextRequest, NextResponse } from 'next/server'
import { Timestamp, FieldValue } from 'firebase-admin/firestore'
import { getDb } from '@/lib/firebase-admin'
import { getAuthFromRequest } from '@/lib/auth-admin'

// GET: naver 컬렉션의 제품 목록 조회 (Admin 전용)
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
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const lastId = searchParams.get('lastId')

    const db = getDb()
    let query: FirebaseFirestore.Query = db
      .collection('naver')
      .doc('_meta')
      .collection('products')

    if (category) {
      query = query.where('category.level1', '==', category)
    }

    query = query.orderBy('name').limit(limit)

    if (lastId) {
      const lastDoc = await db
        .collection('naver')
        .doc('_meta')
        .collection('products')
        .doc(lastId)
        .get()
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc)
      }
    }

    const snapshot = await query.get()
    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    // 카테고리 목록도 함께 반환
    const categoriesSnapshot = await db
      .collection('naver')
      .doc('_meta')
      .collection('categories')
      .get()
    const categories = categoriesSnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
      productCount: doc.data().productCount,
    }))

    return NextResponse.json({
      success: true,
      products,
      categories,
      hasMore: products.length === limit,
    })
  } catch (error) {
    console.error('GET naver products error:', error)
    return NextResponse.json(
      { success: false, error: '제품 목록 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}

// POST: 제품을 특정 사용자에게 할당 (최상위 products 컬렉션에 저장)
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth || !auth.isAdmin) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, productIds } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId가 필요합니다' },
        { status: 400 }
      )
    }

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'productIds 배열이 필요합니다' },
        { status: 400 }
      )
    }

    const db = getDb()

    // 대상 사용자 확인
    const userDoc = await db.collection('users').doc(userId).get()
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // naver 제품 조회
    const naverProductsRef = db.collection('naver').doc('_meta').collection('products')
    const productsRef = db.collection('products')
    const assignedProducts: string[] = []

    for (const productId of productIds) {
      const productDoc = await naverProductsRef.doc(productId).get()
      if (!productDoc.exists) continue

      const productData = productDoc.data()
      if (!productData) continue

      // 복합 ID: userId_originalProductId (중복 할당 방지)
      const assignedProductId = `${userId}_${productId}`

      // 이미 할당되어 있는지 확인
      const existingDoc = await productsRef.doc(assignedProductId).get()
      if (existingDoc.exists) continue

      // 최상위 products 컬렉션에 저장
      await productsRef.doc(assignedProductId).set({
        ...productData,
        userId,
        originalProductId: productId,
        assignedAt: Timestamp.now(),
        assignedBy: auth.userId,
      })

      assignedProducts.push(assignedProductId)
    }

    // 할당된 제품 수만큼 users 문서의 productCount 증가 (비정규화)
    if (assignedProducts.length > 0) {
      await db.collection('users').doc(userId).update({
        productCount: FieldValue.increment(assignedProducts.length),
      })
    }

    return NextResponse.json({
      success: true,
      assignedCount: assignedProducts.length,
      assignedProducts,
    })
  } catch (error) {
    console.error('POST assign products error:', error)
    return NextResponse.json(
      { success: false, error: '제품 할당에 실패했습니다' },
      { status: 500 }
    )
  }
}

// DELETE: 사용자에게서 제품 할당 해제
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth || !auth.isAdmin) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, productIds } = body

    if (!userId || !productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        { success: false, error: 'userId와 productIds가 필요합니다' },
        { status: 400 }
      )
    }

    const db = getDb()
    const batch = db.batch()

    for (const productId of productIds) {
      // 복합 ID: userId_originalProductId
      const assignedProductId = `${userId}_${productId}`
      const ref = db.collection('products').doc(assignedProductId)
      batch.delete(ref)
    }

    await batch.commit()

    // 해제된 제품 수만큼 users 문서의 productCount 감소 (비정규화)
    if (productIds.length > 0) {
      await db.collection('users').doc(userId).update({
        productCount: FieldValue.increment(-productIds.length),
      })
    }

    return NextResponse.json({
      success: true,
      removedCount: productIds.length,
    })
  } catch (error) {
    console.error('DELETE assign products error:', error)
    return NextResponse.json(
      { success: false, error: '제품 할당 해제에 실패했습니다' },
      { status: 500 }
    )
  }
}
