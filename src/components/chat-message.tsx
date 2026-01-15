import { cn } from '../lib/utils'
import type { ChatMessage } from '../hooks/use-realtime-chat'
import './chat-message.css'

interface ChatMessageItemProps {
  message: ChatMessage
  isOwnMessage: boolean
  showHeader: boolean
}

export const ChatMessageItem = ({ message, isOwnMessage, showHeader }: ChatMessageItemProps) => {
  const initials = message.user.name
    ?.split(' ')
    ?.map((word) => word[0])
    ?.join('')
    ?.toUpperCase()

  return (
    <div className={cn('chat-message-row', isOwnMessage && 'chat-message-own')}>
      {showHeader && (
        <div className="chat-avatar">
          {message.user.image ? (
            <img src={message.user.image} alt={message.user.name} className="chat-avatar-img" />
          ) : (
            <span className="chat-avatar-fallback">{initials || '?'}</span>
          )}
        </div>
      )}
      {!showHeader && <div className="chat-avatar-spacer" />}
      <div className={cn('chat-message-content', isOwnMessage && 'chat-message-content-own')}>
        {showHeader && (
          <span className="chat-message-username">{message.user.name}</span>
        )}
        <div className={cn('chat-message-bubble', isOwnMessage && 'chat-message-bubble-own')}>
          {message.content}
        </div>
      </div>
    </div>
  )
}
