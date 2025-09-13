export const renderXpBar = (ctx, level, xp, xpNeededForNextLevel) => {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  // Solid black box with golden border
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  // Inner area (black) where progress fills
  const pad = 2;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  ctx.fillStyle = '#000';
  ctx.fillRect(pad, pad, innerW, innerH);
  // Progress
  const needed = xpNeededForNextLevel(level);
  const pct = Math.max(0, Math.min(1, xp / needed));
  ctx.fillStyle = '#172fe1';
  ctx.fillRect(pad, pad, Math.floor(innerW * pct), innerH);
  // Ticks at each 1/8
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < 8; i++) {
    const x = Math.floor(innerW * i / 8) + pad;
    ctx.moveTo(x + 0.5, pad);
    ctx.lineTo(x + 0.5, pad + innerH);
  }
  ctx.stroke();
};
