import { useMemo } from 'react';
import { usePatients } from '../../contexts/PatientContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import './AnalyticsPage.css';

const AnalyticsPage = () => {
  const { patients, getFilteredPatients, activeShift } = usePatients();
  const { technicians } = useTheme();
  const { summary: alertSummary } = useNotifications();

  const filteredPatients = getFilteredPatients();

  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    // QA Completion Stats
    const qaStats = {
      preCheck: { complete: 0, total: 0 },
      thirtyMin: { complete: 0, total: 0 },
      meds: { complete: 0, total: 0 },
      abxIdpn: { complete: 0, total: 0 },
      statLabs: { complete: 0, total: 0 },
      labsPrep: { complete: 0, total: 0 },
      whiteboard: { complete: 0, total: 0 },
      ettSigned: { complete: 0, total: 0 },
      chartClosed: { complete: 0, total: 0 }
    };

    // Weight Stats
    const weights = {
      totalWithWeight: 0,
      deviations: [],
      averageDeviation: 0,
      maxDeviation: 0
    };

    // Technician Stats
    const techStats = {};
    technicians.forEach(tech => {
      techStats[tech] = { patients: 0, completed: 0, pending: 0 };
    });
    techStats['Unassigned'] = { patients: 0, completed: 0, pending: 0 };

    // Treatment Time Stats
    const treatmentTimes = {
      started: 0,
      notStarted: 0,
      completed: 0,
      averageDuration: 0,
      durations: []
    };

    // Todo Stats
    const todoStats = {
      totalTodos: 0,
      completedTodos: 0,
      pendingTodos: 0,
      patientsWithTodos: 0
    };

    // EOSR Issue Stats
    const issueStats = {
      covid: 0,
      earlyTermination: 0,
      missedTreatment: 0,
      hospitalized: 0,
      sentOut: 0,
      statLabs: 0
    };

    filteredPatients.forEach(patient => {
      const qa = patient.qa || {};

      // QA Stats
      Object.keys(qaStats).forEach(key => {
        qaStats[key].total++;
        if (qa[key]) qaStats[key].complete++;
      });

      // Weight Stats
      if (patient.preWeight && patient.dryWeight) {
        weights.totalWithWeight++;
        const deviation = Math.abs(patient.preWeight - patient.dryWeight);
        weights.deviations.push(deviation);
        if (deviation > weights.maxDeviation) weights.maxDeviation = deviation;
      }

      // Tech Stats
      const tech = patient.tech || 'Unassigned';
      if (!techStats[tech]) {
        techStats[tech] = { patients: 0, completed: 0, pending: 0 };
      }
      techStats[tech].patients++;
      if (qa.chartClosed) {
        techStats[tech].completed++;
      } else {
        techStats[tech].pending++;
      }

      // Treatment Time Stats
      if (patient.startTime) {
        treatmentTimes.started++;
        if (patient.endTime) {
          treatmentTimes.completed++;
          // Calculate duration
          const start = new Date(`1970-01-01T${patient.startTime}`);
          const end = new Date(`1970-01-01T${patient.endTime}`);
          const duration = (end - start) / (1000 * 60); // minutes
          if (duration > 0) treatmentTimes.durations.push(duration);
        }
      } else {
        treatmentTimes.notStarted++;
      }

      // Todo Stats
      const todos = patient.miscTodos || [];
      if (todos.length > 0) {
        todoStats.patientsWithTodos++;
        todoStats.totalTodos += todos.length;
        todoStats.completedTodos += todos.filter(t => t.completed).length;
        todoStats.pendingTodos += todos.filter(t => !t.completed).length;
      }

      // Issue Stats
      const eosr = patient.eosr || {};
      if (eosr.covid) issueStats.covid++;
      if (eosr.earlyTermination?.is) issueStats.earlyTermination++;
      if (patient.missedTx?.isMissed) issueStats.missedTreatment++;
      if (patient.hospitalized?.isHosp) issueStats.hospitalized++;
      if (eosr.sentOut?.is) issueStats.sentOut++;
      if (qa.statLabs || eosr.statLabs?.length > 0) issueStats.statLabs++;
    });

    // Calculate averages
    if (weights.deviations.length > 0) {
      weights.averageDeviation = weights.deviations.reduce((a, b) => a + b, 0) / weights.deviations.length;
    }
    if (treatmentTimes.durations.length > 0) {
      treatmentTimes.averageDuration = treatmentTimes.durations.reduce((a, b) => a + b, 0) / treatmentTimes.durations.length;
    }

    return {
      qaStats,
      weights,
      techStats,
      treatmentTimes,
      todoStats,
      issueStats,
      totalPatients: filteredPatients.length,
      chartsCompleted: qaStats.chartClosed.complete,
      chartsPending: qaStats.chartClosed.total - qaStats.chartClosed.complete
    };
  }, [filteredPatients, technicians]);

  // Calculate QA completion percentage
  const getQAPercentage = (stat) => {
    if (stat.total === 0) return 0;
    return Math.round((stat.complete / stat.total) * 100);
  };

  // Format duration
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const qaLabels = {
    preCheck: 'Pre-Check',
    thirtyMin: '30 Min',
    meds: 'Meds',
    abxIdpn: 'Abx/IDPN',
    statLabs: 'STAT Labs',
    labsPrep: 'Labs Prep',
    whiteboard: 'Whiteboard',
    ettSigned: 'ETT Signed',
    chartClosed: 'Chart Closed'
  };

  return (
    <div className="analytics-page active">
      <div className="analytics-header">
        <div className="analytics-header-content">
          <h1 className="analytics-title">Analytics Dashboard</h1>
          <p className="analytics-subtitle">
            {activeShift} Shift | {analytics.totalPatients} Patients |
            {analytics.chartsCompleted} Completed | {analytics.chartsPending} Pending
          </p>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Overview Cards */}
        <div className="analytics-section overview-section">
          <h2 className="section-title">Shift Overview</h2>
          <div className="overview-cards">
            <div className="overview-card">
              <span className="overview-icon">👥</span>
              <div className="overview-data">
                <span className="overview-value">{analytics.totalPatients}</span>
                <span className="overview-label">Total Patients</span>
              </div>
            </div>
            <div className="overview-card success">
              <span className="overview-icon">✅</span>
              <div className="overview-data">
                <span className="overview-value">{analytics.chartsCompleted}</span>
                <span className="overview-label">Charts Closed</span>
              </div>
            </div>
            <div className="overview-card warning">
              <span className="overview-icon">⏳</span>
              <div className="overview-data">
                <span className="overview-value">{analytics.chartsPending}</span>
                <span className="overview-label">In Progress</span>
              </div>
            </div>
            <div className="overview-card danger">
              <span className="overview-icon">🔔</span>
              <div className="overview-data">
                <span className="overview-value">{alertSummary.total}</span>
                <span className="overview-label">Active Alerts</span>
              </div>
            </div>
          </div>
        </div>

        {/* QA Completion Rates */}
        <div className="analytics-section qa-section">
          <h2 className="section-title">QA Completion Rates</h2>
          <div className="qa-bars">
            {Object.entries(analytics.qaStats).map(([key, stat]) => (
              <div key={key} className="qa-bar-item">
                <div className="qa-bar-header">
                  <span className="qa-bar-label">{qaLabels[key]}</span>
                  <span className="qa-bar-value">
                    {stat.complete}/{stat.total} ({getQAPercentage(stat)}%)
                  </span>
                </div>
                <div className="qa-bar-track">
                  <div
                    className={`qa-bar-fill ${getQAPercentage(stat) === 100 ? 'complete' : ''}`}
                    style={{ width: `${getQAPercentage(stat)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technician Performance */}
        <div className="analytics-section tech-section">
          <h2 className="section-title">Technician Workload</h2>
          <div className="tech-table">
            <div className="tech-table-header">
              <span>Technician</span>
              <span>Patients</span>
              <span>Completed</span>
              <span>Pending</span>
              <span>Rate</span>
            </div>
            {Object.entries(analytics.techStats)
              .filter(([, stat]) => stat.patients > 0)
              .sort((a, b) => b[1].patients - a[1].patients)
              .map(([tech, stat]) => (
                <div key={tech} className="tech-table-row">
                  <span className="tech-name">{tech}</span>
                  <span className="tech-patients">{stat.patients}</span>
                  <span className="tech-completed">{stat.completed}</span>
                  <span className="tech-pending">{stat.pending}</span>
                  <span className={`tech-rate ${stat.patients > 0 && stat.completed === stat.patients ? 'perfect' : ''}`}>
                    {stat.patients > 0 ? Math.round((stat.completed / stat.patients) * 100) : 0}%
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Weight Statistics */}
        <div className="analytics-section weight-section">
          <h2 className="section-title">Weight Analysis</h2>
          <div className="stat-cards">
            <div className="stat-card">
              <span className="stat-value">{analytics.weights.totalWithWeight}</span>
              <span className="stat-label">Patients Weighed</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{analytics.weights.averageDeviation.toFixed(2)}kg</span>
              <span className="stat-label">Avg Deviation</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{analytics.weights.maxDeviation.toFixed(2)}kg</span>
              <span className="stat-label">Max Deviation</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">
                {analytics.weights.deviations.filter(d => d > 1.5).length}
              </span>
              <span className="stat-label">High Deviations (&gt;1.5kg)</span>
            </div>
          </div>
        </div>

        {/* Treatment Times */}
        <div className="analytics-section time-section">
          <h2 className="section-title">Treatment Progress</h2>
          <div className="stat-cards">
            <div className="stat-card">
              <span className="stat-value">{analytics.treatmentTimes.started}</span>
              <span className="stat-label">Treatments Started</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{analytics.treatmentTimes.completed}</span>
              <span className="stat-label">Treatments Completed</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{analytics.treatmentTimes.notStarted}</span>
              <span className="stat-label">Not Started</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">
                {formatDuration(analytics.treatmentTimes.averageDuration)}
              </span>
              <span className="stat-label">Avg Duration</span>
            </div>
          </div>
        </div>

        {/* Issues Summary */}
        <div className="analytics-section issues-section">
          <h2 className="section-title">Issues Reported</h2>
          <div className="issues-grid">
            <div className={`issue-card ${analytics.issueStats.covid > 0 ? 'danger' : ''}`}>
              <span className="issue-icon">🦠</span>
              <span className="issue-value">{analytics.issueStats.covid}</span>
              <span className="issue-label">COVID-19</span>
            </div>
            <div className={`issue-card ${analytics.issueStats.earlyTermination > 0 ? 'warning' : ''}`}>
              <span className="issue-icon">⏱️</span>
              <span className="issue-value">{analytics.issueStats.earlyTermination}</span>
              <span className="issue-label">Early Term</span>
            </div>
            <div className={`issue-card ${analytics.issueStats.missedTreatment > 0 ? 'danger' : ''}`}>
              <span className="issue-icon">❌</span>
              <span className="issue-value">{analytics.issueStats.missedTreatment}</span>
              <span className="issue-label">Missed Tx</span>
            </div>
            <div className={`issue-card ${analytics.issueStats.hospitalized > 0 ? 'warning' : ''}`}>
              <span className="issue-icon">🏥</span>
              <span className="issue-value">{analytics.issueStats.hospitalized}</span>
              <span className="issue-label">Hospitalized</span>
            </div>
            <div className={`issue-card ${analytics.issueStats.sentOut > 0 ? 'danger' : ''}`}>
              <span className="issue-icon">🚑</span>
              <span className="issue-value">{analytics.issueStats.sentOut}</span>
              <span className="issue-label">Sent Out</span>
            </div>
            <div className={`issue-card ${analytics.issueStats.statLabs > 0 ? 'info' : ''}`}>
              <span className="issue-icon">🧪</span>
              <span className="issue-value">{analytics.issueStats.statLabs}</span>
              <span className="issue-label">STAT Labs</span>
            </div>
          </div>
        </div>

        {/* Tasks Summary */}
        <div className="analytics-section tasks-section">
          <h2 className="section-title">Tasks Overview</h2>
          <div className="stat-cards">
            <div className="stat-card">
              <span className="stat-value">{analytics.todoStats.patientsWithTodos}</span>
              <span className="stat-label">Patients w/ Tasks</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{analytics.todoStats.totalTodos}</span>
              <span className="stat-label">Total Tasks</span>
            </div>
            <div className="stat-card success">
              <span className="stat-value">{analytics.todoStats.completedTodos}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-card warning">
              <span className="stat-value">{analytics.todoStats.pendingTodos}</span>
              <span className="stat-label">Pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
