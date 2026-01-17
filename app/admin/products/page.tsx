'use client'

import { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/AuthGuard'
import { useAuth } from '@/components/AuthProvider'
import { useAuthFetch } from '@/hooks/useAuthFetch'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2,
  AlertCircle,
  Package,
  User,
  Check,
  X,
  ChevronDown,
  ArrowLeft,
  Search,
} from 'lucide-react'

interface Product {
  id: string
  name: string
  affiliateLink: string
  price?: number
  brand?: string
  mall?: string
  images?: string[]
  category?: {
    level1: string
    level2: string
    level3?: string
  }
}

interface UserInfo {
  id: string
  email: string
  displayName?: string
  role: string
  assignedProductCount: number
}

interface Category {
  id: string
  name: string
  productCount: number
}

function AdminProductsPage() {
  const { isAdmin } = useAuth()
  const router = useRouter()
  const { authFetch } = useAuthFetch()

  const [users, setUsers] = useState<UserInfo[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [userProducts, setUserProducts] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Admin 권한 체크
  useEffect(() => {
    if (!isAdmin) {
      router.push('/')
    }
  }, [isAdmin, router])

  // 사용자 목록 로드
  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await authFetch('/api/admin/users')
        const data = await res.json()
        if (data.success) {
          setUsers(data.users)
        }
      } catch (err) {
        console.error('Failed to fetch users:', err)
      }
    }
    fetchUsers()
  }, [authFetch])

  // Naver 제품 목록 로드
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        const url = selectedCategory
          ? `/api/admin/assign-products?category=${encodeURIComponent(selectedCategory)}&limit=100`
          : '/api/admin/assign-products?limit=100'
        const res = await authFetch(url)
        const data = await res.json()
        if (data.success) {
          setProducts(data.products)
          if (data.categories) {
            setCategories(data.categories)
          }
        } else {
          setError(data.error)
        }
      } catch (err) {
        setError('제품 목록을 불러올 수 없습니다')
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [authFetch, selectedCategory])

  // 선택된 사용자의 할당된 제품 로드
  useEffect(() => {
    async function fetchUserProducts() {
      if (!selectedUser) {
        setUserProducts(new Set())
        return
      }
      try {
        // 사용자의 할당된 제품 목록 조회를 위한 별도 API 호출
        const res = await authFetch(`/api/admin/user-products?userId=${selectedUser}`)
        const data = await res.json()
        if (data.success) {
          setUserProducts(new Set(data.productIds))
        }
      } catch (err) {
        console.error('Failed to fetch user products:', err)
      }
    }
    fetchUserProducts()
  }, [authFetch, selectedUser])

  const handleToggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
  }

  const handleSelectAll = () => {
    const filteredIds = filteredProducts.map((p) => p.id)
    const allSelected = filteredIds.every((id) => selectedProducts.has(id))

    if (allSelected) {
      // 전체 해제
      const newSelected = new Set(selectedProducts)
      filteredIds.forEach((id) => newSelected.delete(id))
      setSelectedProducts(newSelected)
    } else {
      // 전체 선택
      const newSelected = new Set(selectedProducts)
      filteredIds.forEach((id) => newSelected.add(id))
      setSelectedProducts(newSelected)
    }
  }

  const handleAssign = async () => {
    if (!selectedUser || selectedProducts.size === 0) return

    setAssigning(true)
    try {
      const res = await authFetch('/api/admin/assign-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser,
          productIds: Array.from(selectedProducts),
        }),
      })
      const data = await res.json()
      if (data.success) {
        alert(`${data.assignedCount}개 제품이 할당되었습니다.`)
        // 할당된 제품 목록 업데이트
        setUserProducts((prev) => {
          const newSet = new Set(prev)
          selectedProducts.forEach((id) => newSet.add(id))
          return newSet
        })
        setSelectedProducts(new Set())
        // 사용자 목록 새로고침
        const usersRes = await authFetch('/api/admin/users')
        const usersData = await usersRes.json()
        if (usersData.success) {
          setUsers(usersData.users)
        }
      } else {
        alert('할당 실패: ' + data.error)
      }
    } catch (err) {
      alert('할당 중 오류가 발생했습니다')
    } finally {
      setAssigning(false)
    }
  }

  const handleUnassign = async () => {
    if (!selectedUser || selectedProducts.size === 0) return

    if (!confirm('선택한 제품의 할당을 해제하시겠습니까?')) return

    setAssigning(true)
    try {
      const res = await authFetch('/api/admin/assign-products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser,
          productIds: Array.from(selectedProducts),
        }),
      })
      const data = await res.json()
      if (data.success) {
        alert(`${data.removedCount}개 제품 할당이 해제되었습니다.`)
        // 할당된 제품 목록 업데이트
        setUserProducts((prev) => {
          const newSet = new Set(prev)
          selectedProducts.forEach((id) => newSet.delete(id))
          return newSet
        })
        setSelectedProducts(new Set())
        // 사용자 목록 새로고침
        const usersRes = await authFetch('/api/admin/users')
        const usersData = await usersRes.json()
        if (usersData.success) {
          setUsers(usersData.users)
        }
      } else {
        alert('할당 해제 실패: ' + data.error)
      }
    } catch (err) {
      alert('할당 해제 중 오류가 발생했습니다')
    } finally {
      setAssigning(false)
    }
  }

  // 검색 필터링
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.mall?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원'
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          돌아가기
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">제품 할당 관리</h1>
        <p className="text-gray-500 mt-1">
          Naver 제휴 제품을 사용자에게 할당합니다
        </p>
      </div>

      {/* User Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          사용자 선택
        </label>
        <div className="relative">
          <select
            value={selectedUser}
            onChange={(e) => {
              setSelectedUser(e.target.value)
              setSelectedProducts(new Set())
            }}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white appearance-none pr-10"
          >
            <option value="">사용자를 선택하세요</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.email} ({user.assignedProductCount}개 할당됨)
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Category Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리
            </label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white appearance-none pr-10"
              >
                <option value="">전체 카테고리</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name} ({cat.productCount})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              검색
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="제품명, 브랜드, 스토어 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {selectedUser && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {filteredProducts.every((p) => selectedProducts.has(p.id))
                ? '전체 해제'
                : '전체 선택'}
            </button>
            <span className="text-sm text-gray-600">
              {selectedProducts.size}개 선택됨
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAssign}
              disabled={selectedProducts.size === 0 || assigning}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {assigning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              할당하기
            </button>
            <button
              onClick={handleUnassign}
              disabled={selectedProducts.size === 0 || assigning}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
              할당 해제
            </button>
          </div>
        </div>
      )}

      {/* Product List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12 text-red-500">
          <AlertCircle className="w-6 h-6 mr-2" />
          <span>{error}</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Package className="w-12 h-12 mb-3" />
          <p>제품이 없습니다</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={filteredProducts.every((p) => selectedProducts.has(p.id))}
                    onChange={handleSelectAll}
                    disabled={!selectedUser}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  제품
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                  카테고리
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                  가격
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  할당됨
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className={`hover:bg-gray-50 cursor-pointer ${
                    selectedProducts.has(product.id) ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => selectedUser && handleToggleProduct(product.id)}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.id)}
                      onChange={() => handleToggleProduct(product.id)}
                      disabled={!selectedUser}
                      className="w-4 h-4 rounded border-gray-300"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt=""
                          className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {product.name}
                        </p>
                        {product.brand && (
                          <p className="text-xs text-gray-500">{product.brand}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm text-gray-600">
                      {product.category?.level2}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <span className="text-sm font-medium text-gray-900">
                      {product.price ? formatPrice(product.price) : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {userProducts.has(product.id) ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full">
                        <Check className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-400 rounded-full">
                        <X className="w-4 h-4" />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function AdminProductsWrapper() {
  return (
    <AuthGuard>
      <AdminProductsPage />
    </AuthGuard>
  )
}
