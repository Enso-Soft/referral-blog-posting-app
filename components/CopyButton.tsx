'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Copy, Check } from 'lucide-react'

interface CopyButtonProps {
  content: string
  className?: string
}

export function CopyButton({ content, className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      // 이전 타이머 정리
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [content])

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
        copied
          ? 'bg-green-500 text-white'
          : 'bg-gray-900 text-white hover:bg-gray-800'
      } ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          복사됨!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          HTML 복사
        </>
      )}
    </button>
  )
}
