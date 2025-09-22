import React from 'react';
import StartScreen from './StartScreen.jsx';
import GameOverOverlay from './GameOverOverlay.jsx';
import PauseOverlay from './PauseOverlay.jsx';

export default function GameOverlayLayer({ uiState, session, asteroidCounts, lastRun }) {
  if (!uiState || !session) {
    return null;
  }

  const counts = asteroidCounts ?? { large: 0, medium: 0, small: 0 };
  const isPausedOverlayVisible = uiState.gameStarted && !uiState.gameOver && uiState.isPaused;

  return (
    <>
      {!uiState.gameStarted && (
        <StartScreen
          onStartWaves={() => session.handleSelectMode('waves')}
          onStartSurvival={() => session.handleSelectMode('survival')}
        />
      )}

      {uiState.gameOver && (
        <GameOverOverlay
          level={lastRun.level}
          wave={lastRun.wave}
          time={lastRun.time}
          currency={lastRun.currency}
          onMainMenu={session.handleExitToMenu}
          onPlayAgain={() => session.startGame()}
        />
      )}

      {isPausedOverlayVisible && (
        <PauseOverlay
          xp={uiState.xp}
          lives={uiState.lives}
          largeCount={counts.large}
          mediumCount={counts.medium}
          smallCount={counts.small}
          onResume={session.handleResume}
          onExit={session.handleExitToMenu}
        />
      )}
    </>
  );
}
