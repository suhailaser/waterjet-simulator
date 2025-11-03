// Shared types for the waterjet simulator application

export interface JobMetadata {
  jobId: string;
  client: string;
  material: {
    type: string;
    thickness: number; // in mm
  };
  sheetName: string;
  sheetSize: {
    width: number;
    height: number;
  };
  machine: {
    name: string;
    pressure: number; // bar
    orifice: number; // mm
    abrasiveQuality: string;
    nozzleDiameter: number; // mm
    abrasiveFlow: number; // g/min
    toolDiameter: number; // mm
  };
  cuttingParameters: {
    rapidLength: number; // mm
    cuttingLength: number; // mm
    averageSpeed: number; // mm/min
    cuttingTime: number; // minutes
    totalTime: number; // minutes
  };
  parts: PartInfo[];
  estimatedTimes: {
    rapid: number; // minutes
    marking: number; // minutes
    piercing: number; // minutes
    drilling: number; // minutes
    cutting: number; // minutes
    total: number; // minutes
  };
}

export interface PartInfo {
  name: string;
  customer: string;
  quantity: number;
  cuttingLength: number; // mm
  weight: number; // kg
  singleTime: number; // minutes
  totalTime: number; // minutes
}

export interface NCFile {
  jobId: string;
  content: string;
}

export interface ParsedNCData {
  toolPath: ToolMove[];
  cuttingPerimeter: number; // mm
  piercingCount: number;
  rapidLength: number; // mm
  cuttingSpeed: number; // mm/min average
  boundingBox: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export interface ToolMove {
  type: 'rapid' | 'cutting';
  command: 'G00' | 'G01' | 'G02' | 'G03';
  start: Point;
  end: Point;
  feedRate?: number; // mm/min
  arc?: {
    center: Point;
    radius: number;
    angle: number;
    clockwise: boolean;
  };
  isPiercePoint?: boolean;
  sequence: number;
}

export interface Point {
  x: number;
  y: number;
  z?: number;
}

export interface CutTimeCalculation {
  pierceCount: number;
  pierceTimePerPiece: number; // minutes
  totalCuttingPerimeter: number; // mm
  cuttingSpeed: number; // mm/min
  calculatedCutTime: number; // minutes
  breakdown: {
    piercingTime: number;
    cuttingTime: number;
    totalTime: number;
  };
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}