import { config } from 'dotenv'
import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

config({ path: '.env.local' })

const projectId = process.env.FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
let privateKey = process.env.FIREBASE_PRIVATE_KEY

if (privateKey?.includes('\\n')) {
  privateKey = privateKey.replace(/\\n/g, '\n')
}

if (!getApps().length) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey } as ServiceAccount),
  })
}

const db = getFirestore()

async function showStructure() {
  console.log('=== Firestore 구조 ===\n')

  const collections = await db.listCollections()

  for (const col of collections) {
    const countSnapshot = await col.count().get()
    const count = countSnapshot.data().count

    console.log(`📁 ${col.id} (${count}개 문서)`)

    const snapshot = await col.limit(1).get()
    if (!snapshot.empty) {
      const doc = snapshot.docs[0]
      const data = doc.data()
      const fields = Object.keys(data)

      console.log(`   필드: ${fields.slice(0, 10).join(', ')}${fields.length > 10 ? '...' : ''}`)

      // 서브컬렉션 확인
      const subCols = await doc.ref.listCollections()
      for (const subCol of subCols) {
        const subCount = await subCol.count().get()
        console.log(`   └─ 📂 ${subCol.id} (${subCount.data().count}개)`)
      }
    }
    console.log('')
  }
}

showStructure()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
