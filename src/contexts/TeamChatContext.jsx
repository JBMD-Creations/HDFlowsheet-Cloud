import { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

const TeamChatContext = createContext();

export const useTeamChat = () => {
  const context = useContext(TeamChatContext);
  if (!context) {
    throw new Error('useTeamChat must be used within a TeamChatProvider');
  }
  return context;
};

export const TeamChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const toggleChatPanel = () => {
    setShowChatPanel(prev => !prev);
    if (!showChatPanel) {
      setUnreadCount(0);
    }
  };

  const openChatPanel = () => {
    setShowChatPanel(true);
    setUnreadCount(0);
  };

  const closeChatPanel = () => {
    setShowChatPanel(false);
  };

  const incrementUnread = () => {
    if (!showChatPanel) {
      setUnreadCount(prev => prev + 1);
    }
  };

  // Get username from auth user
  const username = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous';

  const value = {
    showChatPanel,
    setShowChatPanel,
    toggleChatPanel,
    openChatPanel,
    closeChatPanel,
    unreadCount,
    incrementUnread,
    username,
    isAuthenticated
  };

  return (
    <TeamChatContext.Provider value={value}>
      {children}
    </TeamChatContext.Provider>
  );
};
