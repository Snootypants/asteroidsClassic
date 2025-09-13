import { SHIP_SIZE, SHIP_SPEED } from '../utils/constants.js';

export class Ship {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.size = SHIP_SIZE;
    this.speed = SHIP_SPEED;
    this.invulnerable = false;
    this.invulnerableUntil = 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    
    // Flash when invulnerable
    if (this.invulnerable && Date.now() % 200 < 100) {
      ctx.globalAlpha = 0.3;
    }
    
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
