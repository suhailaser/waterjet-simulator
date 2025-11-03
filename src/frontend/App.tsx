import React, { useState, useEffect } from 'react';
import { BarcodeScanner } from './BarcodeScanner';
import { JobDetails } from './JobDetails';
import { SimulationCanvas } from './SimulationCanvas';
import { CutTimeCalculator } from './CutTimeCalculator';
import { FileUpload } from './FileUpload';
import { JobMetadata, ParsedNCData, APIResponse } from '../shared/types';
import './App.css';

interface JobData {
  client: string;
  material: {
    type: string;
    thickness: number;
  };
  sheetName: string;
  sheetSize: {
    width: number;
    height: number;
  };
  machine: any;
  parts: any[];
  estimatedTimes: any;
  ncFileContent: string;
  cuttingSpeed: number;
  pierceTime: number;
  otherMetadata: any;
  parsedData: ParsedNCData;
}

function App() {
  const [currentJob, setCurrentJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiBaseUrl] = useState('http://localhost:3001/api');
  const [uploadedFile, setUploadedFile] = useState<{ content: string; filename: string } | null>(null);

  // Handle barcode scan result
  const handleBarcodeScanned = async (barcode: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/jobs/${barcode}`);
      const result: APIResponse<JobData> = await response.json();

      if (result.success && result.data) {
        setCurrentJob(result.data);
      } else {
        setError(result.error || 'Failed to fetch job data');
        setCurrentJob(null);
      }
    } catch (err) {
      console.error('Error fetching job:', err);
      setError('Network error. Please check if the server is running.');
      setCurrentJob(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle manual job ID entry
  const handleManualJobId = (jobId: string) => {
    if (jobId.trim()) {
      handleBarcodeScanned(jobId.trim());
    }
  };

  // Handle file upload
  const handleFileLoaded = async (content: string, filename: string) => {
    setLoading(true);
    setError(null);
    setUploadedFile({ content, filename });

    try {
      // Parse the uploaded NC file
      const response = await fetch(`${apiBaseUrl}/parse-nc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ncFileContent: content }),
      });

      const result: APIResponse<ParsedNCData> = await response.json();

      if (result.success && result.data) {
        // Create a mock job data structure for uploaded files
        const mockJob: JobData = {
          client: 'Uploaded File',
          material: {
            type: 'Unknown',
            thickness: 10
          },
          sheetName: filename,
          sheetSize: {
            width: result.data.boundingBox.maxX - result.data.boundingBox.minX || 1000,
            height: result.data.boundingBox.maxY - result.data.boundingBox.minY || 1000
          },
          machine: {
            name: 'Unknown',
            pressure: 3000,
            orifice: 0.3,
            abrasiveQuality: 'Unknown',
            nozzleDiameter: 0.8,
            abrasiveFlow: 400,
            toolDiameter: 1.0
          },
          parts: [],
          estimatedTimes: {
            rapid: 0,
            marking: 0,
            piercing: 0,
            drilling: 0,
            cutting: 0,
            total: 0
          },
          ncFileContent: content,
          cuttingSpeed: result.data.cuttingSpeed,
          pierceTime: 0.5,
          otherMetadata: {},
          parsedData: result.data
        };

        setCurrentJob(mockJob);
      } else {
        setError(result.error || 'Failed to parse uploaded file');
      }
    } catch (err) {
      console.error('Error parsing uploaded file:', err);
      setError('Network error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Reset to scan mode
  const handleReset = () => {
    setCurrentJob(null);
    setError(null);
    setUploadedFile(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔧 Waterjet Simulator</h1>
        <p>Scan barcode from IGEMS report to view cutting simulation</p>
      </header>

      <main className="app-main">
        {!currentJob && (
          <div className="scanner-section">
            <BarcodeScanner
              onScan={handleBarcodeScanned}
              onManualEntry={handleManualJobId}
              loading={loading}
              error={error}
            />

            <FileUpload
              onFileLoaded={handleFileLoaded}
              loading={loading}
            />

            <div className="sample-jobs">
              <h3>Available Sample Jobs:</h3>
              <div className="job-buttons">
                <button
                  onClick={() => handleBarcodeScanned('SHEET-3670')}
                  disabled={loading}
                  className="job-button"
                >
                  SHEET-3670 (SMB Engineers - Stainless Steel)
                </button>
                <button
                  onClick={() => handleBarcodeScanned('TEST-1234')}
                  disabled={loading}
                  className="job-button"
                >
                  TEST-1234 (ABC Manufacturing - Aluminum)
                </button>
              </div>
            </div>
          </div>
        )}

        {currentJob && (
          <div className="job-view">
            <div className="job-header">
              <button onClick={handleReset} className="back-button">
                ← Scan New Job
              </button>
              <h2>{currentJob.client} - {currentJob.material.type}</h2>
            </div>

            <div className="job-content">
              <div className="left-panel">
                <JobDetails 
                  jobData={currentJob}
                  onRecalculate={setCurrentJob}
                />
                
                <CutTimeCalculator
                  currentJob={currentJob}
                  onUpdate={(jobData: JobData) => setCurrentJob(jobData)}
                />
              </div>

              <div className="right-panel">
                <SimulationCanvas 
                  ncFileContent={currentJob.ncFileContent}
                  parsedData={currentJob.parsedData}
                  jobData={currentJob}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading job data...</p>
        </div>
      )}
    </div>
  );
}

export default App;