import { WORLD_WIDTH, WORLD_HEIGHT, INITIAL_ASTEROID_COUNT } from '../utils/constants.js';

export class HyperSpaceJumpEffect {
  constructor() {
    this.active = false;
    this.phase = 'inactive'; // 'streaking', 'fading', 'text', 'waiting'
    this.timer = 0;
    this.fadeOpacity = 0;
    this.textOpacity = 0;
    this.textScale = 0;
    this.stageNumber = 1;
    this.asteroidCount = INITIAL_ASTEROID_COUNT;
    this.shipAngle = 0;
    this.starVelocities = [];
    this.onStageStart = null; // Callback for starting new stage
  }

  trigger(shipAngle, currentStage, currentAsteroidCount, onStageStart) {
    this.active = true;
    this.phase = 'streaking';
    this.timer = 0;
    this.fadeOpacity = 0;
    this.textOpacity = 0;
    this.textScale = 0;
    this.shipAngle = shipAngle;
    this.stageNumber = currentStage + 1;
    this.asteroidCount = Math.ceil(currentAsteroidCount * 1.2); // 20% increase, rounded up
    this.onStageStart = onStageStart;
    
    // Initialize star velocities for streaking
    this.starVelocities = [];
  }

  initStarVelocities(stars) {
    // Calculate velocities for each star based on ship direction
    const dirX = Math.cos(this.shipAngle);
    const dirY = Math.sin(this.shipAngle);
    
    this.starVelocities = stars.map(star => {
      // Stars should streak away from ship's facing direction
      const speed = 20 + Math.random() * 30; // Variable speeds for depth
      return {
        vx: -dirX * speed * (1 - star.parallax * 0.5), // Slower for distant stars
        vy: -dirY * speed * (1 - star.parallax * 0.5)
      };
    });
  }

  update() {
    if (!this.active) return;

    this.timer++;

    switch (this.phase) {
      case 'streaking':
        // Stars streak for 60 frames
        if (this.timer >= 60) {
          this.phase = 'fading';
          this.timer = 0;
        }
        break;

      case 'fading':
        // Fade to black over 30 frames
        this.fadeOpacity = Math.min(1, this.timer / 30);
        if (this.timer >= 30) {
          this.phase = 'text';
          this.timer = 0;
        }
        break;

      case 'text':
        // Text animation over 30 frames (fade in and scale)
        const progress = Math.min(this.timer / 30, 1);
        this.textOpacity = progress;
        // Pop effect similar to stage clear
        if (progress < 0.5) {
          this.textScale = 0.5 + (0.5 * progress * 2); // 0.5 to 1
        } else {
          this.textScale = 1 + (0.2 * (1 - (progress - 0.5) * 2)); // 1 to 1.2 back to 1
        }
        
        if (this.timer >= 30) {
          this.phase = 'waiting';
          this.timer = 0;
          this.textScale = 1;
        }
        break;

      case 'waiting':
        // Wait for click to start new stage
        // Click handler will call startNewStage()
        break;
    }
  }

  startNewStage() {
    if (this.phase === 'waiting' && this.onStageStart) {
      this.onStageStart(this.stageNumber, this.asteroidCount);
      this.active = false;
      this.phase = 'inactive';
      this.fadeOpacity = 0;
      this.textOpacity = 0;
    }
  }

  draw(ctx, camera, canvasWidth, canvasHeight) {
    if (!this.active) return;

    // Draw fade to black overlay
    if (this.phase === 'fading' || this.phase === 'text' || this.phase === 'waiting') {
      ctx.save();
      ctx.fillStyle = 'black';
      ctx.globalAlpha = this.fadeOpacity;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.restore();
    }

    // Draw stage text
    if ((this.phase === 'text' || this.phase === 'waiting') && this.textOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = this.textOpacity;
      
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;

      ctx.translate(centerX, centerY);
      ctx.scale(this.textScale, this.textScale);
      
      // Main stage text
      ctx.font = 'bold 72px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Blue/cyan color scheme for hyperspace
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 4;
      ctx.strokeText(`STAGE ${this.stageNumber}`, 0, -20);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`STAGE ${this.stageNumber}`, 0, -20);
      
      // Smaller "click to start" text
      ctx.font = '28px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText('click to start', 0, 40);
      
      // Add glow effect
      ctx.shadowColor = '#00FFFF';
      ctx.shadowBlur = 30;
      ctx.fillText(`STAGE ${this.stageNumber}`, 0, -20);
      
      ctx.restore();
    }
  }

  updateStars(stars) {
    if (!this.active || this.phase !== 'streaking') return;

    // Move stars based on velocities
    stars.forEach((star, i) => {
      if (this.starVelocities[i]) {
        star.x += this.starVelocities[i].vx;
        star.y += this.starVelocities[i].vy;
      }
    });
  }

  drawStars(ctx, stars, camera, canvasWidth, canvasHeight) {
    if (!this.active || this.phase !== 'streaking') return;

    // Draw streaking stars
    stars.forEach((star, i) => {
      const velocity = this.starVelocities[i];
      if (!velocity) return;

      const parallaxX = star.x - camera.x * star.parallax;
      const parallaxY = star.y - camera.y * star.parallax;
      
      const screenPos = camera.worldToScreen(parallaxX, parallaxY, canvasWidth, canvasHeight);
      
      // Calculate streak length based on velocity
      const streakLength = Math.sqrt(velocity.vx * velocity.vx + velocity.vy * velocity.vy) * 2;
      const angle = Math.atan2(velocity.vy, velocity.vx);
      
      ctx.save();
      ctx.translate(screenPos.x, screenPos.y);
      ctx.rotate(angle);
      
      // Create gradient for streak
      const gradient = ctx.createLinearGradient(0, 0, -streakLength, 0);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${star.brightness})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(-streakLength, -star.size/2, streakLength, star.size);
      
      ctx.restore();
    });
  }
}