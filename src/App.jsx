import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { PatientProvider } from './contexts/PatientContext';
import { OperationsProvider } from './contexts/OperationsContext';
import { SnippetProvider } from './contexts/SnippetContext';
import { SaveProvider } from './contexts/SaveContext';
import { AuthProvider } from './contexts/AuthContext';
import { SupabaseDataProvider } from './contexts/SupabaseDataContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { TeamChatProvider } from './contexts/TeamChatContext';
import MainLayout from './components/layout/MainLayout';
import PatientCharting from './components/charting/PatientCharting';
import OperationsPage from './components/operations/OperationsPage';
import ReportsPage from './components/reports/ReportsPage';
import AnalyticsPage from './components/analytics/AnalyticsPage';
import AuthModal from './components/auth/AuthModal';
import NotificationPanel from './components/notifications/NotificationPanel';
import TeamChatPanel from './components/team-chat/TeamChatPanel';
import './styles/hdflowsheet.css';

function App() {
  const [activeTab, setActiveTab] = useState('charting');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'charting':
        return <PatientCharting />;
      case 'operations':
        return <OperationsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      default:
        return <PatientCharting />;
    }
  };

  return (
    <AuthProvider>
      <SupabaseDataProvider>
        <ThemeProvider>
          <PatientProvider>
            <NotificationProvider>
              <TeamChatProvider>
                <OperationsProvider>
                  <SnippetProvider>
                    <SaveProvider>
                      <MainLayout
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        onLoginClick={() => setShowAuthModal(true)}
                      >
                        {renderContent()}
                      </MainLayout>
                      <AuthModal
                        isOpen={showAuthModal}
                        onClose={() => setShowAuthModal(false)}
                      />
                      <NotificationPanel />
                      <TeamChatPanel />
                    </SaveProvider>
                  </SnippetProvider>
                </OperationsProvider>
              </TeamChatProvider>
            </NotificationProvider>
          </PatientProvider>
        </ThemeProvider>
      </SupabaseDataProvider>
    </AuthProvider>
  );
}

export default App;
