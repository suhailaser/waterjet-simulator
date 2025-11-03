import { JobMetadata, NCFile, ParsedNCData } from '../shared/types';

/**
 * Mock database containing sample job data from IGEMS reports
 * In production, this would be replaced with a real database
 */
export class MockDatabase {
  private static jobData = new Map<string, JobMetadata>();
  private static ncFiles = new Map<string, string>();

  static {
    // Initialize with sample data from IGEMS report analysis
    this.initializeSampleData();
  }

  /**
   * Initialize database with sample job data
   */
  private static initializeSampleData(): void {
    const sampleJob: JobMetadata = {
      jobId: 'SHEET-3670',
      client: 'SMB Engineers',
      material: {
        type: 'Stainless Steel',
        thickness: 30
      },
      sheetName: 'SHEET-3670',
      sheetSize: {
        width: 1000,
        height: 2000
      },
      machine: {
        name: 'AWJ',
        pressure: 3200,
        orifice: 0.330,
        abrasiveQuality: 'GMA Garnet 80 (0.92)',
        nozzleDiameter: 0.889,
        abrasiveFlow: 450,
        toolDiameter: 1.000
      },
      cuttingParameters: {
        rapidLength: 4522.445,
        cuttingLength: 3849.428,
        averageSpeed: 49.167,
        cuttingTime: 78.28,
        totalTime: 79.17
      },
      parts: [
        {
          name: 'SMB Eng 30 mm SS waterjet (×2)',
          customer: 'SMB Engineers',
          quantity: 2,
          cuttingLength: 1924.714,
          weight: 45.0,
          singleTime: 39.14,
          totalTime: 78.28
        }
      ],
      estimatedTimes: {
        rapid: 0.88,
        marking: 0,
        piercing: 0,
        drilling: 0,
        cutting: 78.28,
        total: 79.17
      }
    };

    // Sample NC file content based on typical waterjet G-code
    const sampleNCFile = `; Waterjet cutting program for SHEET-3670
; Material: Stainless Steel 30mm
; Client: SMB Engineers

G21 ; Metric units
G90 ; Absolute positioning
G54 ; Work coordinate system 1

; Initialize
G00 X0 Y0 Z25.0
M08 ; Start coolant/abrasive feed

; Part 1 - First cut
; Move to start position and pierce
G00 X50 Y50 Z25.0
G00 Z2.0 ; Rapid down to safe height
G01 Z0 F500 ; Move to material surface
G01 X50 Y150 F49.167 ; Start cutting
G01 X100 Y150 F49.167
G01 X100 Y50 F49.167
G01 X50 Y50 F49.167
; End part 1

; Rapid move to part 2
G00 X200 Y50 Z25.0

; Part 2 - Second cut
G00 Z2.0
G01 Z0 F500
G01 X200 Y150 F49.167
G01 X250 Y150 F49.167
G01 X250 Y50 F49.167
G01 X200 Y50 F49.167
; End part 2

; Return to home
G00 X0 Y0 Z25.0
M09 ; Stop coolant/abrasive feed
M30 ; End of program
`;

    this.jobData.set('SHEET-3670', sampleJob);
    this.ncFiles.set('SHEET-3670', sampleNCFile);

    // Add a few more sample jobs for testing
    const job2: JobMetadata = {
      jobId: 'TEST-1234',
      client: 'ABC Manufacturing',
      material: {
        type: 'Aluminum',
        thickness: 10
      },
      sheetName: 'TEST-1234',
      sheetSize: {
        width: 500,
        height: 1000
      },
      machine: {
        name: 'AWJ',
        pressure: 3800,
        orifice: 0.330,
        abrasiveQuality: 'GMA Garnet 80 (0.92)',
        nozzleDiameter: 0.889,
        abrasiveFlow: 350,
        toolDiameter: 1.000
      },
      cuttingParameters: {
        rapidLength: 800.0,
        cuttingLength: 1200.0,
        averageSpeed: 120.0,
        cuttingTime: 10.0,
        totalTime: 10.5
      },
      parts: [
        {
          name: 'Aluminum bracket',
          customer: 'ABC Manufacturing',
          quantity: 1,
          cuttingLength: 1200.0,
          weight: 2.5,
          singleTime: 10.0,
          totalTime: 10.0
        }
      ],
      estimatedTimes: {
        rapid: 0.5,
        marking: 0,
        piercing: 0,
        drilling: 0,
        cutting: 10.0,
        total: 10.5
      }
    };

    const simpleNC = `; Simple aluminum cutting test
G21 G90 G54
G00 X0 Y0 Z25.0
M08
G00 X25 Y25 Z2.0
G01 Z0 F300
G01 X75 Y25 F120
G01 X75 Y75 F120
G01 X25 Y75 F120
G01 X25 Y25 F120
G00 Z25.0
M09
M30
`;

    this.jobData.set('TEST-1234', job2);
    this.ncFiles.set('TEST-1234', simpleNC);
  }

  /**
   * Get job metadata by ID
   */
  static getJob(jobId: string): JobMetadata | null {
    return this.jobData.get(jobId) || null;
  }

  /**
   * Get NC file content by job ID
   */
  static getNCFile(jobId: string): string | null {
    return this.ncFiles.get(jobId) || null;
  }

  /**
   * Store new job data
   */
  static storeJob(jobId: string, job: JobMetadata, ncFile: string): void {
    this.jobData.set(jobId, job);
    this.ncFiles.set(jobId, ncFile);
  }

  /**
   * List all available job IDs
   */
  static listJobs(): string[] {
    return Array.from(this.jobData.keys());
  }

  /**
   * Search jobs by client or material
   */
  static searchJobs(query: string): JobMetadata[] {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.jobData.values()).filter(job => 
      job.client.toLowerCase().includes(lowercaseQuery) ||
      job.material.type.toLowerCase().includes(lowercaseQuery) ||
      job.sheetName.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Check if job exists
   */
  static jobExists(jobId: string): boolean {
    return this.jobData.has(jobId);
  }
}