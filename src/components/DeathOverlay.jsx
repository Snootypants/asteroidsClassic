export default function DeathOverlay({ mode, wave, level, timeString, livesRemaining, onContinue }) {
  return (
    <div className="death-overlay">
      <div className="death-card">
        <div className="death-title">YOU DIED</div>
        <div className="death-stats">
          {mode === 'waves' ? (
            <div className="stat-line">
              <span className="stat-label">Wave:</span>
              <span className="stat-value">{wave}</span>
            </div>
          ) : (
            <div className="stat-line">
              <span className="stat-label">Time:</span>
              <span className="stat-value">{timeString}</span>
            </div>
          )}
          <div className="stat-line">
            <span className="stat-label">Level:</span>
            <span className="stat-value">{level}</span>
          </div>
          <div className="stat-line">
            <span className="stat-label">Lives Remaining:</span>
            <span className="stat-value">{livesRemaining}</span>
          </div>
        </div>
        <button className="death-continue-btn" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}