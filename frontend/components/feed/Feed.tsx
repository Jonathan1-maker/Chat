'use client'

import { useState, useEffect } from 'react'
import { usePostStore } from '@/store/postStore'
import { api } from '@/lib/api'
import { PostCard } from './PostCard'
import { CreatePostModal } from './CreatePostModal'
import { Plus } from 'lucide-react'

export function Feed() {
  const { posts, isLoading, hasMore, page, setPosts, addPost, setLoading, setHasMore, incrementPage } = usePostStore()
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/posts/feed?page=${page}&limit=10`)
      
      if (page === 1) {
        setPosts(response.data.posts)
      } else {
        setPosts([...posts, ...response.data.posts])
      }
      
      setHasMore(response.data.posts.length === 10)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (hasMore && !isLoading) {
      incrementPage()
      fetchPosts()
    }
  }

  const handlePostCreated = (newPost: any) => {
    addPost(newPost)
    setShowCreateModal(false)
  }

  return (
    <div className="space-y-6">
      {/* Create Post Button */}
      <div className="card">
        <div className="card-content">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center space-x-3 p-4 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <Plus className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <span className="text-left">What's on your mind?</span>
          </button>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="btn btn-outline btn-md"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onPostCreated={handlePostCreated}
        />
      )}
    </div>
  )
}
