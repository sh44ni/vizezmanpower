'use client'

import { useLanguage } from '@/lib/language'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export function LogoutButton() {
  const { t } = useLanguage()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch {
      toast.error('Logout failed')
    }
  }

  return (
    <button className="logout-btn" onClick={handleLogout} id="logout-btn">
      {t('admin_sign_out')}
    </button>
  )
}
