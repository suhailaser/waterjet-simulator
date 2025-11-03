import { ToolMove, Point, ParsedNCData } from '../shared/types';

/**
 * Parser for NC/G-code files specifically for waterjet cutting applications
 * Handles G00 (rapid), G01 (linear cutting), G02/G03 (circular cutting) commands
 */
export class NCParser {
  private toolState = {
    currentPosition: { x: 0, y: 0, z: 0 } as Point,
    jetOn: false,
    lastMoveType: 'rapid' as 'rapid' | 'cutting',
    feedRate: 0
  };

  /**
   * Parse NC file content and extract cutting information
   */
  parseNCFile(ncContent: string): ParsedNCData {
    const lines = ncContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const toolPath: ToolMove[] = [];
    
    let cuttingPerimeter = 0;
    let piercingCount = 0;
    let rapidLength = 0;
    let totalFeedRates: number[] = [];
    
    // Initialize bounding box
    const boundingBox = {
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity
    };

    let sequence = 0;
    let lastPosition = { ...this.toolState.currentPosition };

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      
      // Skip comments and empty lines
      if (line.startsWith(';') || line.startsWith('(') || line.trim() === '') {
        continue;
      }

      try {
        const move = this.parseGCodeLine(line, sequence, lastPosition);
        if (move) {
          toolPath.push(move);
          
          // Update statistics
          if (move.type === 'cutting') {
            cuttingPerimeter += this.calculateDistance(move.start, move.end);
            if (move.feedRate) {
              totalFeedRates.push(move.feedRate);
            }
          } else {
            rapidLength += this.calculateDistance(move.start, move.end);
          }

          // Count piercing points
          if (move.isPiercePoint) {
            piercingCount++;
          }

          // Update bounding box
          this.updateBoundingBox(boundingBox, move.start);
          this.updateBoundingBox(boundingBox, move.end);

          lastPosition = move.end;
          sequence++;
        }
      } catch (error) {
        console.warn(`Error parsing line ${lineNum + 1}: ${line}`, error);
      }
    }

    // Calculate average cutting speed
    const averageSpeed = totalFeedRates.length > 0 
      ? totalFeedRates.reduce((sum, speed) => sum + speed, 0) / totalFeedRates.length
      : 50; // Default to 50 mm/min if no feed rates found

    return {
      toolPath,
      cuttingPerimeter,
      piercingCount,
      rapidLength,
      cuttingSpeed: averageSpeed,
      boundingBox: boundingBox.minX === Infinity ? {
        minX: 0, maxX: 0, minY: 0, maxY: 0
      } : boundingBox
    };
  }

  /**
   * Parse individual G-code line
   */
  private parseGCodeLine(line: string, sequence: number, lastPosition: Point): ToolMove | null {
    const tokens = this.tokenizeGCode(line);
    
    // Extract coordinate values
    const x = this.extractCoordinate(tokens, 'X');
    const y = this.extractCoordinate(tokens, 'Y');
    const z = this.extractCoordinate(tokens, 'Z');
    const f = this.extractCoordinate(tokens, 'F');

    // Determine G command
    const gCommand = this.extractGCommand(tokens);
    
    if (!gCommand) {
      return null; // Not a movement command
    }

    const newPosition: Point = {
      x: x !== null ? x : lastPosition.x,
      y: y !== null ? y : lastPosition.y,
      z: z !== null ? z : lastPosition.z
    };

    // Determine move type
    let moveType: 'rapid' | 'cutting';
    let command: 'G00' | 'G01' | 'G02' | 'G03';
    let arc: ToolMove['arc'];

    switch (gCommand) {
      case 0:
        moveType = 'rapid';
        command = 'G00';
        break;
      case 1:
        moveType = 'cutting';
        command = 'G01';
        break;
      case 2:
        moveType = 'cutting';
        command = 'G02';
        arc = this.extractArcData(tokens, newPosition, lastPosition, true);
        break;
      case 3:
        moveType = 'cutting';
        command = 'G03';
        arc = this.extractArcData(tokens, newPosition, lastPosition, false);
        break;
      default:
        return null;
    }

    // Detect piercing points (transition from rapid to cutting)
    const isPiercePoint = (this.toolState.lastMoveType === 'rapid' && moveType === 'cutting');

    // Update tool state
    const feedRate = f !== null ? f : this.toolState.feedRate;
    this.toolState = {
      ...this.toolState,
      currentPosition: newPosition,
      feedRate,
      lastMoveType: moveType
    };

    return {
      type: moveType,
      command,
      start: { ...lastPosition },
      end: newPosition,
      feedRate: moveType === 'cutting' ? feedRate : undefined,
      arc,
      isPiercePoint,
      sequence
    };
  }

  /**
   * Tokenize G-code line
   */
  private tokenizeGCode(line: string): string[] {
    return line.toUpperCase().split(/[\s,]+/);
  }

  /**
   * Extract coordinate value from tokens
   */
  private extractCoordinate(tokens: string[], axis: string): number | null {
    const token = tokens.find(t => t.startsWith(axis));
    return token ? parseFloat(token.substring(1)) : null;
  }

  /**
   * Extract G command from tokens
   */
  private extractGCommand(tokens: string[]): number | null {
    const token = tokens.find(t => t.startsWith('G'));
    return token ? parseInt(token.substring(1)) : null;
  }

  /**
   * Extract arc data for G02/G03 commands
   */
  private extractArcData(tokens: string[], end: Point, start: Point, clockwise: boolean) {
    const i = this.extractCoordinate(tokens, 'I');
    const j = this.extractCoordinate(tokens, 'J');
    
    if (i === null || j === null) {
      return undefined;
    }

    // Calculate arc center
    const center = {
      x: start.x + i,
      y: start.y + j
    };

    // Calculate radius and angle
    const radius = Math.sqrt(i * i + j * j);
    const startAngle = Math.atan2(start.y - center.y, start.x - center.x);
    const endAngle = Math.atan2(end.y - center.y, end.x - center.x);
    
    let angle = endAngle - startAngle;
    if (clockwise) {
      if (angle > 0) angle -= 2 * Math.PI;
    } else {
      if (angle < 0) angle += 2 * Math.PI;
    }

    return {
      center,
      radius,
      angle: Math.abs(angle),
      clockwise
    };
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(p1: Point, p2: Point): number {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
  }

  /**
   * Update bounding box with a point
   */
  private updateBoundingBox(bbox: any, point: Point): void {
    bbox.minX = Math.min(bbox.minX, point.x);
    bbox.maxX = Math.max(bbox.maxX, point.x);
    bbox.minY = Math.min(bbox.minY, point.y);
    bbox.maxY = Math.max(bbox.maxY, point.y);
  }

  /**
   * Calculate cut time using the provided formula
   */
  static calculateCutTime(
    pierceCount: number,
    pierceTimePerPiece: number, // minutes
    cuttingPerimeter: number, // mm
    cuttingSpeed: number // mm/min
  ): { piercingTime: number; cuttingTime: number; totalTime: number } {
    const piercingTime = pierceCount * pierceTimePerPiece;
    const cuttingTime = cuttingPerimeter / cuttingSpeed;
    const totalTime = piercingTime + cuttingTime;

    return {
      piercingTime,
      cuttingTime,
      totalTime
    };
  }

  /**
   * Format time in minutes to HH:MM:SS
   */
  static formatTime(minutes: number): string {
    const totalSeconds = Math.round(minutes * 60);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes_remaining = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes_remaining.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}