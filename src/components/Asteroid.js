import { ASTEROID_SPEED, ASTEROID_SIZE_LARGE, ASTEROID_SIZE_MEDIUM, ASTEROID_SIZE_SMALL } from '../utils/constants.js';

export class Asteroid {
  constructor(x, y, size = ASTEROID_SIZE_LARGE) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * ASTEROID_SPEED * 2;
    this.vy = (Math.random() - 0.5) * ASTEROID_SPEED * 2;
    this.size = size;
    this.angle = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;

    this.update = () => {
      const newAsteroid = { ...this };
      newAsteroid.x += newAsteroid.vx;
      newAsteroid.y += newAsteroid.vy;
      newAsteroid.angle += newAsteroid.rotationSpeed;
      return newAsteroid;
    };

    this.draw = (ctx) => {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.beginPath();
      const points = 8;
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const radius = this.size;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'white';
      ctx.stroke();
      ctx.restore();
    };

    this.split = () => {
      if (this.size === ASTEROID_SIZE_LARGE) {
        return [
          new Asteroid(this.x, this.y, ASTEROID_SIZE_MEDIUM),
          new Asteroid(this.x, this.y, ASTEROID_SIZE_MEDIUM)
        ];
      } else if (this.size === ASTEROID_SIZE_MEDIUM) {
        return [
          new Asteroid(this.x, this.y, ASTEROID_SIZE_SMALL),
          new Asteroid(this.x, this.y, ASTEROID_SIZE_SMALL)
        ];
      }
      return [];
    };
  }
}
