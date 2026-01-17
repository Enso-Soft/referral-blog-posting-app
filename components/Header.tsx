'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { signOut } from '@/lib/auth'
import { LogOut, User, Shield, Settings, Package, Users } from 'lucide-react'

export function Header() {
  const { user, userProfile, loading, isAdmin } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-gray-900">
          Blog Editor
        </Link>

        {!loading && (
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {isAdmin ? (
                    <Shield className="w-4 h-4 text-blue-600" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span>
                    {userProfile?.displayName || user.email}
                    {isAdmin && (
                      <span className="ml-1 text-xs text-blue-600 font-medium">(Admin)</span>
                    )}
                  </span>
                </div>
                <Link
                  href="/products"
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Package className="w-4 h-4" />
                  <span>제품</span>
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin/products"
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    <span>제품 할당</span>
                  </Link>
                )}
                <Link
                  href="/settings"
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>설정</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>로그아웃</span>
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
              >
                로그인
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
