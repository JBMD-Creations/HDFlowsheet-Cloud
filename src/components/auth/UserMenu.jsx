import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSupabaseData } from '../../contexts/SupabaseDataContext';
import './UserMenu.css';

const UserMenu = ({ onLoginClick, onSettingsClick }) => {
  const { user, signOut, isAuthenticated } = useAuth();
  const { syncStatus, lastSyncTime, syncAll, isOnline } = useSupabaseData();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
  };

  const handleSync = () => {
    syncAll();
  };

  const handleSettingsClick = () => {
    setIsOpen(false);
    onSettingsClick?.();
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    const now = new Date();
    const diff = now.getTime() - lastSyncTime.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return lastSyncTime.toLocaleTimeString();
  };

  const getSyncStatusDisplay = () => {
    if (!isOnline) return { icon: '○', label: 'Offline', className: 'offline' };
    if (syncStatus === 'syncing') return { icon: '↻', label: 'Syncing', className: 'syncing' };
    if (syncStatus === 'error') return { icon: '!', label: 'Error', className: 'error' };
    if (syncStatus === 'synced') return { icon: '✓', label: 'Synced', className: 'synced' };
    return { icon: '○', label: 'Ready', className: 'ready' };
  };

  if (!isAuthenticated) {
    return (
      <button className="user-menu-login-btn" onClick={onLoginClick}>
        Sign In
      </button>
    );
  }

  const syncStatusInfo = getSyncStatusDisplay();
  const userInitials = user?.email?.charAt(0).toUpperCase() || '?';

  return (
    <div className="user-menu-container" ref={menuRef}>
      <button
        className="user-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="user-menu-avatar">{userInitials}</span>
        <span className={`user-menu-status-dot ${syncStatusInfo.className}`} />
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          {/* User Info */}
          <div className="user-menu-header">
            <div className="user-menu-avatar-large">{userInitials}</div>
            <div className="user-menu-user-info">
              <span className="user-menu-email">{user?.email}</span>
              <span className={`user-menu-sync-status ${syncStatusInfo.className}`}>
                <span className="sync-icon">{syncStatusInfo.icon}</span>
                {syncStatusInfo.label}
              </span>
            </div>
          </div>

          <div className="user-menu-divider" />

          {/* Sync Action */}
          <button className="user-menu-item" onClick={handleSync}>
            <span className="user-menu-item-icon">↻</span>
            <span className="user-menu-item-label">Sync Now</span>
            <span className="user-menu-item-meta">{formatLastSync()}</span>
          </button>

          {/* Settings */}
          <button className="user-menu-item" onClick={handleSettingsClick}>
            <span className="user-menu-item-icon">⚙</span>
            <span className="user-menu-item-label">Settings</span>
          </button>

          <div className="user-menu-divider" />

          {/* Sign Out */}
          <button className="user-menu-item user-menu-item-danger" onClick={handleSignOut}>
            <span className="user-menu-item-icon">↪</span>
            <span className="user-menu-item-label">Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
