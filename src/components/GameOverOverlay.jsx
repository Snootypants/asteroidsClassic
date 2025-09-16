export default function GameOverOverlay({
  level,
  mode,
  stageRef,
  formattedTime,
  onMainMenu,
  onPlayAgain
}) {
  return (
    <div className="pause-overlay">
      <div className="pause-card">
        <div className="pause-title">GAME OVER</div>
        <div className="pause-stats" style={{ marginTop: 20 }}>
          <div>Level Reached: {level}</div>
        </div>
        <div className="pause-stats">
          {mode === 'waves' ? (
            <div>Wave Reached: {stageRef.current}</div>
          ) : (
            <div>Time Survived: {formattedTime}</div>
          )}
        </div>
        <div className="pause-actions" style={{ marginTop: 24, gap: 12 }}>
          <button className="pause-exit-btn" onClick={onMainMenu}>Main Menu</button>
          <button className="pause-exit-btn" onClick={onPlayAgain}>Play Again</button>
        </div>
      </div>
    </div>
  );
}