import { useState, useMemo } from 'react';
import { usePatients } from '../../contexts/PatientContext';
import { useOperations } from '../../contexts/OperationsContext';
import './ReportsPage.css';

const ReportsPage = () => {
  const { patients, getFilteredPatients, activeShift } = usePatients();
  const { labs } = useOperations();
  const [copied, setCopied] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const filteredPatients = getFilteredPatients();

  // Generate EOSR data from patients
  const eosrData = useMemo(() => {
    const data = {
      completeWithoutIssue: [],
      covid: [],
      weightDeviation: [],
      earlyTermination: [],
      missedTreatments: [],
      medsRescheduled: [],
      statLabs: [],
      sentOut: [],
      hospitalization: [],
      welfareCheck: [],
      newPatients: [],
      midasReport: [],
      accessComplications: [],
      disinfectionLogs: []
    };

    filteredPatients.forEach(patient => {
      const eosr = patient.eosr || {};
      const hasIssue = false;
      let patientHasIssue = false;

      // 1. COVID-19 Presumptive
      if (eosr.covid) {
        data.covid.push({
          name: patient.name,
          chair: patient.chair,
          info: 'COVID-19 presumptive'
        });
        patientHasIssue = true;
      }

      // 2. Weight Deviation (>1.5kg from dry weight)
      if (patient.preWeight && patient.dryWeight) {
        const deviation = Math.abs(patient.preWeight - patient.dryWeight);
        if (deviation > 1.5) {
          data.weightDeviation.push({
            name: patient.name,
            chair: patient.chair,
            info: `Pre: ${patient.preWeight}kg, Dry: ${patient.dryWeight}kg (${deviation > 0 ? '+' : ''}${deviation.toFixed(1)}kg)`
          });
          patientHasIssue = true;
        }
      }

      // 3. Early Termination
      if (eosr.earlyTermination?.is) {
        data.earlyTermination.push({
          name: patient.name,
          chair: patient.chair,
          info: `${eosr.earlyTermination.minutes} min early${eosr.earlyTermination.reason ? ` - ${eosr.earlyTermination.reason}` : ''}`
        });
        patientHasIssue = true;
      }

      // 4. Missed Treatments
      if (patient.missedTx?.isMissed || patient.missedTx?.count > 0) {
        data.missedTreatments.push({
          name: patient.name,
          chair: patient.chair,
          info: `${patient.missedTx.count || 1} missed${patient.missedTx.reason ? ` - ${patient.missedTx.reason}` : ''}`
        });
        patientHasIssue = true;
      }

      // 5. Medications Rescheduled
      if (eosr.medsRescheduled?.is) {
        data.medsRescheduled.push({
          name: patient.name,
          chair: patient.chair,
          info: eosr.medsRescheduled.meds || 'Meds rescheduled'
        });
        patientHasIssue = true;
      }

      // 6. STAT Labs
      if (eosr.statLabs?.length > 0 || patient.qa?.statLabs) {
        const labInfo = eosr.statLabs?.length > 0
          ? eosr.statLabs.join(', ')
          : 'STAT labs ordered';
        data.statLabs.push({
          name: patient.name,
          chair: patient.chair,
          info: labInfo
        });
        patientHasIssue = true;
      }

      // 7. Sent to ED/Hospital
      if (eosr.sentOut?.is) {
        data.sentOut.push({
          name: patient.name,
          chair: patient.chair,
          info: `Sent to ${eosr.sentOut.destination || 'ED'}${eosr.sentOut.reason ? ` - ${eosr.sentOut.reason}` : ''}`
        });
        patientHasIssue = true;
      }

      // 8. Hospitalization
      if (patient.hospitalized?.isHosp) {
        data.hospitalization.push({
          name: patient.name,
          chair: patient.chair,
          info: `${patient.hospitalized.hospital || 'Hospitalized'}${patient.hospitalized.days ? ` (Day ${patient.hospitalized.days})` : ''}`
        });
        patientHasIssue = true;
      }

      // 9. Welfare Check
      if (eosr.welfareCheck?.is) {
        data.welfareCheck.push({
          name: patient.name,
          chair: patient.chair,
          info: eosr.welfareCheck.reason || 'Welfare check needed'
        });
        patientHasIssue = true;
      }

      // 10. New Patients
      if (eosr.isNewPatient) {
        data.newPatients.push({
          name: patient.name,
          chair: patient.chair,
          info: 'New patient intake'
        });
        patientHasIssue = true;
      }

      // 11. MIDAS Report
      if (eosr.midasReport?.is) {
        data.midasReport.push({
          name: patient.name,
          chair: patient.chair,
          info: eosr.midasReport.reason || 'MIDAS report filed'
        });
        patientHasIssue = true;
      }

      // 12. Access Complications
      if (eosr.accessComplication?.is) {
        data.accessComplications.push({
          name: patient.name,
          chair: patient.chair,
          info: eosr.accessComplication.type || 'Access complication'
        });
        patientHasIssue = true;
      }

      // 13. Disinfection Logs (incomplete)
      if (eosr.disinfectionComplete === false) {
        data.disinfectionLogs.push({
          name: patient.name,
          chair: patient.chair,
          info: 'Disinfection incomplete'
        });
      }

      // Complete Without Issue - patients with chart closed and no issues
      if (patient.qa?.chartClosed && !patientHasIssue) {
        data.completeWithoutIssue.push({
          name: patient.name,
          chair: patient.chair,
          info: 'Completed without issue'
        });
      }
    });

    // Add disinfection complete count
    const disinfectionComplete = filteredPatients.filter(p =>
      p.eosr?.disinfectionComplete !== false
    ).length;
    data.disinfectionComplete = disinfectionComplete;
    data.disinfectionTotal = filteredPatients.length;

    return data;
  }, [filteredPatients, lastRefresh]);

  // Section configuration
  const sections = [
    {
      id: 'complete',
      title: 'Treatments Complete Without Issue',
      icon: '✅',
      data: eosrData.completeWithoutIssue,
      emptyText: 'No completed treatments yet'
    },
    {
      id: 'covid',
      title: 'COVID-19 Presumptive',
      icon: '🦠',
      data: eosrData.covid,
      emptyText: 'No COVID-19 presumptive cases',
      alertLevel: 'danger'
    },
    {
      id: 'weight',
      title: 'Weight Deviation',
      icon: '⚖️',
      data: eosrData.weightDeviation,
      emptyText: 'No weight deviations >1.5kg',
      subtitle: '>1.5kg from dry weight'
    },
    {
      id: 'early',
      title: 'Early Termination',
      icon: '⏱️',
      data: eosrData.earlyTermination,
      emptyText: 'No early terminations',
      subtitle: '>15 minutes early'
    },
    {
      id: 'missed',
      title: 'Missed Treatments',
      icon: '❌',
      data: eosrData.missedTreatments,
      emptyText: 'No missed treatments',
      alertLevel: 'warning'
    },
    {
      id: 'meds',
      title: 'Medications Rescheduled',
      icon: '💊',
      data: eosrData.medsRescheduled,
      emptyText: 'No medications rescheduled'
    },
    {
      id: 'labs',
      title: 'STAT Labs',
      icon: '🧪',
      data: eosrData.statLabs,
      emptyText: 'No STAT labs ordered',
      alertLevel: 'info'
    },
    {
      id: 'sentout',
      title: 'Sent to ED/Hospital',
      icon: '🚑',
      data: eosrData.sentOut,
      emptyText: 'No patients sent out',
      alertLevel: 'danger'
    },
    {
      id: 'hosp',
      title: 'Hospitalization',
      icon: '🏥',
      data: eosrData.hospitalization,
      emptyText: 'No hospitalized patients',
      alertLevel: 'warning'
    },
    {
      id: 'welfare',
      title: 'Welfare Check',
      icon: '📞',
      data: eosrData.welfareCheck,
      emptyText: 'No welfare checks needed'
    },
    {
      id: 'new',
      title: 'New Patients',
      icon: '🆕',
      data: eosrData.newPatients,
      emptyText: 'No new patients'
    },
    {
      id: 'midas',
      title: 'MIDAS Report',
      icon: '📋',
      data: eosrData.midasReport,
      emptyText: 'No MIDAS reports'
    },
    {
      id: 'access',
      title: 'Access Complications',
      icon: '🩸',
      data: eosrData.accessComplications,
      emptyText: 'No access complications',
      alertLevel: 'warning'
    },
    {
      id: 'disinfect',
      title: 'Disinfection Logs',
      icon: '🧹',
      data: eosrData.disinfectionLogs,
      emptyText: `All machines disinfected (${eosrData.disinfectionComplete}/${eosrData.disinfectionTotal})`,
      customContent: true
    }
  ];

  // Generate report text for copying
  const generateReportText = () => {
    const date = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const time = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    let report = `END OF SHIFT REPORT\n`;
    report += `${activeShift} Shift - ${date} at ${time}\n`;
    report += `Total Patients: ${filteredPatients.length}\n`;
    report += `${'='.repeat(50)}\n\n`;

    sections.forEach(section => {
      report += `${section.icon} ${section.title.toUpperCase()}\n`;
      report += `${'-'.repeat(40)}\n`;

      if (section.data.length === 0) {
        if (section.id === 'disinfect') {
          report += `All machines disinfected (${eosrData.disinfectionComplete}/${eosrData.disinfectionTotal})\n`;
        } else {
          report += `• None\n`;
        }
      } else {
        section.data.forEach(item => {
          const chairInfo = item.chair ? `[Chair ${item.chair}]` : '';
          report += `• ${item.name} ${chairInfo}: ${item.info}\n`;
        });
      }
      report += `\n`;
    });

    report += `${'='.repeat(50)}\n`;
    report += `Report generated at ${time}\n`;

    return report;
  };

  const handleCopyReport = () => {
    const reportText = generateReportText();
    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRefresh = () => {
    setLastRefresh(new Date());
  };

  return (
    <div className="reports-page active">
      <div className="reports-header">
        <div className="reports-header-content">
          <h1 className="reports-title">📊 End of Shift Report</h1>
          <p className="reports-subtitle">
            {activeShift} Shift | {filteredPatients.length} Patients |
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div className="reports-actions">
          <button
            className="reports-btn refresh-btn"
            onClick={handleRefresh}
          >
            🔄 Refresh
          </button>
          <button
            className={`reports-btn copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopyReport}
          >
            {copied ? '✓ Copied!' : '📋 Copy Report'}
          </button>
        </div>
      </div>

      <div className="eosr-container">
        {sections.map(section => (
          <div
            key={section.id}
            className={`eosr-section ${section.alertLevel || ''}`}
          >
            <div className="eosr-section-header">
              <div className="eosr-section-title">
                <span className="eosr-icon">{section.icon}</span>
                <span className="eosr-title-text">{section.title}</span>
                {section.subtitle && (
                  <span className="eosr-subtitle">({section.subtitle})</span>
                )}
              </div>
              <span className={`eosr-count ${section.data.length > 0 ? 'has-items' : ''}`}>
                {section.data.length}
              </span>
            </div>
            <div className="eosr-section-content">
              {section.data.length === 0 ? (
                <div className="eosr-empty">
                  {section.emptyText}
                </div>
              ) : (
                <ul className="eosr-list">
                  {section.data.map((item, index) => (
                    <li key={index} className="eosr-item">
                      <span className="eosr-patient-name">{item.name}</span>
                      {item.chair && (
                        <span className="eosr-chair">[Chair {item.chair}]</span>
                      )}
                      <span className="eosr-info">{item.info}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="reports-footer">
        <div className="reports-summary">
          <div className="summary-item">
            <span className="summary-label">Total Patients</span>
            <span className="summary-value">{filteredPatients.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Completed</span>
            <span className="summary-value success">{eosrData.completeWithoutIssue.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">With Issues</span>
            <span className="summary-value warning">
              {filteredPatients.length - eosrData.completeWithoutIssue.length}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Disinfection</span>
            <span className="summary-value">
              {eosrData.disinfectionComplete}/{eosrData.disinfectionTotal}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
