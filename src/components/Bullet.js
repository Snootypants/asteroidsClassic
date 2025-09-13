import { BULLET_SPEED, BULLET_LIFETIME, BULLET_SIZE, BULLET_RANGE } from '../utils/constants.js';

export class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * BULLET_SPEED;
    this.vy = Math.sin(angle) * BULLET_SPEED;
    this.lifetime = BULLET_LIFETIME;
    this.size = BULLET_SIZE;
    this.distanceTraveled = 0; // Track total distance for range limit
  }

  update() {
    // Track distance before position change
    const dx = this.vx;
    const dy = this.vy;
    this.distanceTraveled += Math.sqrt(dx * dx + dy * dy);
    
    this.x += this.vx;
    this.y += this.vy;
    this.lifetime--;
    
    return this;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
  }

  isExpired() {
    return this.lifetime <= 0 || this.distanceTraveled >= BULLET_RANGE;
  }
}

