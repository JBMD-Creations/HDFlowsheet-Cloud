import { useCallback, useRef } from 'react'

export const useChatScroll = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [])

  return { containerRef, scrollToBottom }
}
