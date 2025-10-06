'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Feed } from '@/components/feed/Feed'
import { Stories } from '@/components/stories/Stories'
import { useState } from 'react'

export default function Dashboard() {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('home')

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            <Stories />
            <Feed />
          </div>
        )
      case 'explore':
        return <div>Explore Page - Coming Soon</div>
      case 'messages':
        return <div>Messages Page - Coming Soon</div>
      case 'profile':
        return <div>Profile Page - Coming Soon</div>
      default:
        return (
          <div className="space-y-6">
            <Stories />
            <Feed />
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Header />
          
          <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  )
}
