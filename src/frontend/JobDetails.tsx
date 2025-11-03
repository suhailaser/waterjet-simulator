import React from 'react';
import { NCParser } from '../shared/ncParser';

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

interface JobDetailsProps {
  jobData: JobData;
  onRecalculate: (jobData: JobData) => void;
}

export const JobDetails: React.FC<JobDetailsProps> = ({ jobData, onRecalculate }) => {
  const formatTime = (minutes: number): string => {
    return NCParser.formatTime(minutes);
  };

  return (
    <div className="job-details">
      <h3>📋 Job Details</h3>
      
      <div className="details-section">
        <h4>Client Information</h4>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Client:</span>
            <span className="detail-value">{jobData.client}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Sheet ID:</span>
            <span className="detail-value">{jobData.sheetName}</span>
          </div>
        </div>
      </div>

      <div className="details-section">
        <h4>Material Specifications</h4>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Material:</span>
            <span className="detail-value">{jobData.material.type}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Thickness:</span>
            <span className="detail-value">{jobData.material.thickness} mm</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Sheet Size:</span>
            <span className="detail-value">
              {jobData.sheetSize.width} × {jobData.sheetSize.height} mm
            </span>
          </div>
        </div>
      </div>

      <div className="details-section">
        <h4>Machine Parameters</h4>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Machine:</span>
            <span className="detail-value">{jobData.machine.name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Pressure:</span>
            <span className="detail-value">{jobData.machine.pressure} bar</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Orifice:</span>
            <span className="detail-value">{jobData.machine.orifice} mm</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Nozzle:</span>
            <span className="detail-value">{jobData.machine.nozzleDiameter} mm</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Abrasive:</span>
            <span className="detail-value">{jobData.machine.abrasiveQuality}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Flow Rate:</span>
            <span className="detail-value">{jobData.machine.abrasiveFlow} g/min</span>
          </div>
        </div>
      </div>

      <div className="details-section">
        <h4>Cutting Statistics</h4>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Cutting Perimeter:</span>
            <span className="detail-value">
              {jobData.parsedData.cuttingPerimeter.toFixed(2)} mm
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Piercing Points:</span>
            <span className="detail-value">{jobData.parsedData.piercingCount}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Rapid Length:</span>
            <span className="detail-value">
              {jobData.parsedData.rapidLength.toFixed(2)} mm
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Avg Cutting Speed:</span>
            <span className="detail-value">
              {jobData.cuttingSpeed.toFixed(2)} mm/min
            </span>
          </div>
        </div>
      </div>

      <div className="details-section">
        <h4>Time Breakdown (from IGEMS)</h4>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Rapid Time:</span>
            <span className="detail-value">
              {formatTime(jobData.estimatedTimes.rapid)}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Marking Time:</span>
            <span className="detail-value">
              {formatTime(jobData.estimatedTimes.marking)}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Piercing Time:</span>
            <span className="detail-value">
              {formatTime(jobData.estimatedTimes.piercing)}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Cutting Time:</span>
            <span className="detail-value">
              {formatTime(jobData.estimatedTimes.cutting)}
            </span>
          </div>
          <div className="detail-item total">
            <span className="detail-label">Total Time:</span>
            <span className="detail-value">
              {formatTime(jobData.estimatedTimes.total)}
            </span>
          </div>
        </div>
      </div>

      {jobData.parts && jobData.parts.length > 0 && (
        <div className="details-section">
          <h4>Parts ({jobData.parts.length})</h4>
          <div className="parts-list">
            {jobData.parts.map((part, index) => (
              <div key={index} className="part-item">
                <div className="part-header">
                  <span className="part-name">{part.name}</span>
                  <span className="part-quantity">×{part.quantity}</span>
                </div>
                <div className="part-details">
                  <span>Cutting Length: {part.cuttingLength.toFixed(2)} mm</span>
                  <span>Weight: {part.weight} kg</span>
                  <span>Time: {formatTime(part.totalTime)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};