import React from 'react';

const DEFAULT_COUNT = 0;

export default function PauseOverlay({
  xp = 0,
  lives = 0,
  largeCount = DEFAULT_COUNT,
  mediumCount = DEFAULT_COUNT,
  smallCount = DEFAULT_COUNT,
  onResume,
  onExit,
}) {
  const totalAsteroids = (largeCount || 0) + (mediumCount || 0) + (smallCount || 0);

  const handlePanelClick = (event) => {
    event.stopPropagation();
  };

  const handleResumeClick = (event) => {
    event.stopPropagation();
    onResume?.();
  };

  const handleExitClick = (event) => {
    event.stopPropagation();
    onExit?.();
  };

  return (
    <div
      className="overlayRoot pauseOverlay"
      onClick={onResume}
      role="presentation"
    >
      <div
        className="panel modal pauseOverlay__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-overlay-title"
        onClick={handlePanelClick}
      >
        <h2 id="pause-overlay-title" className="title">Paused</h2>
        <p className="subtitle">Click outside the panel or press Esc to resume.</p>

        <div className="pauseOverlay__stats">
          <div className="pauseOverlay__statsItem">
            <span className="pauseOverlay__statsLabel">XP</span>
            <span className="pauseOverlay__statsValue">{xp}</span>
          </div>
          <div className="pauseOverlay__statsItem">
            <span className="pauseOverlay__statsLabel">Lives</span>
            <span className="pauseOverlay__statsValue">{lives}</span>
          </div>
        </div>

        <div className="pauseOverlay__asteroids">
          <div className="pauseOverlay__asteroidsHeader">
            <span>Asteroids Remaining</span>
            <span className="pauseOverlay__asteroidsCount">{totalAsteroids}</span>
          </div>
          <div className="pauseOverlay__asteroidList">
            <div className="pauseOverlay__asteroidItem">
              <span className="pauseOverlay__asteroidLabel">Large</span>
              <span className="pauseOverlay__asteroidValue">{largeCount || 0}</span>
            </div>
            <div className="pauseOverlay__asteroidItem">
              <span className="pauseOverlay__asteroidLabel">Medium</span>
              <span className="pauseOverlay__asteroidValue">{mediumCount || 0}</span>
            </div>
            <div className="pauseOverlay__asteroidItem">
              <span className="pauseOverlay__asteroidLabel">Small</span>
              <span className="pauseOverlay__asteroidValue">{smallCount || 0}</span>
            </div>
          </div>
        </div>

        <div className="pauseOverlay__actions">
          <button type="button" className="btn primary" onClick={handleResumeClick}>
            Resume
          </button>
          <button type="button" className="btn" onClick={handleExitClick}>
            Exit to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
