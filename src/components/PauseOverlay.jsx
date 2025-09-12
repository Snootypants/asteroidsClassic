export default function PauseOverlay({ xp, lives, onResume }) {
  return (
    <div className="pause-overlay" onClick={onResume}>
      <div className="pause-card">
        <div className="pause-title">PAUSED</div>
        <div className="pause-sub">Click or press ESC to resume</div>
        <div className="pause-stats">
          <div>XP: {xp}</div>
          <div>Lives: {lives}</div>
        </div>
      </div>
    </div>
  );
}

