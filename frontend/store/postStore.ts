import { create } from 'zustand'

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

interface PostState {
  posts: Post[]
  isLoading: boolean
  hasMore: boolean
  page: number
  setPosts: (posts: Post[]) => void
  addPost: (post: Post) => void
  updatePost: (postId: string, updates: Partial<Post>) => void
  removePost: (postId: string) => void
  setLoading: (loading: boolean) => void
  setHasMore: (hasMore: boolean) => void
  setPage: (page: number) => void
  incrementPage: () => void
  reset: () => void
}

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  isLoading: false,
  hasMore: true,
  page: 1,
  
  setPosts: (posts) => set({ posts }),
  
  addPost: (post) => {
    const { posts } = get()
    set({ posts: [post, ...posts] })
  },
  
  updatePost: (postId, updates) => {
    const { posts } = get()
    set({
      posts: posts.map(post =>
        post._id === postId ? { ...post, ...updates } : post
      ),
    })
  },
  
  removePost: (postId) => {
    const { posts } = get()
    set({ posts: posts.filter(post => post._id !== postId) })
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setHasMore: (hasMore) => set({ hasMore }),
  
  setPage: (page) => set({ page }),
  
  incrementPage: () => {
    const { page } = get()
    set({ page: page + 1 })
  },
  
  reset: () => set({
    posts: [],
    isLoading: false,
    hasMore: true,
    page: 1,
  }),
}))
