import React from 'react';

export default function HUD({ xp, xpMax, level, lives, wave, time, currency, minimapRef }) {
  const pct = Math.max(0, Math.min(1, xpMax ? xp / xpMax : 0));

  return (
    <div className="hudRoot">
      <div className="xpBar">
        <div className="xpFill" style={{ width: `${pct * 100}%` }} />
        <div className="xpText">{`${xp} / ${xpMax} XP`}</div>
      </div>

      <div className="hudPanels">
        <div className="hudPanel">
          <div className="hudColumn">
            <div className="hudLabel">Level</div>
            <div className="hudValue">{level}</div>
          </div>
          <div className="hudColumn">
            <div className="hudLabel">Lives</div>
            <div className="hudValue">{lives}</div>
          </div>
          <div className="hudColumn">
            <div className="hudLabel">Currency</div>
            <div className="hudValue">{currency}</div>
          </div>
        </div>

        <div className="hudPanel hudMinimap">
          <canvas ref={minimapRef} width={140} height={80} />
        </div>

        <div className="hudPanel">
          <div className="hudColumn">
            <div className="hudLabel">Wave</div>
            <div className="hudValue">{wave}</div>
          </div>
          <div className="hudColumn">
            <div className="hudLabel">Time</div>
            <div className="hudValue mono">{time}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
