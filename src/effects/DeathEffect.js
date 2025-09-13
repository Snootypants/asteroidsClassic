export class DeathEffect {
  constructor() {
    this.active = false;
    this.phase = 'explosion'; // 'explosion' -> 'fade' -> 'done'
    this.explosionTimer = 0;
    this.fadeAlpha = 0;
    this.particles = [];
    this.origin = { x: 0, y: 0 };
  }

  trigger(x, y) {
    console.log('DeathEffect triggered at:', x, y);
    // Create explosion particles
    const parts = [];
    for (let i = 0; i < 60; i++) {
      const angle = (Math.PI * 2 * i) / 60 + Math.random() * 0.2;
      const speed = 2 + Math.random() * 6;
      parts.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30 + Math.random() * 20,
        size: 1 + Math.random() * 3,
        color: Math.random() > 0.5 ? '#ff4444' : '#ffaa00'
      });
    }
    this.active = true;
    this.phase = 'explosion';
    this.explosionTimer = 60; // 1 second at 60fps
    this.fadeAlpha = 0;
    this.particles = parts;
    this.origin = { x, y };
  }

  update() {
    if (!this.active) return;
    console.log('DeathEffect updating, phase:', this.phase, 'particles:', this.particles.length);

    if (this.phase === 'explosion') {
      // Update particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.life--;
        if (p.life <= 0) this.particles.splice(i, 1);
      }
      
      this.explosionTimer--;
      if (this.explosionTimer <= 0) {
        this.phase = 'fade';
      }
    } else if (this.phase === 'fade') {
      this.fadeAlpha = Math.min(1, this.fadeAlpha + 0.02); // Fade to black over ~50 frames
      if (this.fadeAlpha >= 1) {
        this.phase = 'done';
      }
    }
  }

  draw(ctx, camera, canvasWidth, canvasHeight) {
    if (!this.active) return;
    console.log('DeathEffect drawing, phase:', this.phase);

    // Draw explosion particles
    if (this.phase === 'explosion' || this.particles.length > 0) {
      this.particles.forEach(p => {
        const screenPos = camera.worldToScreen(p.x, p.y, canvasWidth, canvasHeight);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0.3, p.life / 50); // Minimum 30% opacity
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, p.size * 2, 0, Math.PI * 2); // Double size
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    // Draw fade to black
    if (this.phase === 'fade' || this.phase === 'done') {
      ctx.fillStyle = 'black';
      ctx.globalAlpha = this.fadeAlpha;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.globalAlpha = 1;
    }
  }

  isDone() {
    return this.phase === 'done';
  }

  reset() {
    this.active = false;
    this.phase = 'explosion';
    this.explosionTimer = 0;
    this.fadeAlpha = 0;
    this.particles = [];
  }
}