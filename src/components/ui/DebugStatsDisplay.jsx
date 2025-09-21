import { formatCountdown } from '../../utils/time.js';

function DebugStatsDisplay({
  visible,
  selections,
  frameRate,
  asteroidCounts,
  uiState,
  bulletCount,
  xpRequired,
  stageNumber,
}) {
  if (!visible) return null;

  const items = [];
  const { large = 0, medium = 0, small = 0 } = asteroidCounts ?? {};
  const totalAsteroids = large + medium + small;

  if (selections.fps) {
    items.push({ label: 'FPS', value: frameRate ? `${frameRate}` : '—' });
  }

  if (selections.asteroids) {
    items.push({
      label: 'Asteroids',
      value: `${totalAsteroids} (L${large}/M${medium}/S${small})`,
    });
  }

  if (selections.lives) {
    items.push({ label: 'Lives', value: `${uiState.lives}` });
  }

  if (selections.level) {
    items.push({ label: 'Level', value: `${uiState.level}` });
  }

  if (selections.xp) {
    const xpReadout = xpRequired != null
      ? `${uiState.xp} / ${xpRequired}`
      : `${uiState.xp}`;
    items.push({ label: 'XP', value: xpReadout });
  }

  if (selections.currency) {
    items.push({ label: 'Currency', value: `${uiState.currency}` });
  }

  if (selections.wave) {
    const waveValue = uiState.mode === 'waves'
      ? `Wave ${stageNumber ?? 1}`
      : uiState.mode === 'survival'
        ? 'Survival'
        : '—';
    items.push({ label: 'Wave/Mode', value: waveValue });
  }

  if (selections.hyper) {
    const countdownText = uiState.hyperCountdownMs > 0
      ? formatCountdown(uiState.hyperCountdownMs)
      : 'Ready';
    items.push({ label: 'Hyper Jump', value: countdownText });
  }

  if (selections.bullets) {
    items.push({ label: 'Bullets', value: `${bulletCount}` });
  }

  if (!items.length) return null;

  return (
    <div className="debugStats">
      {items.map(item => (
        <div key={item.label} className="debugStats__item">
          <span className="debugStats__label">{item.label}</span>
          <span className="debugStats__value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export default DebugStatsDisplay;
