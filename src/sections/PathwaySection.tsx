import React, { useState, useRef, useEffect } from 'react';
import PathwayNode from '../components/PathwayNode';
import PathwayPopup from '../components/PathwayPopup';
import './PathwaySection.css';

export interface PathwayNodeData {
  id: string;
  courseName: string;
  credits: number;
  location: string;
  description: string;
  position: number; // 0–1 along the path
}

interface PathwaySectionProps {
  nodes: PathwayNodeData[];
}

const PathwaySection: React.FC<PathwaySectionProps> = ({ nodes }) => {
  const [selectedNode, setSelectedNode] = useState<PathwayNodeData | null>(null);
  const [nodePositions, setNodePositions] = useState<{ x: number; y: number }[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [pathLength, setPathLength] = useState<number>(2200);
  const pathRef = useRef<SVGPathElement>(null);

  // Compute path length and node positions whenever nodes or path are available
  useEffect(() => {
    if (!pathRef.current) return;
    const len = Math.ceil(pathRef.current.getTotalLength());
    setPathLength(len);
    const positions = nodes.map((node) => {
      const point = pathRef.current!.getPointAtLength(Math.max(0, Math.min(1, node.position)) * len);
      return { x: point.x, y: point.y };
    });
    setNodePositions(positions);

    // reset play state when nodes change so a new Submit can replay
    setHasPlayed(false);
    setIsAnimating(false);
  }, [nodes]);

  // Listen for an external request to play the pathway animation (dispatched by MapSection submit)
  useEffect(() => {
    const handler = () => {
      if (hasPlayed) return; // already played for current nodes
      // small delay to allow scroll/paint
      setTimeout(() => {
        setIsAnimating(true);
        setHasPlayed(true);
      }, 50);
    };

    window.addEventListener('pathway:play', handler as EventListener);
    return () => window.removeEventListener('pathway:play', handler as EventListener);
  }, [hasPlayed]);

  const handleNodeClick = (node: PathwayNodeData) => {
    setSelectedNode(node);
  };

  const handleClosePopup = () => {
    setSelectedNode(null);
  };

  return (
    <div className="pathway-container">
      <h2 className="pathway-title">Your Learning Pathway</h2>
      <p className="pathway-subtitle">Follow the rainbow road to your degree</p>

      <div className="pathway-canvas">
          <svg
            viewBox="0 0 1000 600"
            preserveAspectRatio="xMidYMid meet"
            className="pathway-svg"
          >
            {/* Master geometry path (invisible) used for node placement */}
            <defs>
              {/* Glow filter for slight soft shadow */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Invisible master path used for getTotalLength()/getPointAtLength() */}
            <path
              ref={pathRef}
              id="path-master"
              d="M 50 300 Q 200 100, 400 250 T 950 300"
              fill="none"
              stroke="transparent"
              strokeWidth="12"
            />

            {/* Seven stacked stripe paths (red -> violet). They use the same d and are
                offset vertically to form a cohesive band. Rendered before markers so
                markers and overlay nodes appear on top. */}
            {[
              '#ff0033', // red (top)
              '#ff8c00', // orange
              '#ffd700', // yellow
              '#00b14f', // green
              '#00a7ff', // blue
              '#3f37c9', // indigo
              '#7b2cbf', // violet (bottom)
            ].map((color, i) => {
              const spacing = 7; // px between stripes
              const centerIndex = 3; // middle stripe index
              const offsetY = (i - centerIndex) * spacing;
              const delay = i * 0.04; // tiny per-stripe delay for cohesion

              return (
                <path
                  key={`stripe-${i}`}
                  d="M 50 300 Q 200 100, 400 250 T 950 300"
                  fill="none"
                  stroke={color}
                  strokeWidth={10}
                  strokeLinecap="round"
                  transform={`translate(0, ${offsetY})`}
                  filter="url(#glow)"
                  className={`stripe ${isAnimating ? 'animating' : ''}`}
                  style={{
                    transitionDelay: `${delay}s`,
                    strokeDasharray: pathLength,
                    strokeDashoffset: isAnimating ? 0 : pathLength,
                  }}
                />
              );
            })}

            {/* Node markers on the path (simple white circle with colored stroke) */}
            {nodePositions.map((pos, index) => (
              <circle
                key={nodes[index].id}
                cx={pos.x}
                cy={pos.y}
                r="8"
                fill="#ffffff"
                stroke="#ffffff"
                strokeWidth="3"
                className={`pathway-marker ${isAnimating ? 'visible' : ''}`}
                style={{ animationDelay: `${nodes[index].position * 2}s` }}
              />
            ))}
          </svg>

          {/* Overlay node components */}
          <div className="pathway-nodes-overlay">
            {nodePositions.map((pos, index) => (
              <PathwayNode
                key={nodes[index].id}
                data={nodes[index]}
                position={pos}
                onClick={handleNodeClick}
                animationDelay={nodes[index].position * 2}
              />
            ))}
          </div>
        </div>

        {/* Popup for selected node */}
        {selectedNode && (
          <PathwayPopup node={selectedNode} onClose={handleClosePopup} />
        )}
      </div>
  );
};

export default PathwaySection;
