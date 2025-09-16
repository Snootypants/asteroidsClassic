export class DeathExplosion {
  constructor() {
    this.active = false;
    this.phase = 'inactive'; // 'explosion', 'fading', 'text', 'waiting'
    this.timer = 0;
    this.particles = [];
    this.fadeOpacity = 0;
    this.textOpacity = 0;
    this.textScale = 1;
    this.explosionX = 0;
    this.explosionY = 0;
    this.onRespawn = null;
    this.shipRef = null; // Reference to ship for hiding
  }

  trigger(x, y, respawnCallback, shipRef = null, isGameOver = false) {
    this.active = true;
    this.phase = 'explosion';
    this.timer = 0;
    this.fadeOpacity = 0;
    this.textOpacity = 0;
    this.textScale = 1;
    this.explosionX = x;
    this.explosionY = y;
    this.onRespawn = respawnCallback;
    this.shipRef = shipRef;
    this.isGameOver = isGameOver;

    // Immediately hide the ship
    if (this.shipRef && this.shipRef.current) {
      this.shipRef.current.isDestroyed = true;
    }

    // Create explosion particles
    this.particles = [];
    const particleCount = 80; // Doubled for density
    const colors = ['#ff3030', '#ff6030', '#ff9030', '#ffff30', '#ffffff'];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = 8 + Math.random() * 15;
      const size = 1.5 + Math.random() * 5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const isLine = Math.random() < 0.3; // 30% chance for line particles

      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: size,
        color: color,
        life: 60 + Math.random() * 30, // 60-90 frames
        maxLife: 60 + Math.random() * 30,
        isLine: isLine,
        length: isLine ? 8 + Math.random() * 12 : 0, // Line length
        angle: angle // Store angle for line direction
      });
    }

    // Add additional scattered particles for more density
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8;
      const size = 1 + Math.random() * 3;
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.particles.push({
        x: x + (Math.random() - 0.5) * 20, // Slight scatter from center
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: size,
        color: color,
        life: 45 + Math.random() * 25,
        maxLife: 45 + Math.random() * 25,
        isLine: false,
        length: 0,
        angle: 0
      });
    }
  }

  update() {
    if (!this.active) return;

    this.timer++;

    switch (this.phase) {
      case 'explosion': {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
          const particle = this.particles[i];
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vx *= 0.95; // Slow down over time
          particle.vy *= 0.95;
          particle.life--;

          if (particle.life <= 0) {
            this.particles.splice(i, 1);
          }
        }

        // After 45 frames, start fading
        if (this.timer >= 45) {
          this.phase = 'fading';
          this.timer = 0;
        }
        break;
      }

      case 'fading': {
        // Fade to black over 30 frames
        this.fadeOpacity = Math.min(1, this.timer / 30);

        if (this.timer >= 30) {
          this.phase = 'text';
          this.timer = 0;
          this.particles = []; // Clear remaining particles
        }
        break;
      }

      case 'text': {
        // Text animation over 30 frames
        const textProgress = Math.min(this.timer / 30, 1);
        this.textOpacity = textProgress;

        // Scale animation - start big and settle to normal
        if (textProgress < 0.5) {
          this.textScale = 1.5 - (0.5 * textProgress * 2);
        } else {
          this.textScale = 1;
        }

        if (this.timer >= 30) {
          this.phase = 'waiting';
          this.timer = 0;
        }
        break;
      }

      case 'waiting': {
        // Wait for player input
        break;
      }
    }
  }

  startRespawn() {
    if (this.phase === 'waiting' && this.onRespawn) {
      // Show the ship again
      if (this.shipRef && this.shipRef.current) {
        this.shipRef.current.isDestroyed = false;
      }

      this.onRespawn();
      this.active = false;
      this.phase = 'inactive';
      this.fadeOpacity = 0;
      this.textOpacity = 0;
      this.particles = [];
      this.shipRef = null;
    }
  }

  draw(ctx, camera, canvasWidth, canvasHeight) {
    if (!this.active) return;

    // Draw explosion particles
    if (this.particles.length > 0) {
      this.particles.forEach(particle => {
        const screenPos = camera.worldToScreen(particle.x, particle.y, canvasWidth, canvasHeight);

        if (screenPos.x >= -50 && screenPos.x <= canvasWidth + 50 &&
            screenPos.y >= -50 && screenPos.y <= canvasHeight + 50) {

          ctx.save();
          const alpha = particle.life / particle.maxLife;
          ctx.globalAlpha = alpha;

          if (particle.isLine) {
            // Draw line particle
            ctx.strokeStyle = particle.color;
            ctx.lineWidth = (particle.size / 2) / camera.zoom;
            ctx.beginPath();

            const lineLength = particle.length / camera.zoom;
            const endX = screenPos.x + Math.cos(particle.angle) * lineLength;
            const endY = screenPos.y + Math.sin(particle.angle) * lineLength;

            ctx.moveTo(screenPos.x, screenPos.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
          } else {
            // Draw circle particle
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, particle.size / camera.zoom, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }
      });
    }

    // Draw fade overlay
    if (this.fadeOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = this.fadeOpacity;
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.restore();
    }

    // Draw death text (only if not game over)
    if ((this.phase === 'text' || this.phase === 'waiting') && !this.isGameOver) {
      ctx.save();
      ctx.globalAlpha = this.textOpacity;
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Main death text
      ctx.font = `${48 * this.textScale}px Arial`;
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 4;
      ctx.strokeText('You Died', canvasWidth / 2, canvasHeight / 2 - 40);
      ctx.fillText('You Died', canvasWidth / 2, canvasHeight / 2 - 40);

      // Subtitle text
      ctx.font = '24px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText('click to respawn', canvasWidth / 2, canvasHeight / 2 + 20);

      ctx.restore();
    }
  }

  // Getters for external state checks
  isActive() {
    return this.active;
  }

  isWaiting() {
    return this.phase === 'waiting';
  }
}