import React from 'react';
import { HUD_GUTTER_PX } from '../utils/constants.js';

export default function HudInfo({
  lives,
  level,
  xp,
  xpNeeded,
  bulletCount,
  gameOver,
  gameStarted,
  onStartGame,
  mode,
  waveNumber,
  formattedTime
}) {
  return (
    <>
      <div style={{
        position: 'absolute',
        bottom: `-${HUD_GUTTER_PX}px`,
        left: '16px',
        display: 'flex',
        gap: '24px',
        fontSize: '20px',
        fontWeight: 'bold',
        color: 'white',
        pointerEvents: 'none'
      }}>
        <div>XP: {xp}/{xpNeeded}</div>
        <div>Level: {level}</div>
        <div>Lives: {lives}</div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: `-${HUD_GUTTER_PX}px`,
        right: '16px',
        fontSize: '20px',
        fontWeight: 'bold',
        color: 'white',
        pointerEvents: 'none'
      }}>
        {mode === 'waves' ? `Wave: ${waveNumber || 1}` : `Time: ${formattedTime || '00:00:00'}`}
      </div>

      <div data-testid="bullet-count" style={{ display: 'none' }}>{bulletCount}</div>

      {gameOver && (
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 12, fontSize: 24 }}>Game Over</div>
          {gameStarted && <button onClick={onStartGame}>New Game</button>}
        </div>
      )}
    </>
  );
}