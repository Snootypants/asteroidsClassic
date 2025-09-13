export default function StartOverlay({ onSelect }) {
  return (
    <div className="start-overlay">
      <div className="start-card">
        <div className="start-title">ASTEROIDS</div>
        <div className="start-sub">Choose a mode</div>
        <div className="start-buttons">
          <button className="start-btn" onClick={() => onSelect('waves')}>
            Waves
            <span className="start-desc">Clear waves to advance</span>
          </button>
          <button className="start-btn" onClick={() => onSelect('survival')}>
            Survival
            <span className="start-desc">Endless — how long can you last?</span>
          </button>
        </div>
      </div>
    </div>
  );
}

