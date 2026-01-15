import { useTeamChat } from '../../contexts/TeamChatContext';
import { RealtimeChat } from '../realtime-chat';
import './TeamChatPanel.css';

const CHAT_ROOM = 'team:general:chat';

const TeamChatPanel = () => {
  const { showChatPanel, closeChatPanel, username, isAuthenticated } = useTeamChat();

  if (!showChatPanel) return null;

  return (
    <div className="team-chat-overlay" onClick={closeChatPanel}>
      <div className="team-chat-panel" onClick={e => e.stopPropagation()}>
        <div className="team-chat-header">
          <div className="team-chat-header-left">
            <h2>Team Chat</h2>
            <span className="team-chat-room-name">General</span>
          </div>
          <button className="team-chat-close-btn" onClick={closeChatPanel}>
            x
          </button>
        </div>

        <div className="team-chat-body">
          {isAuthenticated ? (
            <RealtimeChat
              roomName={CHAT_ROOM}
              username={username}
            />
          ) : (
            <div className="team-chat-login-prompt">
              <span className="team-chat-icon">💬</span>
              <h3>Sign in to Chat</h3>
              <p>You need to be signed in to participate in team chat</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamChatPanel;
