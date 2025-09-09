import { SHIP_SIZE, SHIP_SPEED, SHIP_ROTATION_SPEED } from '../utils/constants.js';

export class Ship {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.size = SHIP_SIZE;
    this.speed = SHIP_SPEED;
    this.rotationSpeed = SHIP_ROTATION_SPEED;

    this.update = (keys) => {
      const newShip = { ...this };
      // Rotation
      if (keys.ArrowLeft) newShip.angle -= SHIP_ROTATION_SPEED;
      if (keys.ArrowRight) newShip.angle += SHIP_ROTATION_SPEED;

      // Thrust
      if (keys.ArrowUp) {
        newShip.vx += Math.cos(newShip.angle) * SHIP_SPEED;
        newShip.vy += Math.sin(newShip.angle) * SHIP_SPEED;
      }

      // Apply velocity
      newShip.x += newShip.vx;
      newShip.y += newShip.vy;

      // Friction
      newShip.vx *= 0.99;
      newShip.vy *= 0.99;

      return newShip;
    };

    this.draw = (ctx) => {
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
    };
  }
}
