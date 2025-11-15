import React from 'react';
import type { PathwayNodeData } from '../sections/PathwaySection';

interface PathwayNodeProps {
  data: PathwayNodeData;
  position: { x: number; y: number };
  onClick: (node: PathwayNodeData) => void;
  animationDelay: number;
}

const PathwayNode: React.FC<PathwayNodeProps> = ({ data, position, onClick, animationDelay }) => {
  const handleClick = () => {
    onClick(data);
  };

  // Calculate position for the info box (offset from the node)
  const infoBoxStyle = {
    left: `${(position.x / 1000) * 100}%`,
    top: `${(position.y / 600) * 100}%`,
    animationDelay: `${animationDelay}s`,
  };

  return (
    <div
      className="pathway-node"
      style={infoBoxStyle}
      onClick={handleClick}
    >
      <div className="pathway-node-info">
        <h4 className="node-title">{data.courseName}</h4>
        <div className="node-details">
          <span className="node-credits">{data.credits} credits</span>
          <span className="node-separator">•</span>
          <span className="node-location">{data.location}</span>
        </div>
      </div>
    </div>
  );
};

export default PathwayNode;
