import React, { useEffect, useState } from 'react';
import type { PathwayNodeData } from '../sections/PathwaySection';

interface PathwayPopupProps {
  node: PathwayNodeData;
  onClose: () => void;
}

const PathwayPopup: React.FC<PathwayPopupProps> = ({ node, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      className={`pathway-popup-backdrop ${isVisible ? 'visible' : ''}`}
      onClick={handleBackdropClick}
    >
      <div className={`pathway-popup ${isVisible ? 'visible' : ''}`}>
        <button className="popup-close" onClick={handleClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="popup-content">
          <h3 className="popup-title">{node.courseName}</h3>
          
          <div className="popup-meta">
            <div className="popup-meta-item">
              <span className="meta-label">Credits:</span>
              <span className="meta-value">{node.credits}</span>
            </div>
            <div className="popup-meta-item">
              <span className="meta-label">Location:</span>
              <span className="meta-value">{node.location}</span>
            </div>
          </div>

          <div className="popup-description">
            <h4>Course Description</h4>
            <p>{node.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PathwayPopup;
