import React, { useState, useEffect } from 'react';
import { BarcodeScanner } from './BarcodeScanner';
import { JobDetails } from './JobDetails';
import { SimulationCanvas } from './SimulationCanvas';
import { CutTimeCalculator } from './CutTimeCalculator';
import { FileUpload } from './FileUpload';
import { NCParser } from '../shared/ncParser';
import { getJob, getNCFile, type JobMetadata } from './mockDatabase';
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
  parsedData: any;
}

function App() {
  const [currentJob, setCurrentJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ content: string; filename: string } | null>(null);

  // Handle barcode scan result
  const handleBarcodeScanned = async (barcode: string) => {
    setLoading(true);
    setError(null);

    try {
      // Get job data from local database
      const job = getJob(barcode);
      if (!job) {
        setError(`Job with ID '${barcode}' not found`);
        setCurrentJob(null);
        return;
      }

      // Get NC file content
      const ncFileContent = getNCFile(barcode);
      if (!ncFileContent) {
        setError(`NC file for job '${barcode}' not found`);
        setCurrentJob(null);
        return;
      }

      // Parse NC file
      const parser = new NCParser();
      const parsedData = parser.parseNCFile(ncFileContent);

      // Calculate cut time using defaults
      const pierceTimePerPiece = 0.5; // Default 30 seconds in minutes
      const cuttingSpeed = job.cuttingParameters.averageSpeed || 50; // Default 50 mm/min
      const cutTimeResult = NCParser.calculateCutTime(
        parsedData.piercingCount,
        pierceTimePerPiece,
        parsedData.cuttingPerimeter,
        cuttingSpeed
      );

      const jobData: JobData = {
        client: job.client,
        material: job.material,
        sheetName: job.sheetName,
        sheetSize: job.sheetSize,
        machine: job.machine,
        parts: job.parts,
        estimatedTimes: job.estimatedTimes,
        ncFileContent,
        cuttingSpeed,
        pierceTime: pierceTimePerPiece,
        otherMetadata: {
          pressure: job.machine.pressure,
          abrasiveFlow: job.machine.abrasiveFlow,
          toolDiameter: job.machine.toolDiameter
        },
        parsedData: {
          ...parsedData,
          approxCutTime: cutTimeResult.totalTime
        }
      };

      setCurrentJob(jobData);
    } catch (err) {
      console.error('Error fetching job:', err);
      setError('Failed to load job data');
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
  const handleFileLoaded = (content: string, filename: string) => {
    setLoading(true);
    setError(null);
    setUploadedFile({ content, filename });

    try {
      // Parse the uploaded NC file
      const parser = new NCParser();
      const parsedData = parser.parseNCFile(content);

      // Create a mock job data structure for uploaded files
      const mockJob: JobData = {
        client: 'Uploaded File',
        material: {
          type: 'Unknown',
          thickness: 10
        },
        sheetName: filename,
        sheetSize: {
          width: parsedData.boundingBox.maxX - parsedData.boundingBox.minX || 1000,
          height: parsedData.boundingBox.maxY - parsedData.boundingBox.minY || 1000
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
        cuttingSpeed: parsedData.cuttingSpeed,
        pierceTime: 0.5,
        otherMetadata: {},
        parsedData
      };

      setCurrentJob(mockJob);
    } catch (err) {
      console.error('Error parsing uploaded file:', err);
      setError('Failed to parse uploaded file. Please check the file format.');
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
        <p>Scan barcode from IGEMS report or upload NC files to view cutting simulation</p>
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
                  onUpdate={(jobData) => setCurrentJob(jobData)}
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