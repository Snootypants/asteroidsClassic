import React from 'react';

export default function StartScreen({ onStartWaves, onStartSurvival }) {
  return (
    <div className="overlayRoot">
      <div className="panel modal">
        <h1 className="title">ASTEROIDS</h1>
        <p className="subtitle">Choose a mode</p>
        <div className="row">
          <button className="btn primary" onClick={onStartWaves}>Waves</button>
          <button className="btn" onClick={onStartSurvival}>Survival</button>
        </div>
        <div className="help">
          <p className="mono">Controls: Aim with the mouse. Shoot with Space or left click.</p>
        </div>
      </div>
    </div>
  );
}
