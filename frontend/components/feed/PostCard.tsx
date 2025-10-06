'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { 
  Heart, 
  MessageCircle, 
  Share, 
  MoreHorizontal, 
  Bookmark,
  Send
} from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface Post {
  _id: string
  userId: {
    _id: string
    username: string
    profilePic?: string
    isVerified: boolean
  }
  caption: string
  media: string[]
  mediaType: 'image' | 'video' | 'carousel'
  likes: string[]
  likesCount: number
  comments: Array<{
    _id: string
    userId: {
      _id: string
      username: string
      profilePic?: string
    }
    text: string
    createdAt: string
  }>
  commentsCount: number
  shares: Array<{
    userId: string
    createdAt: string
  }>
  sharesCount: number
  hashtags: string[]
  mentions: string[]
  createdAt: string
  updatedAt: string
}

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likesCount)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')

  const handleLike = async () => {
    try {
      await api.post(`/posts/${post._id}/like`)
      setIsLiked(!isLiked)
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1)
    } catch (error) {
      toast.error('Failed to like post')
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      await api.post(`/posts/${post._id}/comment`, { text: newComment })
      setNewComment('')
      toast.success('Comment added!')
    } catch (error) {
      toast.error('Failed to add comment')
    }
  }

  const handleShare = async () => {
    try {
      await api.post(`/posts/${post._id}/share`)
      toast.success('Post shared!')
    } catch (error) {
      toast.error('Failed to share post')
    }
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
            {post.userId.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {post.userId.username}
              </h3>
              {post.userId.isVerified && (
                <span className="text-blue-500 text-sm">✓</span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-6 pb-4">
          <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
            {post.caption}
          </p>
        </div>
      )}

      {/* Media */}
      {post.media.length > 0 && (
        <div className="px-6 pb-4">
          {post.mediaType === 'carousel' ? (
            <div className="grid grid-cols-2 gap-2">
              {post.media.slice(0, 4).map((media, index) => (
                <div key={index} className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <img
                    src={media}
                    alt={`Post media ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {post.media.length > 4 && (
                <div className="aspect-square bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                  <span className="text-gray-600 dark:text-gray-300 font-semibold">
                    +{post.media.length - 4} more
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              {post.mediaType === 'video' ? (
                <video
                  src={post.media[0]}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={post.media[0]}
                  alt="Post media"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-600 dark:text-gray-300 hover:text-red-500'
              }`}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{likesCount}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{post.commentsCount}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-green-500 transition-colors"
            >
              <Share className="h-5 w-5" />
              <span className="text-sm font-medium">{post.sharesCount}</span>
            </button>
          </div>

          <button className="text-gray-600 dark:text-gray-300 hover:text-yellow-500 transition-colors">
            <Bookmark className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="px-6 pb-4 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-3 mt-4">
            {post.comments.map((comment) => (
              <div key={comment._id} className="flex space-x-3">
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-semibold">
                  {comment.userId.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {comment.userId.username}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {comment.text}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Add Comment */}
          <form onSubmit={handleComment} className="flex space-x-3 mt-4">
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-semibold">
              U
            </div>
            <div className="flex-1 flex space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
