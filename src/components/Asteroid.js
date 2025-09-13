import {
  ASTEROID_SPEED,
  ASTEROID_SIZE_LARGE,
  ASTEROID_SIZE_MEDIUM,
  ASTEROID_SIZE_SMALL,
  ASTEROID_SPLIT_SPEED_VARIANCE,
  ASTEROID_ROTATION_VARIANCE,
  ASTEROID_POINT_RANGE
} from '../utils/constants.js';

export class Asteroid {
  constructor(x, y, size = ASTEROID_SIZE_LARGE, parentVelocity = null) {
    this.x = x;
    this.y = y;
    
    // If this asteroid is split from a parent, inherit and vary the velocity
    if (parentVelocity) {
      const speedScale =
        1 - ASTEROID_SPLIT_SPEED_VARIANCE / 2 + Math.random() * ASTEROID_SPLIT_SPEED_VARIANCE;
      const angleVariation = (Math.random() - 0.5) * Math.PI; // Up to 90 degrees variation
      const parentSpeed = Math.sqrt(parentVelocity.vx * parentVelocity.vx + parentVelocity.vy * parentVelocity.vy);
      const parentAngle = Math.atan2(parentVelocity.vy, parentVelocity.vx);
      const newAngle = parentAngle + angleVariation;
      const newSpeed = parentSpeed * speedScale;
      
      this.vx = Math.cos(newAngle) * newSpeed;
      this.vy = Math.sin(newAngle) * newSpeed;
    } else {
      this.vx = (Math.random() - 0.5) * ASTEROID_SPEED * 2;
      this.vy = (Math.random() - 0.5) * ASTEROID_SPEED * 2;
    }
    
    this.size = size;
    this.angle = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * ASTEROID_ROTATION_VARIANCE;
    
    // Generate random shape variations
    this.points = 8 + Math.floor(Math.random() * ASTEROID_POINT_RANGE); // 8-11 points
    this.radiusVariations = [];
    for (let i = 0; i < this.points; i++) {
      this.radiusVariations.push(0.7 + Math.random() * 0.6); // 0.7 to 1.3 of base radius
    }
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.angle += this.rotationSpeed;
    return this;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.beginPath();
    
    for (let i = 0; i < this.points; i++) {
      const angle = (i / this.points) * Math.PI * 2;
      const radius = this.size * this.radiusVariations[i];
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    
    ctx.closePath();
    ctx.strokeStyle = 'white';
    ctx.stroke();
    ctx.restore();
  }

  split() {
    const parentVel = { vx: this.vx, vy: this.vy };
    
    if (this.size === ASTEROID_SIZE_LARGE) {
      return [
        new Asteroid(this.x, this.y, ASTEROID_SIZE_MEDIUM, parentVel),
        new Asteroid(this.x, this.y, ASTEROID_SIZE_MEDIUM, parentVel)
      ];
    } else if (this.size === ASTEROID_SIZE_MEDIUM) {
      return [
        new Asteroid(this.x, this.y, ASTEROID_SIZE_SMALL, parentVel),
        new Asteroid(this.x, this.y, ASTEROID_SIZE_SMALL, parentVel)
      ];
    }
    return [];
  }
}
