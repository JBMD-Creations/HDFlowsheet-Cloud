import { useNotifications } from '../../contexts/NotificationContext';
import './NotificationPanel.css';

const NotificationPanel = () => {
  const {
    alerts,
    summary,
    SEVERITY,
    showNotificationPanel,
    setShowNotificationPanel,
    dismissAlert,
    dismissAllAlerts
  } = useNotifications();

  if (!showNotificationPanel) return null;

  const getSeverityClass = (severity) => {
    switch (severity) {
      case SEVERITY.CRITICAL: return 'critical';
      case SEVERITY.WARNING: return 'warning';
      case SEVERITY.INFO: return 'info';
      default: return '';
    }
  };

  return (
    <div className="notification-overlay" onClick={() => setShowNotificationPanel(false)}>
      <div className="notification-panel" onClick={e => e.stopPropagation()}>
        <div className="notification-header">
          <div className="notification-header-left">
            <h2>Alerts & Notifications</h2>
            <div className="notification-summary">
              {summary.critical > 0 && (
                <span className="summary-badge critical">{summary.critical} Critical</span>
              )}
              {summary.warning > 0 && (
                <span className="summary-badge warning">{summary.warning} Warning</span>
              )}
              {summary.info > 0 && (
                <span className="summary-badge info">{summary.info} Info</span>
              )}
            </div>
          </div>
          <div className="notification-header-right">
            {alerts.length > 0 && (
              <button className="dismiss-all-btn" onClick={dismissAllAlerts}>
                Dismiss All
              </button>
            )}
            <button className="close-btn" onClick={() => setShowNotificationPanel(false)}>
              ×
            </button>
          </div>
        </div>

        <div className="notification-body">
          {alerts.length === 0 ? (
            <div className="no-alerts">
              <span className="no-alerts-icon">✅</span>
              <h3>All Clear!</h3>
              <p>No active alerts for the current shift</p>
            </div>
          ) : (
            <div className="alerts-list">
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`alert-item ${getSeverityClass(alert.severity)}`}
                >
                  <div className="alert-icon">{alert.icon}</div>
                  <div className="alert-content">
                    <div className="alert-header">
                      <span className="alert-title">{alert.title}</span>
                      {alert.chairInfo && (
                        <span className="alert-chair">{alert.chairInfo}</span>
                      )}
                    </div>
                    <p className="alert-message">{alert.message}</p>
                    {alert.details && (
                      <p className="alert-details">{alert.details}</p>
                    )}
                  </div>
                  <button
                    className="alert-dismiss"
                    onClick={() => dismissAlert(alert.id)}
                    title="Dismiss"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="notification-footer">
          <p>Alerts auto-refresh as patient data changes</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
