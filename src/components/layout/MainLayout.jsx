import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useTeamChat } from '../../contexts/TeamChatContext';
import SettingsModal from '../settings/SettingsModal';
import UserMenu from '../auth/UserMenu';
import './MainLayout.css';

const MainLayout = ({ activeTab, onTabChange, onLoginClick, children }) => {
  const { theme } = useTheme();
  const { toggleChatPanel, unreadCount } = useTeamChat();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="hd-app" data-theme={theme}>
      {/* Top Navigation */}
      <nav className="main-nav">
        {/* Left: Page Tabs */}
        <div className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'charting' ? 'active' : ''}`}
            onClick={() => onTabChange('charting')}
          >
            Charting
          </button>
          <button
            className={`nav-tab ${activeTab === 'operations' ? 'active' : ''}`}
            onClick={() => onTabChange('operations')}
          >
            Operations
          </button>
          <button
            className={`nav-tab ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => onTabChange('reports')}
          >
            Reports
          </button>
          <button
            className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => onTabChange('analytics')}
          >
            Analytics
          </button>
        </div>

        {/* Right: Actions */}
        <div className="nav-actions">
          <button
            className="nav-chat-btn"
            onClick={toggleChatPanel}
            aria-label="Open team chat"
          >
            💬 Chat
            {unreadCount > 0 && (
              <span className="nav-chat-badge">{unreadCount}</span>
            )}
          </button>
          <UserMenu
            onLoginClick={onLoginClick}
            onSettingsClick={() => setIsSettingsOpen(true)}
          />
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default MainLayout;
