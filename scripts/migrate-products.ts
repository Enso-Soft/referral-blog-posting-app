/**
 * 제품 데이터 마이그레이션 스크립트
 * users/{userId}/products -> products (최상위 컬렉션)
 *
 * 실행: npx ts-node scripts/migrate-products.ts
 */

import { config } from 'dotenv'
import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// .env.local 로드
config({ path: '.env.local' })

function initFirebase() {
  if (getApps().length > 0) {
    return getFirestore()
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  let privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase 환경 변수가 설정되지 않았습니다.')
  }

  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n')
  }

  const serviceAccount: ServiceAccount = {
    projectId,
    clientEmail,
    privateKey,
  }

  initializeApp({
    credential: cert(serviceAccount),
  })

  return getFirestore()
}

async function migrateProducts() {
  const db = initFirebase()

  console.log('=== 제품 데이터 마이그레이션 시작 ===\n')

  // 1. 모든 users 조회
  const usersSnapshot = await db.collection('users').get()
  console.log(`총 ${usersSnapshot.size}명의 사용자 발견\n`)

  let totalMigrated = 0
  let totalSkipped = 0

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id
    console.log(`\n--- 사용자: ${userId} ---`)

    // 2. 해당 사용자의 products 서브컬렉션 조회
    const productsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('products')
      .get()

    if (productsSnapshot.empty) {
      console.log('  할당된 제품 없음')
      continue
    }

    console.log(`  ${productsSnapshot.size}개 제품 발견`)

    for (const productDoc of productsSnapshot.docs) {
      const productData = productDoc.data()
      const originalProductId = productData.originalId || productDoc.id

      // 복합 ID: userId_originalProductId
      const newProductId = `${userId}_${originalProductId}`

      // 3. 이미 마이그레이션되었는지 확인
      const existingDoc = await db.collection('products').doc(newProductId).get()
      if (existingDoc.exists) {
        console.log(`  [SKIP] ${productDoc.id} - 이미 존재함`)
        totalSkipped++
        continue
      }

      // 4. 최상위 products 컬렉션에 저장
      const { originalId, ...restData } = productData
      await db.collection('products').doc(newProductId).set({
        ...restData,
        userId,
        originalProductId,
      })

      console.log(`  [OK] ${productDoc.id} -> ${newProductId}`)
      totalMigrated++
    }
  }

  console.log('\n=== 마이그레이션 완료 ===')
  console.log(`마이그레이션됨: ${totalMigrated}개`)
  console.log(`건너뜀 (이미 존재): ${totalSkipped}개`)
}

async function deleteOldProducts() {
  const db = initFirebase()

  console.log('\n=== 기존 서브컬렉션 데이터 삭제 시작 ===\n')

  const usersSnapshot = await db.collection('users').get()
  let totalDeleted = 0

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id
    const productsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('products')
      .get()

    if (productsSnapshot.empty) continue

    const batch = db.batch()
    productsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    await batch.commit()
    console.log(`사용자 ${userId}: ${productsSnapshot.size}개 삭제`)
    totalDeleted += productsSnapshot.size
  }

  console.log(`\n총 ${totalDeleted}개 삭제 완료`)
}

// 실행
const args = process.argv.slice(2)

if (args.includes('--delete')) {
  deleteOldProducts()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('삭제 오류:', err)
      process.exit(1)
    })
} else {
  migrateProducts()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('마이그레이션 오류:', err)
      process.exit(1)
    })
}
