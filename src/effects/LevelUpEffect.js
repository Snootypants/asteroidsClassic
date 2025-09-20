import { LEVELUP_PARTICLES, LEVELUP_PARTICLE_SPEED, LEVELUP_PARTICLE_LIFE, LEVELUP_FLASH_DECAY, LEVELUP_FLASH_HOLD, LEVELUP_TEXT_TIME } from '../utils/constants.js';

export class LevelUpEffect {
  constructor() {
    this.active = false;
    this.flash = 0;
    this.flashHold = 0;
    this.textTimer = 0;
    this.particles = [];
    this.origin = { x: 0, y: 0 };
    this.level = 1;
  }

  trigger(x, y, level) {
    // Spawn radial particles from x,y (multicolor, varied size)
    const parts = [];
    const palette = ['#ffd966', '#ff3b30', '#37c837', '#66ccff', '#ffffff'];
    for (let i = 0; i < LEVELUP_PARTICLES; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.5 + Math.random()) * LEVELUP_PARTICLE_SPEED;
      const size = 1.5 + Math.random() * 2.5; // 1.5–4px base size
      const color = palette[Math.floor(Math.random() * palette.length)];
      parts.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: LEVELUP_PARTICLE_LIFE, color, size });
    }
    this.active = true;
    this.flash = 0.7;
    this.flashHold = LEVELUP_FLASH_HOLD;
    this.textTimer = LEVELUP_TEXT_TIME;
    this.particles = parts;
    this.origin = { x, y };
    this.level = level;
  }

  update() {
    if (!this.active) return;
    const p = this.particles;
    for (let i = p.length - 1; i >= 0; i--) {
      const part = p[i];
      part.x += part.vx;
      part.y += part.vy;
      part.vx *= 0.98;
      part.vy *= 0.98;
      part.life -= 1;
      if (part.life <= 0) p.splice(i, 1);
    }
    if (this.flashHold > 0) {
      this.flashHold -= 1;
    } else {
      this.flash = Math.max(0, this.flash - LEVELUP_FLASH_DECAY);
    }
    if (this.textTimer > 0) this.textTimer -= 1;
    if (p.length === 0 && this.flash <= 0 && this.textTimer <= 0) {
      this.active = false;
    }
  }

  draw(ctx, camera, canvasWidth, canvasHeight) {
    if (!this.active) return;
    // particles
    for (const part of this.particles) {
      const screen = camera.worldToScreen(part.x, part.y, canvasWidth, canvasHeight);
      ctx.save();
      const alpha = Math.max(0, Math.min(1, part.life / LEVELUP_PARTICLE_LIFE));
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, (part.size || 2) / camera.zoom, 0, Math.PI * 2);
      ctx.fillStyle = part.color || '#ffd966';
      ctx.fill();
      ctx.restore();
    }
    // flash overlay
    if (this.flash > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(255,255,255,${this.flash})`;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.restore();
    }
    // text centered
    if (this.textTimer > 0) {
      ctx.save();
      const baseAlpha = Math.max(0, Math.min(1, this.textTimer / LEVELUP_TEXT_TIME));
      const progress = 1 - baseAlpha; // 0→1 over lifespan
      const pulse = 0.6 + 0.4 * Math.abs(Math.sin(progress * Math.PI * 6)); // flashing
      ctx.globalAlpha = baseAlpha * pulse;
      const fontPx = 64 / camera.zoom;
      ctx.font = `${fontPx}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 4 / camera.zoom;
      const msg = `LEVEL ${this.level}`;
      const cx = canvasWidth / 2;
      const cy = canvasHeight / 2;
      ctx.strokeText(msg, cx, cy);
      ctx.fillText(msg, cx, cy);

      // Metallic sheen sweep after initial flash (start after ~15% progress)
      if (progress > 0.15) {
        const metrics = ctx.measureText(msg);
        const textWidth = metrics.width;
        const pad = 100 / camera.zoom; // extend sheen beyond text
        const startX = cx - textWidth / 2 - pad;
        const endX = cx + textWidth / 2 + pad;
        const sweep = startX + (endX - startX) * progress; // moves left→right
        const bandW = Math.max(60 / camera.zoom, textWidth * 0.08);

        const grad = ctx.createLinearGradient(sweep - bandW, 0, sweep + bandW, 0);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0.9)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.save();
        ctx.globalAlpha = baseAlpha; // respect fade-out
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = grad;
        const rectH = fontPx * 1.2;
        ctx.fillRect(startX, cy - rectH / 2, textWidth + pad * 2, rectH);
        ctx.restore();
      }
      ctx.restore();
    }
  }
}
