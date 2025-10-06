'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Plus, Eye, Heart, MessageCircle } from 'lucide-react'
import { api } from '@/lib/api'

interface Story {
  _id: string
  userId: {
    _id: string
    username: string
    profilePic?: string
  }
  media: string
  mediaType: 'image' | 'video'
  caption?: string
  viewersCount: number
  reactionsCount: number
  repliesCount: number
  createdAt: string
  expiresAt: string
}

interface StoriesByUser {
  user: {
    _id: string
    username: string
    profilePic?: string
  }
  stories: Story[]
}

export function Stories() {
  const [storiesByUser, setStoriesByUser] = useState<StoriesByUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStories()
  }, [])

  const fetchStories = async () => {
    try {
      const response = await api.get('/stories/feed')
      setStoriesByUser(response.data.storiesByUser)
    } catch (error) {
      console.error('Error fetching stories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStoryClick = async (storyId: string) => {
    try {
      await api.post(`/stories/${storyId}/view`)
    } catch (error) {
      console.error('Error viewing story:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-content">
        <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
          {/* Add Story */}
          <div className="flex-shrink-0 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <Plus className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 truncate w-16">
              Your Story
            </p>
          </div>

          {/* User Stories */}
          {Object.values(storiesByUser).map((storyGroup) => (
            <div key={storyGroup.user._id} className="flex-shrink-0 text-center">
              <div
                onClick={() => handleStoryClick(storyGroup.stories[0]._id)}
                className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 p-0.5 cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-sm">
                    {storyGroup.user.username.charAt(0).toUpperCase()}
                  </div>
                </div>
                
                {/* Story Count Indicator */}
                {storyGroup.stories.length > 1 && (
                  <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full px-1 py-0.5">
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {storyGroup.stories.length}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 truncate w-16 mt-2">
                {storyGroup.user.username}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
