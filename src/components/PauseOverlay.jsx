export default function PauseOverlay({ xp, lives, largeCount, mediumCount, smallCount, onResume, onExit }) {
  const totalAsteroids = (largeCount || 0) + (mediumCount || 0) + (smallCount || 0);
  
  return (
    <div className="pause-overlay" onClick={onResume}>
      <div className="pause-card" onClick={(e) => e.stopPropagation()}>
        <div className="pause-title">PAUSED</div>
        <div className="pause-sub">Click or press ESC to resume</div>
        <div className="pause-stats">
          <div>XP: {xp}</div>
          <div>Lives: {lives}</div>
        </div>
        <div className="pause-asteroids">
          <div className="pause-asteroids-header">
            <span className="asteroids-label">Asteroids Remaining:</span>
            <span className="asteroids-total">{totalAsteroids}</span>
          </div>
          <div className="pause-asteroids-breakdown">
            <div className="asteroid-size-group">
              <div className="asteroid-icon large"></div>
              <div className="asteroid-count-number">{largeCount || 0}</div>
              <div className="asteroid-label">Large</div>
            </div>
            <div className="asteroid-size-group">
              <div className="asteroid-icon medium"></div>
              <div className="asteroid-count-number">{mediumCount || 0}</div>
              <div className="asteroid-label">Medium</div>
            </div>
            <div className="asteroid-size-group">
              <div className="asteroid-icon small"></div>
              <div className="asteroid-count-number">{smallCount || 0}</div>
              <div className="asteroid-label">Small</div>
            </div>
          </div>
        </div>
        <div className="pause-actions">
          <button className="pause-exit-btn" onClick={onExit}>Exit to Start Menu</button>
        </div>
      </div>
    </div>
  );
}
