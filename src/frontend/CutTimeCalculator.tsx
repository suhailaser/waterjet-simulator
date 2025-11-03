import React, { useState, useEffect } from 'react';
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

interface CutTimeCalculatorProps {
  currentJob: JobData;
  onUpdate: (jobData: JobData) => void;
}

export const CutTimeCalculator: React.FC<CutTimeCalculatorProps> = ({
  currentJob,
  onUpdate
}) => {
  const [pierceTimePerPiece, setPierceTimePerPiece] = useState(currentJob.pierceTime);
  const [cuttingSpeed, setCuttingSpeed] = useState(currentJob.cuttingSpeed);
  const [customPierceTime, setCustomPierceTime] = useState(false);
  const [customCuttingSpeed, setCustomCuttingSpeed] = useState(false);
  const [calculatedTime, setCalculatedTime] = useState<{
    piercingTime: number;
    cuttingTime: number;
    totalTime: number;
    formattedTime: string;
  } | null>(null);

  // Calculate cut time whenever parameters change
  useEffect(() => {
    const finalPierceTime = customPierceTime ? pierceTimePerPiece : 0.5; // Default 30 seconds in minutes
    const finalCuttingSpeed = customCuttingSpeed ? cuttingSpeed : currentJob.cuttingSpeed;

    const result = NCParser.calculateCutTime(
      currentJob.parsedData.piercingCount,
      finalPierceTime,
      currentJob.parsedData.cuttingPerimeter,
      finalCuttingSpeed
    );

    const formattedTime = NCParser.formatTime(result.totalTime);
    
    setCalculatedTime({
      ...result,
      formattedTime
    });

    // Update job data with new values
    onUpdate({
      ...currentJob,
      pierceTime: finalPierceTime,
      cuttingSpeed: finalCuttingSpeed
    });
  }, [pierceTimePerPiece, cuttingSpeed, customPierceTime, customCuttingSpeed, currentJob, onUpdate]);

  // Handle parameter change
  const handleParameterChange = (
    value: number,
    setter: (value: number) => void,
    setterCustom: (isCustom: boolean) => void,
    isCustom: boolean
  ) => {
    setter(value);
    setterCustom(isCustom);
  };

  return (
    <div className="cut-time-calculator">
      <h3>⏱️ Cut Time Calculator</h3>
      
      <div className="calculator-section">
        <h4>Formula Parameters</h4>
        <p className="formula-text">
          Total Time = (Pierce Count × Pierce Time) + (Cutting Perimeter ÷ Cutting Speed)
        </p>
      </div>

      <div className="parameters-section">
        <div className="parameter-group">
          <h4>Pierce Time per Piece</h4>
          <div className="input-group">
            <label>
              <input
                type="radio"
                name="pierce-time-mode"
                checked={!customPierceTime}
                onChange={() => setCustomPierceTime(false)}
              />
              Use default (30 seconds)
            </label>
            <label>
              <input
                type="radio"
                name="pierce-time-mode"
                checked={customPierceTime}
                onChange={() => setCustomPierceTime(true)}
              />
              Custom value
            </label>
            
            {customPierceTime && (
              <div className="input-row">
                <input
                  type="number"
                  value={pierceTimePerPiece}
                  onChange={(e) => setPierceTimePerPiece(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.1"
                  className="parameter-input"
                />
                <span className="unit">minutes</span>
                <span className="conversion">
                  ({(pierceTimePerPiece * 60).toFixed(0)} seconds)
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="parameter-group">
          <h4>Cutting Speed</h4>
          <div className="input-group">
            <label>
              <input
                type="radio"
                name="cutting-speed-mode"
                checked={!customCuttingSpeed}
                onChange={() => setCustomCuttingSpeed(false)}
              />
              Use from job ({currentJob.cuttingSpeed.toFixed(2)} mm/min)
            </label>
            <label>
              <input
                type="radio"
                name="cutting-speed-mode"
                checked={customCuttingSpeed}
                onChange={() => setCustomCuttingSpeed(true)}
              />
              Custom value
            </label>
            
            {customCuttingSpeed && (
              <div className="input-row">
                <input
                  type="number"
                  value={cuttingSpeed}
                  onChange={(e) => setCuttingSpeed(parseFloat(e.target.value) || 0)}
                  min="1"
                  step="0.1"
                  className="parameter-input"
                />
                <span className="unit">mm/min</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="calculation-section">
        <h4>Calculation Breakdown</h4>
        
        {calculatedTime && (
          <div className="calculation-breakdown">
            <div className="breakdown-item">
              <span className="breakdown-label">Pierce Count:</span>
              <span className="breakdown-value">
                {currentJob.parsedData.piercingCount} pieces
              </span>
            </div>
            
            <div className="breakdown-item">
              <span className="breakdown-label">Pierce Time:</span>
              <span className="breakdown-value">
                {currentJob.parsedData.piercingCount} × {customPierceTime ? pierceTimePerPiece.toFixed(2) : '0.5'} min = {calculatedTime.piercingTime.toFixed(2)} min
              </span>
            </div>
            
            <div className="breakdown-item">
              <span className="breakdown-label">Cutting Perimeter:</span>
              <span className="breakdown-value">
                {currentJob.parsedData.cuttingPerimeter.toFixed(2)} mm
              </span>
            </div>
            
            <div className="breakdown-item">
              <span className="breakdown-label">Cutting Speed:</span>
              <span className="breakdown-value">
                {customCuttingSpeed ? cuttingSpeed.toFixed(2) : currentJob.cuttingSpeed.toFixed(2)} mm/min
              </span>
            </div>
            
            <div className="breakdown-item">
              <span className="breakdown-label">Cutting Time:</span>
              <span className="breakdown-value">
                {currentJob.parsedData.cuttingPerimeter.toFixed(2)} ÷ {customCuttingSpeed ? cuttingSpeed.toFixed(2) : currentJob.cuttingSpeed.toFixed(2)} = {calculatedTime.cuttingTime.toFixed(2)} min
              </span>
            </div>
            
            <div className="breakdown-item total">
              <span className="breakdown-label">Total Calculated Time:</span>
              <span className="breakdown-value total">
                {calculatedTime.formattedTime}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="comparison-section">
        <h4>Time Comparison</h4>
        <div className="comparison-table">
          <div className="comparison-header">
            <span>Source</span>
            <span>Time</span>
            <span>Difference</span>
          </div>
          
          <div className="comparison-row">
            <span>IGEMS Report</span>
            <span>{NCParser.formatTime(currentJob.parsedData.approxCutTime || 78.28)}</span>
            <span>—</span>
          </div>
          
          {calculatedTime && (
            <div className="comparison-row calculated">
              <span>Calculated</span>
              <span>{calculatedTime.formattedTime}</span>
              <span>
                {(() => {
                  const igemsTime = currentJob.parsedData.approxCutTime || 78.28;
                  const diff = calculatedTime.totalTime - igemsTime;
                  const sign = diff >= 0 ? '+' : '';
                  return `${sign}${diff.toFixed(2)} min`;
                })()}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="note-section">
        <p className="note">
          📝 <strong>Note:</strong> The calculated time is an approximation. 
          Actual cutting time may vary based on machine acceleration, deceleration, 
          and operator experience.
        </p>
      </div>
    </div>
  );
};