import { SHIP_SIZE, SHIP_SPEED, SHIP_INVULNERABILITY_MS } from '../utils/constants.js';

export class Ship {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.size = SHIP_SIZE;
    this.speed = SHIP_SPEED;
    this.invulnerableUntil = 0; // ms, same time base as update loop
  }

  isInvulnerable(nowMs) {
    return nowMs < this.invulnerableUntil;
  }

  setInvulnerableFrom(nowMs) {
    this.invulnerableUntil = nowMs + SHIP_INVULNERABILITY_MS;
  }

  resetKinematics(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    // keep angle as-is unless your design requires reset
  }

  draw(ctx, nowMs = 0) {
    // blink on 150 ms cadence while invulnerable
    if (this.isInvulnerable(nowMs)) {
      const phase = Math.floor(nowMs / 150) % 2;
      if (phase === 0) return; // skip this frame for clear blink
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.beginPath();
    ctx.moveTo(this.size, 0);
    ctx.lineTo(-this.size / 2, -this.size / 2);
    ctx.lineTo(-this.size / 2, this.size / 2);
    ctx.closePath();
    ctx.strokeStyle = 'white';
    ctx.stroke();
    ctx.restore();
  }
}