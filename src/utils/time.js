export function formatCountdown(ms) {
  const clamped = Math.max(0, Math.floor(ms));
  const seconds = Math.floor(clamped / 1000);
  const hundredths = Math.floor((clamped % 1000) / 10);
  return `${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
}
