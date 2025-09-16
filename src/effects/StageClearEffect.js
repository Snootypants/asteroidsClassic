import { STAGE_CLEAR_SLIDE_TIME, STAGE_CLEAR_POP_TIME, STAGE_CLEAR_HOLD_TIME, STAGE_CLEAR_FADE_TIME } from '../utils/constants.js';

export class StageClearEffect {
  constructor() {
    this.active = false;
    this.phase = 'inactive'; // 'sliding', 'popping', 'holding', 'fading'
    this.timer = 0;
    this.x = 0;
    this.scale = 1;
    this.opacity = 1;
  }

  trigger() {
    this.active = true;
    this.phase = 'sliding';
    this.timer = 0;
    this.x = -400; // Start off-screen left
    this.scale = 1;
    this.opacity = 1;
  }

  update() {
    if (!this.active) return;

    this.timer++;

    switch (this.phase) {
      case 'sliding': {
        // Slide in from left to center
        const slideProgress = Math.min(this.timer / STAGE_CLEAR_SLIDE_TIME, 1);
        this.x = -400 + (400 * slideProgress); // Move from -400 to 0
        if (this.timer >= STAGE_CLEAR_SLIDE_TIME) {
          this.phase = 'popping';
          this.timer = 0;
        }
        break;
      }

      case 'popping': {
        // Pop effect (scale up then down)
        const popProgress = this.timer / STAGE_CLEAR_POP_TIME;
        if (popProgress < 0.5) {
          this.scale = 1 + (0.3 * (popProgress * 2)); // Scale up to 1.3
        } else {
          this.scale = 1.3 - (0.3 * ((popProgress - 0.5) * 2)); // Scale back to 1
        }
        if (this.timer >= STAGE_CLEAR_POP_TIME) {
          this.phase = 'holding';
          this.timer = 0;
          this.scale = 1;
        }
        break;
      }

      case 'holding': {
        // Hold at center
        if (this.timer >= STAGE_CLEAR_HOLD_TIME) {
          this.phase = 'fading';
          this.timer = 0;
        }
        break;
      }

      case 'fading': {
        // Fade out
        this.opacity = Math.max(0, 1 - (this.timer / STAGE_CLEAR_FADE_TIME));
        if (this.timer >= STAGE_CLEAR_FADE_TIME) {
          this.active = false;
          this.phase = 'inactive';
        }
        break;
      }
    }
  }

  draw(ctx, camera, canvasWidth, canvasHeight) {
    if (!this.active) return;

    ctx.save();
    ctx.globalAlpha = this.opacity;
    
    // Center of screen
    const centerX = canvasWidth / 2 + this.x;
    const centerY = canvasHeight / 2;

    // Scale transform
    ctx.translate(centerX, centerY);
    ctx.scale(this.scale, this.scale);
    
    // Draw text
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Yellow/gold outline
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 4;
    ctx.strokeText('STAGE CLEAR', 0, 0);
    
    // Bright white fill
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('STAGE CLEAR', 0, 0);
    
    // Add glow effect
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;
    ctx.fillText('STAGE CLEAR', 0, 0);
    
    ctx.restore();
  }
}