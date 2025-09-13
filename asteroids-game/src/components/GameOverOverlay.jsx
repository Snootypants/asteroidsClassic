export default function GameOverOverlay({ mode, stats, onPlayAgain, onMainMenu }) {
  return (
    <div className="game-over-overlay">
      <div className="game-over-card">
        <div className="game-over-title">GAME OVER</div>
        <div className="game-over-stats">
          {mode === 'waves' ? (
            <>
              <div className="stat-line">
                <span className="stat-label">Wave Reached:</span>
                <span className="stat-value">{stats.wave}</span>
              </div>
              <div className="stat-line">
                <span className="stat-label">Level Reached:</span>
                <span className="stat-value">{stats.level}</span>
              </div>
            </>
          ) : (
            <>
              <div className="stat-line">
                <span className="stat-label">Time Survived:</span>
                <span className="stat-value">{stats.timeString}</span>
              </div>
              <div className="stat-line">
                <span className="stat-label">Level Reached:</span>
                <span className="stat-value">{stats.level}</span>
              </div>
            </>
          )}
          <div className="stat-line">
            <span className="stat-label">Final Score:</span>
            <span className="stat-value">{stats.score}</span>
          </div>
        </div>
        <div className="game-over-buttons">
          <button className="game-over-btn" onClick={onPlayAgain}>
            Play Again
          </button>
          <button className="game-over-btn" onClick={onMainMenu}>
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}