import React, { useRef, useEffect, useState } from 'react';
import { ToolMove, ParsedNCData } from '../shared/types';

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
  ncFileContent: string;
  cuttingSpeed: number;
  parsedData: ParsedNCData;
}

interface SimulationCanvasProps {
  ncFileContent: string;
  parsedData: ParsedNCData;
  jobData: JobData;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  ncFileContent,
  parsedData,
  jobData
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Canvas dimensions
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  // Draw the entire tool path
  const drawPath = (ctx: CanvasRenderingContext2D, scale: number, offset: {x: number, y: number}) => {
    const { toolPath } = parsedData;
    
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw grid
    drawGrid(ctx, scale, offset);
    
    // Draw tool path
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    let currentPos = { x: 0, y: 0 };
    
    toolPath.forEach((move, index) => {
      const startX = currentPos.x * scale + offset.x;
      const startY = currentPos.y * scale + offset.y;
      const endX = move.end.x * scale + offset.x;
      const endY = move.end.y * scale + offset.y;
      
      // Set drawing style based on move type
      if (move.type === 'rapid') {
        ctx.strokeStyle = '#ff4444'; // Red for rapid moves
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]); // Dashed line for rapid moves
      } else {
        ctx.strokeStyle = '#4444ff'; // Blue for cutting moves
        ctx.lineWidth = 2;
        ctx.setLineDash([]); // Solid line for cutting moves
      }
      
      // Draw move
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      
      if (move.arc) {
        // Draw arc
        const centerX = move.arc.center.x * scale + offset.x;
        const centerY = move.arc.center.y * scale + offset.y;
        const startAngle = Math.atan2(startY - centerY, startX - centerX);
        const endAngle = Math.atan2(endY - centerY, endX - centerX);
        
        ctx.arc(centerX, centerY, move.arc.radius * scale, startAngle, endAngle, move.arc.clockwise);
      } else {
        // Draw straight line
        ctx.lineTo(endX, endY);
      }
      
      ctx.stroke();
      
      // Draw pierce points
      if (move.isPiercePoint) {
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(startX, startY, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add pierce point number
        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        ctx.fillText((index + 1).toString(), startX + 6, startY - 6);
      }
      
      currentPos = move.end;
    });
  };

  // Draw grid
  const drawGrid = (ctx: CanvasRenderingContext2D, scale: number, offset: {x: number, y: number}) => {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    
    const gridSize = 50 * scale; // 50mm grid
    const startX = Math.floor((-offset.x) / gridSize) * gridSize;
    const startY = Math.floor((-offset.y) / gridSize) * gridSize;
    
    for (let x = startX; x < CANVAS_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    
    for (let y = startY; y < CANVAS_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
  };

  // Animation controller
  const startAnimation = () => {
    if (isAnimating) {
      stopAnimation();
      return;
    }

    setIsAnimating(true);
    const { toolPath } = parsedData;
    let currentMoveIndex = 0;
    let lastTime = 0;

    const animate = (timestamp: number) => {
      if (!isAnimating) return;
      
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear and redraw
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      const scale = Math.min(
        CANVAS_WIDTH / (jobData.sheetSize.width * 1.2),
        CANVAS_HEIGHT / (jobData.sheetSize.height * 1.2)
      ) * zoom;
      
      const offsetX = (CANVAS_WIDTH - jobData.sheetSize.width * scale * zoom) / 2 + pan.x;
      const offsetY = (CANVAS_HEIGHT - jobData.sheetSize.height * scale * zoom) / 2 + pan.y;
      
      const scale_info = scale;
      const offset_info = { x: offsetX, y: offsetY };
      
      drawPath(ctx, scale_info, offset_info);
      
      // Draw animation progress
      if (currentMoveIndex < toolPath.length) {
        const move = toolPath[currentMoveIndex];
        
        // Draw current position
        const currentX = move.start.x * scale_info + offset_info.x;
        const currentY = move.start.y * scale_info + offset_info.y;
        
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(currentX, currentY, 5, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw current move
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        
        const endX = move.end.x * scale_info + offset_info.x;
        const endY = move.end.y * scale_info + offset_info.y;
        
        ctx.beginPath();
        ctx.moveTo(currentX, currentY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // Calculate speed for this move
        const moveDuration = move.type === 'cutting' ? 
          (1000 / animationSpeed) * 0.1 : // Faster for cutting
          (1000 / animationSpeed) * 0.05;  // Faster for rapid moves
        
        if (deltaTime > moveDuration) {
          currentMoveIndex++;
        }
      }
      
      if (currentMoveIndex < toolPath.length) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const stopAnimation = () => {
    setIsAnimating(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  // Canvas wheel handler for zoom
  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const newZoom = e.deltaY > 0 ? zoom * 0.9 : zoom * 1.1;
    setZoom(Math.max(0.1, Math.min(5, newZoom)));
  };

  // Canvas click handler for pan
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Pan
    setPan(prev => ({
      x: prev.x + (x - CANVAS_WIDTH / 2) * 0.1,
      y: prev.y + (y - CANVAS_HEIGHT / 2) * 0.1
    }));
  };

  // Redraw canvas when zoom or pan changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = Math.min(
      CANVAS_WIDTH / (jobData.sheetSize.width * 1.2),
      CANVAS_HEIGHT / (jobData.sheetSize.height * 1.2)
    ) * zoom;
    
    const offsetX = (CANVAS_WIDTH - jobData.sheetSize.width * scale * zoom) / 2 + pan.x;
    const offsetY = (CANVAS_HEIGHT - jobData.sheetSize.height * scale * zoom) / 2 + pan.y;
    
    drawPath(ctx, scale, { x: offsetX, y: offsetY });
  }, [zoom, pan, parsedData, jobData.sheetSize]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      stopAnimation();
    };
  }, []);

  return (
    <div className="simulation-canvas">
      <div className="canvas-header">
        <h3>🔧 Cutting Simulation</h3>
        <div className="canvas-controls">
          <button 
            onClick={startAnimation}
            className={`control-button ${isAnimating ? 'stop' : 'play'}`}
          >
            {isAnimating ? '⏹️ Stop' : '▶️ Play'} Animation
          </button>
          
          <div className="control-group">
            <label>Speed:</label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.5"
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
              className="speed-slider"
            />
            <span>{animationSpeed}x</span>
          </div>
          
          <div className="control-group">
            <label>Zoom:</label>
            <button onClick={() => setZoom(Math.max(0.1, zoom * 1.2))}>🔍+</button>
            <button onClick={() => setZoom(Math.max(0.1, zoom * 0.8))}>🔍-</button>
            <button onClick={() => { setZoom(1); setPan({x: 0, y: 0}); }}>🎯 Reset</button>
          </div>
        </div>
      </div>

      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleCanvasClick}
          className="cutting-canvas"
        />
        
        <div className="canvas-legend">
          <div className="legend-item">
            <div className="legend-color rapid"></div>
            <span>Rapid Moves</span>
          </div>
          <div className="legend-item">
            <div className="legend-color cutting"></div>
            <span>Cutting Moves</span>
          </div>
          <div className="legend-item">
            <div className="legend-color pierce"></div>
            <span>Pierce Points</span>
          </div>
          <div className="legend-item">
            <div className="legend-color current"></div>
            <span>Current Position</span>
          </div>
        </div>
      </div>

      <div className="canvas-stats">
        <div className="stat-item">
          <span className="stat-label">Total Moves:</span>
          <span className="stat-value">{parsedData.toolPath.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Cutting Moves:</span>
          <span className="stat-value">
            {parsedData.toolPath.filter(m => m.type === 'cutting').length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Rapid Moves:</span>
          <span className="stat-value">
            {parsedData.toolPath.filter(m => m.type === 'rapid').length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pierce Points:</span>
          <span className="stat-value">{parsedData.piercingCount}</span>
        </div>
      </div>
    </div>
  );
};