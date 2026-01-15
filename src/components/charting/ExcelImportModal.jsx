import { useState } from 'react';
import { usePatients } from '../../contexts/PatientContext';
import * as XLSX from 'xlsx';
import './ExcelImportModal.css';

const ExcelImportModal = ({ isOpen, onClose }) => {
  const { importPatients, activeShift } = usePatients();
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (file) => {
    if (!file) return;

    // Check file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Please upload a valid Excel file (.xlsx, .xls) or CSV file');
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          setError('The Excel file appears to be empty');
          return;
        }

        // Map Excel columns to patient data
        const mappedData = jsonData.map(row => ({
          name: row.Name || row.name || row.PatientName || row['Patient Name'] || '',
          chair: row.Chair || row.chair || row.ChairNumber || row['Chair Number'] || null,
          tech: row.Tech || row.tech || row.Technician || row.technician || '',
          pod: row.Pod || row.pod || row.PodNumber || row['Pod Number'] || '',
          section: row.Section || row.section || '',
          shift: row.Shift || row.shift || activeShift,
          dryWeight: row.DryWeight || row['Dry Weight'] || row.dryWeight || null
        }));

        // Filter out completely empty rows
        const validData = mappedData.filter(patient => patient.name.trim() !== '');

        if (validData.length === 0) {
          setError('No valid patient data found. Please ensure your Excel file has a "Name" column.');
          return;
        }

        setPreviewData(validData);
        setError('');
      } catch (err) {
        console.error('Error parsing file:', err);
        setError('Failed to parse the Excel file. Please check the file format.');
      }
    };

    reader.onerror = () => {
      setError('Failed to read the file');
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleImport = () => {
    if (previewData && previewData.length > 0) {
      importPatients(previewData);
      onClose();
    }
  };

  const handleCancel = () => {
    setPreviewData(null);
    setError('');
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  return (
    <div className="excel-import-overlay" onClick={handleOverlayClick}>
      <div className="excel-import-modal">
        <div className="excel-import-header">
          <h2>Import Patients from Excel</h2>
          <button className="excel-close-btn" onClick={handleCancel} aria-label="Close">
            ×
          </button>
        </div>

        <div className="excel-import-content">
          {!previewData ? (
            <>
              <div
                className={`excel-dropzone ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="excel-dropzone-icon">📊</div>
                <h3>Drop Excel file here</h3>
                <p>or</p>
                <label className="excel-file-label">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="excel-file-input"
                  />
                  <span className="excel-file-btn">Choose File</span>
                </label>
                <p className="excel-hint">Supports .xlsx, .xls, and .csv files</p>
              </div>

              <div className="excel-instructions">
                <h4>📋 Excel File Format:</h4>
                <p>Your Excel file should have the following columns (case-insensitive):</p>
                <ul>
                  <li><strong>Name</strong> (required) - Patient name</li>
                  <li><strong>Chair</strong> (optional) - Chair number</li>
                  <li><strong>Tech</strong> (optional) - Technician name</li>
                  <li><strong>Pod</strong> (optional) - Pod assignment (A, B, C, etc.)</li>
                  <li><strong>Section</strong> (optional) - Section (B1, B2, A1, A2, TCH)</li>
                  <li><strong>Shift</strong> (optional) - Shift (1st, 2nd, 3rd)</li>
                  <li><strong>Dry Weight</strong> (optional) - Target dry weight</li>
                </ul>
                <p className="excel-note">
                  💡 <strong>Tip:</strong> Only the Name column is required. Other fields can be added or updated later.
                </p>
              </div>

              {error && (
                <div className="excel-error">
                  <span className="excel-error-icon">⚠️</span>
                  {error}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="excel-preview">
                <h3>Preview ({previewData.length} patients)</h3>
                <div className="excel-preview-table-wrapper">
                  <table className="excel-preview-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Chair</th>
                        <th>Tech</th>
                        <th>Pod</th>
                        <th>Section</th>
                        <th>Shift</th>
                        <th>Dry Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 10).map((patient, index) => (
                        <tr key={index}>
                          <td>{patient.name || '-'}</td>
                          <td>{patient.chair || '-'}</td>
                          <td>{patient.tech || '-'}</td>
                          <td>{patient.pod || '-'}</td>
                          <td>{patient.section || '-'}</td>
                          <td>{patient.shift || '-'}</td>
                          <td>{patient.dryWeight || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {previewData.length > 10 && (
                  <p className="excel-preview-note">
                    Showing first 10 of {previewData.length} patients
                  </p>
                )}
              </div>

              <div className="excel-import-actions">
                <button className="excel-cancel-btn" onClick={handleCancel}>
                  Cancel
                </button>
                <button className="excel-import-btn" onClick={handleImport}>
                  Import {previewData.length} Patient{previewData.length !== 1 ? 's' : ''}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExcelImportModal;
