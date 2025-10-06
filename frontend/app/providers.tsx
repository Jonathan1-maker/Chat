'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useSocketStore } from '@/store/socketStore'
import { io } from 'socket.io-client'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const { user, token } = useAuthStore()
  const { setSocket, setConnected } = useSocketStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (user && token) {
      const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
        auth: {
          token,
        },
        autoConnect: true,
      })

      socket.on('connect', () => {
        console.log('Connected to server')
        setConnected(true)
        socket.emit('join-user', user._id)
      })

      socket.on('disconnect', () => {
        console.log('Disconnected from server')
        setConnected(false)
      })

      socket.on('connect_error', (error) => {
        console.error('Connection error:', error)
        setConnected(false)
      })

      setSocket(socket)

      return () => {
        socket.disconnect()
        setSocket(null)
        setConnected(false)
      }
    }
  }, [user, token, setSocket, setConnected])

  if (!mounted) {
    return null
  }

  return <>{children}</>
}
