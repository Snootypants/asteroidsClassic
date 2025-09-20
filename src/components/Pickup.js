import {
  PICKUP_ATTRACT_RADIUS,
  PICKUP_COLLECT_RADIUS,
  PICKUP_DRAG,
  PICKUP_LIFETIME_FRAMES,
  PICKUP_MAX_SPEED,
  PICKUP_POP_SPEED,
  PICKUP_HYPER_SPEED,
  PICKUP_HYPER_ACCEL,
  PICKUP_HYPER_DURATION,
  WORLD_WIDTH,
  WORLD_HEIGHT,
} from '../utils/constants.js';

export class Pickup {
  constructor({ type, value, x, y }) {
    this.type = type; // 'xp' or 'currency'
    this.value = value;
    this.x = x;
    this.y = y;

    const angle = Math.random() * Math.PI * 2;
    const speed = (0.5 + Math.random() * 0.5) * PICKUP_POP_SPEED;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.life = 0;
    this.collected = false;
    this.baseRadius = type === 'xp' ? 8 : 9;
    this.hyper = false;
    this.hyperTicks = 0;
  }

  update(ship) {
    this.life += 1;

    this.x += this.vx;
    this.y += this.vy;

    if (!this.hyper) {
      if (this.x < 0) this.x += WORLD_WIDTH;
      else if (this.x > WORLD_WIDTH) this.x -= WORLD_WIDTH;
      if (this.y < 0) this.y += WORLD_HEIGHT;
      else if (this.y > WORLD_HEIGHT) this.y -= WORLD_HEIGHT;
    }

    this.vx *= PICKUP_DRAG;
    this.vy *= PICKUP_DRAG;

    if (this.hyper) {
      this.hyperTicks += 1;
      this.vx *= PICKUP_HYPER_ACCEL;
      this.vy *= PICKUP_HYPER_ACCEL;
      if (this.hyperTicks > PICKUP_HYPER_DURATION) {
        return 'expired';
      }
    }

    if (ship) {
      const dx = ship.x - this.x;
      const dy = ship.y - this.y;
      const dist = Math.hypot(dx, dy) || 0.0001;

      if (dist < PICKUP_ATTRACT_RADIUS) {
        const strength = 0.12 * (1 - dist / PICKUP_ATTRACT_RADIUS);
        this.vx += (dx / dist) * strength;
        this.vy += (dy / dist) * strength;

        const speed = Math.hypot(this.vx, this.vy);
        if (speed > PICKUP_MAX_SPEED) {
          const scale = PICKUP_MAX_SPEED / speed;
          this.vx *= scale;
          this.vy *= scale;
        }
      }

      if (dist < PICKUP_COLLECT_RADIUS) {
        this.collected = true;
        return 'collected';
      }
    }

    if (this.life > PICKUP_LIFETIME_FRAMES) {
      return 'expired';
    }

    return 'active';
  }

  startHyperStreak(angle) {
    this.hyper = true;
    this.hyperTicks = 0;
    // Blast opposite of ship heading so it streaks off-screen
    this.vx = -Math.cos(angle) * PICKUP_HYPER_SPEED;
    this.vy = -Math.sin(angle) * PICKUP_HYPER_SPEED;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const pulse = 1 + Math.sin(this.life * 0.2) * 0.15;
    const radius = this.baseRadius * pulse;
    const innerRadius = radius * 0.45;

    const gradient = ctx.createRadialGradient(0, 0, innerRadius * 0.4, 0, 0, radius);
    if (this.type === 'xp') {
      gradient.addColorStop(0, 'rgba(156, 240, 109, 0.95)');
      gradient.addColorStop(1, 'rgba(156, 240, 109, 0.1)');
    } else {
      gradient.addColorStop(0, 'rgba(120, 200, 255, 0.95)');
      gradient.addColorStop(1, 'rgba(120, 200, 255, 0.12)');
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.type === 'xp'
      ? 'rgba(32, 56, 28, 0.85)'
      : 'rgba(26, 48, 64, 0.85)';
    ctx.beginPath();
    ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
