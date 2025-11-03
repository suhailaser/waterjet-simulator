import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { MockDatabase } from './mockDatabase';
import { NCParser } from '../shared/ncParser';
import { JobMetadata, ParsedNCData, CutTimeCalculation, APIResponse } from '../shared/types';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.text({ limit: '50mb', type: 'text/plain' }));

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  } as APIResponse<null>);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: { status: 'healthy', timestamp: new Date().toISOString() },
    timestamp: new Date().toISOString()
  } as APIResponse<any>);
});

/**
 * GET /api/jobs/:jobId
 * Fetch job metadata and NC file by job ID (from barcode scan)
 */
app.get('/api/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Validate job ID
    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid job ID provided',
        timestamp: new Date().toISOString()
      } as APIResponse<null>);
    }

    // Get job metadata
    const job = MockDatabase.getJob(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: `Job with ID '${jobId}' not found`,
        timestamp: new Date().toISOString()
      } as APIResponse<null>);
    }

    // Get NC file content
    const ncFileContent = MockDatabase.getNCFile(jobId);
    if (!ncFileContent) {
      return res.status(404).json({
        success: false,
        error: `NC file for job '${jobId}' not found`,
        timestamp: new Date().toISOString()
      } as APIResponse<null>);
    }

    // Parse NC file
    const parser = new NCParser();
    const parsedData = parser.parseNCFile(ncFileContent);

    // Calculate cut time using defaults or metadata
    const pierceTimePerPiece = 0.5; // Default 30 seconds in minutes
    const cuttingSpeed = job.cuttingParameters.averageSpeed || 50; // Default 50 mm/min
    const cutTimeResult = NCParser.calculateCutTime(
      parsedData.piercingCount,
      pierceTimePerPiece,
      parsedData.cuttingPerimeter,
      cuttingSpeed
    );

    const response = {
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

    res.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString()
    } as APIResponse<typeof response>);

  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process job request',
      timestamp: new Date().toISOString()
    } as APIResponse<null>);
  }
});

/**
 * POST /api/upload-job
 * Upload new job with metadata and NC file (admin function)
 */
app.post('/api/upload-job', (req, res) => {
  try {
    const { jobId, jobMetadata, ncFileContent } = req.body;

    // Validate required fields
    if (!jobId || !jobMetadata || !ncFileContent) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: jobId, jobMetadata, ncFileContent',
        timestamp: new Date().toISOString()
      } as APIResponse<null>);
    }

    // Validate job metadata structure
    if (!jobMetadata.client || !jobMetadata.material || !jobMetadata.sheetName) {
      return res.status(400).json({
        success: false,
        error: 'Invalid job metadata structure',
        timestamp: new Date().toISOString()
      } as APIResponse<null>);
    }

    // Check if job already exists
    if (MockDatabase.jobExists(jobId)) {
      return res.status(409).json({
        success: false,
        error: `Job with ID '${jobId}' already exists`,
        timestamp: new Date().toISOString()
      } as APIResponse<null>);
    }

    // Parse NC file to validate and extract basic info
    const parser = new NCParser();
    const parsedData = parser.parseNCFile(ncFileContent);

    // Create full job metadata
    const fullJobMetadata: JobMetadata = {
      jobId,
      client: jobMetadata.client,
      material: jobMetadata.material,
      sheetName: jobMetadata.sheetName,
      sheetSize: jobMetadata.sheetSize || { width: 1000, height: 1000 },
      machine: jobMetadata.machine || {
        name: 'AWJ',
        pressure: 3200,
        orifice: 0.330,
        abrasiveQuality: 'Unknown',
        nozzleDiameter: 0.889,
        abrasiveFlow: 400,
        toolDiameter: 1.000
      },
      cuttingParameters: {
        rapidLength: parsedData.rapidLength,
        cuttingLength: parsedData.cuttingPerimeter,
        averageSpeed: parsedData.cuttingSpeed,
        cuttingTime: 0,
        totalTime: 0
      },
      parts: jobMetadata.parts || [],
      estimatedTimes: {
        rapid: 0,
        marking: 0,
        piercing: 0,
        drilling: 0,
        cutting: 0,
        total: 0
      }
    };

    // Store in database
    MockDatabase.storeJob(jobId, fullJobMetadata, ncFileContent);

    res.status(201).json({
      success: true,
      data: {
        jobId,
        message: 'Job uploaded successfully',
        parsedData
      },
      timestamp: new Date().toISOString()
    } as APIResponse<any>);

  } catch (error) {
    console.error('Error uploading job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload job',
      timestamp: new Date().toISOString()
    } as APIResponse<null>);
  }
});

/**
 * GET /api/jobs
 * List all available jobs
 */
app.get('/api/jobs', (req, res) => {
  try {
    const jobs = MockDatabase.listJobs();
    
    res.json({
      success: true,
      data: jobs,
      timestamp: new Date().toISOString()
    } as APIResponse<string[]>);

  } catch (error) {
    console.error('Error listing jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list jobs',
      timestamp: new Date().toISOString()
    } as APIResponse<null>);
  }
});

/**
 * POST /api/calculate-cut-time
 * Calculate cut time with custom parameters
 */
app.post('/api/calculate-cut-time', (req, res) => {
  try {
    const { 
      pierceCount, 
      pierceTimePerPiece, 
      cuttingPerimeter, 
      cuttingSpeed 
    } = req.body;

    // Validate input
    if (
      typeof pierceCount !== 'number' ||
      typeof pierceTimePerPiece !== 'number' ||
      typeof cuttingPerimeter !== 'number' ||
      typeof cuttingSpeed !== 'number'
    ) {
      return res.status(400).json({
        success: false,
        error: 'All parameters must be numbers',
        timestamp: new Date().toISOString()
      } as APIResponse<null>);
    }

    if (pierceCount < 0 || pierceTimePerPiece < 0 || cuttingPerimeter < 0 || cuttingSpeed <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameter values',
        timestamp: new Date().toISOString()
      } as APIResponse<null>);
    }

    // Calculate cut time
    const result = NCParser.calculateCutTime(
      pierceCount,
      pierceTimePerPiece,
      cuttingPerimeter,
      cuttingSpeed
    );

    const calculation: CutTimeCalculation = {
      pierceCount,
      pierceTimePerPiece,
      totalCuttingPerimeter: cuttingPerimeter,
      cuttingSpeed,
      calculatedCutTime: result.totalTime,
      breakdown: result
    };

    res.json({
      success: true,
      data: calculation,
      timestamp: new Date().toISOString()
    } as APIResponse<CutTimeCalculation>);

  } catch (error) {
    console.error('Error calculating cut time:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate cut time',
      timestamp: new Date().toISOString()
    } as APIResponse<null>);
  }
});

/**
 * POST /api/parse-nc
 * Parse NC file and return tool path data
 */
app.post('/api/parse-nc', (req, res) => {
  try {
    const { ncFileContent } = req.body;

    if (!ncFileContent || typeof ncFileContent !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'NC file content is required',
        timestamp: new Date().toISOString()
      } as APIResponse<null>);
    }

    const parser = new NCParser();
    const parsedData = parser.parseNCFile(ncFileContent);

    res.json({
      success: true,
      data: parsedData,
      timestamp: new Date().toISOString()
    } as APIResponse<ParsedNCData>);

  } catch (error) {
    console.error('Error parsing NC file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to parse NC file',
      timestamp: new Date().toISOString()
    } as APIResponse<null>);
  }
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    timestamp: new Date().toISOString()
  } as APIResponse<null>);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Waterjet Simulator API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Sample jobs available: ${MockDatabase.listJobs().join(', ')}`);
});

export default app;