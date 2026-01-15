import { supabase } from '../lib/supabase'
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useCurrentUserImage } from './use-current-user-image'

export type ChatMessage = {
  id: string
  content: string
  createdAt: string
  user: {
    name: string
    image: string | null
  }
}

const EVENT_NAME = 'chat-message'

export const useRealtimeChat = ({
  roomName,
  username,
}: {
  roomName: string
  username: string
}) => {
  const userImage = useCurrentUserImage()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const sendMessage = useCallback(
    (content: string) => {
      if (!channelRef.current || !content.trim()) return

      const message: ChatMessage = {
        id: crypto.randomUUID(),
        content: content.trim(),
        createdAt: new Date().toISOString(),
        user: {
          name: username,
          image: userImage,
        },
      }

      channelRef.current.send({
        type: 'broadcast',
        event: EVENT_NAME,
        payload: message,
      })

      // Add to local messages
      setMessages((prev) => [...prev, message])
    },
    [username, userImage]
  )

  useEffect(() => {
    const channel = supabase.channel(roomName)

    channel
      .on('broadcast', { event: EVENT_NAME }, (data: { payload: ChatMessage }) => {
        // Don't add our own messages (they're already added locally)
        if (data.payload.user.name === username) return
        setMessages((prev) => [...prev, data.payload])
      })
      .subscribe((status) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          setIsConnected(true)
          channelRef.current = channel
        } else {
          setIsConnected(false)
          channelRef.current = null
        }
      })

    return () => {
      channel.unsubscribe()
      channelRef.current = null
      setIsConnected(false)
    }
  }, [roomName, username])

  return { messages, sendMessage, isConnected }
}
