import { WORLD_WIDTH, WORLD_HEIGHT, INITIAL_ASTEROID_COUNT, STAR_COUNT, STAR_FIELD_MULTIPLIER, STAR_MIN_BRIGHTNESS, STAR_MAX_BRIGHTNESS, STAR_LARGE_THRESHOLD, STAR_MEDIUM_THRESHOLD, STAR_FIELD_SPREAD, MIN_PARALLAX, MAX_PARALLAX } from '../utils/constants.js';

export class HyperSpaceJumpEffect {
  constructor() {
    this.active = false;
    this.phase = 'inactive'; // 'brighten', 'streaking', 'flash', 'fading', 'shipFadeIn', 'asteroidsFadeIn', 'text', 'waiting'
    this.timer = 0;
    this.fadeOpacity = 0;
    this.flashOpacity = 0;
    this.shipOpacity = 0;
    this.asteroidsOpacity = 0;
    this.textOpacity = 0;
    this.textScale = 0;
    this.stageNumber = 1;
    this.asteroidCount = INITIAL_ASTEROID_COUNT;
    this.shipAngle = 0;
    this.starVelocities = [];
    this.starBrightness = 1; // Multiplier for star brightness
    this.streakSpeed = 0; // Acceleration factor for streaking
    this.onStageStart = null;
    this.extraStars = []; // Additional stars for the effect
  }

  trigger(shipAngle, currentStage, currentAsteroidCount, onStageStart) {
    this.active = true;
    this.phase = 'brighten';
    this.timer = 0;
    this.fadeOpacity = 0;
    this.flashOpacity = 0;
    this.shipOpacity = 1;
    this.asteroidsOpacity = 1;
    this.textOpacity = 0;
    this.textScale = 0;
    this.shipAngle = shipAngle;
    this.stageNumber = currentStage + 1;
    this.asteroidCount = Math.ceil(currentAsteroidCount * 1.2);
    this.onStageStart = onStageStart;
    this.starBrightness = 1;
    this.streakSpeed = 0;
    
    // Generate 300% more stars for dramatic effect
    this.generateExtraStars();
    this.starVelocities = [];
  }

  generateExtraStars() {
    this.extraStars = [];
    const extraStarCount = STAR_COUNT * STAR_FIELD_MULTIPLIER * 3; // 300% more
    
    for (let i = 0; i < extraStarCount; i++) {
      // Box-Muller transform for normal distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      
      let brightness = 0.5 + z0 * 0.15;
      brightness = Math.max(STAR_MIN_BRIGHTNESS, Math.min(STAR_MAX_BRIGHTNESS, brightness));
      
      this.extraStars.push({
        x: Math.random() * WORLD_WIDTH * STAR_FIELD_SPREAD,
        y: Math.random() * WORLD_HEIGHT * STAR_FIELD_SPREAD,
        brightness: brightness,
        size: brightness > STAR_LARGE_THRESHOLD ? 2 : brightness > STAR_MEDIUM_THRESHOLD ? 1.5 : 1,
        parallax: MIN_PARALLAX + Math.random() * (MAX_PARALLAX - MIN_PARALLAX)
      });
    }
  }

  initStarVelocities(stars) {
    const dirX = Math.cos(this.shipAngle);
    const dirY = Math.sin(this.shipAngle);
    
    // Combine regular stars with extra stars
    const allStars = [...stars, ...this.extraStars];
    
    this.starVelocities = allStars.map(star => {
      // Initial slow speeds that will accelerate
      const baseSpeed = 2 + Math.random() * 5;
      return {
        vx: -dirX * baseSpeed * (1 - star.parallax * 0.5),
        vy: -dirY * baseSpeed * (1 - star.parallax * 0.5),
        baseSpeed: baseSpeed
      };
    });
  }

  update() {
    if (!this.active) return;

    this.timer++;

    switch (this.phase) {
      case 'brighten':
        // Brighten stars to 400% over 20 frames
        this.starBrightness = 1 + (3 * Math.min(this.timer / 20, 1));
        if (this.timer >= 20) {
          this.phase = 'streaking';
          this.timer = 0;
        }
        break;

      case 'streaking':
        // Accelerating streak over 80 frames
        const progress = this.timer / 80;
        // Exponential acceleration curve
        this.streakSpeed = Math.pow(progress, 2) * 50;
        
        // Start fading ship halfway through
        if (this.timer > 40) {
          this.shipOpacity = Math.max(0, 1 - ((this.timer - 40) / 40));
          this.asteroidsOpacity = Math.max(0, 1 - ((this.timer - 40) / 40));
        }
        
        if (this.timer >= 80) {
          this.phase = 'flash';
          this.timer = 0;
          this.shipOpacity = 0;
          this.asteroidsOpacity = 0;
        }
        break;

      case 'flash':
        // Super fast white flash
        if (this.timer < 3) {
          this.flashOpacity = 1;
        } else {
          this.flashOpacity = Math.max(0, 1 - ((this.timer - 3) / 5));
        }
        
        if (this.timer >= 8) {
          this.phase = 'fading';
          this.timer = 0;
          this.flashOpacity = 0;
        }
        break;

      case 'fading':
        // Fade to black
        this.fadeOpacity = Math.min(1, this.timer / 20);
        if (this.timer >= 20) {
          this.phase = 'shipFadeIn';
          this.timer = 0;
          // Reset star brightness for new scene
          this.starBrightness = 1;
        }
        break;

      case 'shipFadeIn':
        // Ship fades in
        this.shipOpacity = Math.min(1, this.timer / 30);
        if (this.timer >= 30) {
          this.phase = 'asteroidsFadeIn';
          this.timer = 0;
        }
        break;

      case 'asteroidsFadeIn':
        // Asteroids fade in
        this.asteroidsOpacity = Math.min(1, this.timer / 30);
        if (this.timer >= 30) {
          this.phase = 'text';
          this.timer = 0;
        }
        break;

      case 'text':
        // Text animation
        const textProgress = Math.min(this.timer / 30, 1);
        this.textOpacity = textProgress;
        if (textProgress < 0.5) {
          this.textScale = 0.5 + (0.5 * textProgress * 2);
        } else {
          this.textScale = 1 + (0.2 * (1 - (textProgress - 0.5) * 2));
        }
        
        if (this.timer >= 30) {
          this.phase = 'waiting';
          this.timer = 0;
          this.textScale = 1;
        }
        break;

      case 'waiting':
        // Wait for click
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
      this.shipOpacity = 1;
      this.asteroidsOpacity = 1;
      this.extraStars = []; // Clear extra stars
    }
  }

  draw(ctx, camera, canvasWidth, canvasHeight) {
    if (!this.active) return;

    // Draw white flash
    if (this.phase === 'flash' && this.flashOpacity > 0) {
      ctx.save();
      ctx.fillStyle = 'white';
      ctx.globalAlpha = this.flashOpacity;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.restore();
    }

    // Draw fade to black overlay
    if ((this.phase === 'fading' || this.phase === 'shipFadeIn' || this.phase === 'asteroidsFadeIn' || 
         this.phase === 'text' || this.phase === 'waiting') && this.fadeOpacity > 0) {
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
      
      ctx.font = 'bold 72px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 4;
      ctx.strokeText(`STAGE ${this.stageNumber}`, 0, -20);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`STAGE ${this.stageNumber}`, 0, -20);
      
      ctx.font = '28px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText('click to start', 0, 40);
      
      ctx.restore();
    }
  }

  updateStars(stars) {
    if (!this.active || this.phase !== 'streaking') return;

    const dirX = Math.cos(this.shipAngle);
    const dirY = Math.sin(this.shipAngle);
    
    // Update regular stars
    stars.forEach((star, i) => {
      if (this.starVelocities[i]) {
        const vel = this.starVelocities[i];
        // Apply acceleration
        star.x += -dirX * vel.baseSpeed * this.streakSpeed * (1 - star.parallax * 0.5);
        star.y += -dirY * vel.baseSpeed * this.streakSpeed * (1 - star.parallax * 0.5);
      }
    });
    
    // Update extra stars
    this.extraStars.forEach((star, i) => {
      const velIndex = stars.length + i;
      if (this.starVelocities[velIndex]) {
        const vel = this.starVelocities[velIndex];
        star.x += -dirX * vel.baseSpeed * this.streakSpeed * (1 - star.parallax * 0.5);
        star.y += -dirY * vel.baseSpeed * this.streakSpeed * (1 - star.parallax * 0.5);
      }
    });
  }

  drawStars(ctx, stars, camera, canvasWidth, canvasHeight) {
    if (!this.active) return;
    
    const allStars = [...stars, ...this.extraStars];
    
    if (this.phase === 'brighten' || this.phase === 'streaking') {
      // Draw enhanced/streaking stars
      allStars.forEach((star, i) => {
        const velocity = this.starVelocities[i];
        
        const parallaxX = star.x - camera.x * star.parallax;
        const parallaxY = star.y - camera.y * star.parallax;
        
        const screenPos = camera.worldToScreen(parallaxX, parallaxY, canvasWidth, canvasHeight);
        
        if (this.phase === 'streaking' && velocity) {
          // Calculate streak based on acceleration
          const streakLength = this.streakSpeed * velocity.baseSpeed * 3;
          const angle = Math.atan2(-Math.sin(this.shipAngle), -Math.cos(this.shipAngle));
          
          ctx.save();
          ctx.translate(screenPos.x, screenPos.y);
          ctx.rotate(angle);
          
          // Enhanced brightness gradient
          const enhancedBrightness = Math.min(1, star.brightness * this.starBrightness);
          const gradient = ctx.createLinearGradient(0, 0, -streakLength, 0);
          gradient.addColorStop(0, `rgba(255, 255, 255, ${enhancedBrightness})`);
          gradient.addColorStop(0.5, `rgba(200, 230, 255, ${enhancedBrightness * 0.7})`);
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          
          ctx.fillStyle = gradient;
          ctx.fillRect(-streakLength, -star.size/2, streakLength, star.size * 2);
          
          ctx.restore();
        } else {
          // Brightened stars
          ctx.save();
          ctx.globalAlpha = Math.min(1, star.brightness * this.starBrightness);
          ctx.fillStyle = 'white';
          ctx.fillRect(screenPos.x, screenPos.y, star.size / camera.zoom, star.size / camera.zoom);
          ctx.restore();
        }
      });
    }
  }

  // Get current opacity values for ship and asteroids
  getShipOpacity() {
    return this.shipOpacity;
  }

  getAsteroidsOpacity() {
    return this.asteroidsOpacity;
  }
}