import React from 'react';

export default function GameOverOverlay({ level, wave, time, currency, onMainMenu, onPlayAgain }) {
  return (
    <div className="overlayRoot">
      <div className="panel modal">
        <h2 className="title">GAME OVER</h2>
        <div className="statsRow">
          <div><span className="dim">Level</span> <strong>{level}</strong></div>
          <div><span className="dim">Wave</span> <strong>{wave}</strong></div>
          <div><span className="dim">Time</span> <strong className="mono">{time}</strong></div>
          <div><span className="dim">Currency</span> <strong>{currency}</strong></div>
        </div>
        <div className="row">
          <button className="btn" onClick={onMainMenu}>Main Menu</button>
          <button className="btn primary" onClick={onPlayAgain}>Play Again</button>
        </div>
      </div>
    </div>
  );
}
