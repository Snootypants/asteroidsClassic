import { BULLET_SPEED, BULLET_LIFETIME } from '../utils/constants.js';

export class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * BULLET_SPEED;
    this.vy = Math.sin(angle) * BULLET_SPEED;
    this.lifetime = BULLET_LIFETIME;
    this.size = 2;

    this.update = () => {
      const newBullet = { ...this };
      newBullet.x += newBullet.vx;
      newBullet.y += newBullet.vy;
      newBullet.lifetime--;
      return newBullet;
    };

    this.draw = (ctx) => {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
    };

    this.isExpired = () => {
      return this.lifetime <= 0;
    };
  }
}
