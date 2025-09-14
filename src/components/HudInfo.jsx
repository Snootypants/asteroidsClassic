import React from 'react';

export default function HudInfo({
  lives,
  level,
  xp,
  xpNeeded,
  metaLayout,
  bulletCount,
  gameOver,
  gameStarted,
  onStartGame
}) {
  return (
    <>
      {/* Score/Lives under play area, 50px left of minimap */}
      <div style={{
        position: 'absolute',
        bottom: '-50px',
        left: `${metaLayout.leftHudX}px`,
        transform: 'translateX(-100%)',
        display: 'flex',
        gap: '24px',
        fontSize: '20px',
        fontWeight: 'bold',
        color: 'white'
      }}>
        <div>XP: {xp}/{xpNeeded}</div>
        <div>Lives: {lives}</div>
      </div>

      {/* Level indicator under play area, 50px right of minimap */}
      <div style={{
        position: 'absolute',
        bottom: '-50px',
        left: `${metaLayout.rightHudX}px`,
        fontSize: '20px',
        fontWeight: 'bold',
        color: 'white'
      }}>
        Level: {level}
      </div>

      {/* Hidden bullet count for testing */}
      <div data-testid="bullet-count" style={{ display: 'none' }}>{bulletCount}</div>

      {/* Game Over section */}
      <div className="hud-container">
        <div className="hud-right">
          {gameOver && <div className="game-over">Game Over</div>}
          {gameStarted && gameOver && (
            <button onClick={onStartGame} className="game-button">New Game</button>
          )}
        </div>
      </div>
    </>
  );
}