import React from 'react';
import { HUD_GUTTER_PX } from '../utils/constants.js';

export default function XpBar({ xp, xpNeeded, level }) {
  const progress = Math.min(xp / xpNeeded, 1);

  return (
    <div style={{
      position: 'absolute',
      top: `-${HUD_GUTTER_PX}px`,
      left: 0,
      right: 0,
      height: '15px',
      background: 'rgba(0, 0, 0, 0.5)',
      border: '2px solid rgba(255, 255, 255, 0.2)',
      zIndex: 25
    }}>
      <div style={{
        position: 'absolute',
        top: '2px',
        left: '2px',
        right: '2px',
        bottom: '2px',
        background: 'rgba(255, 255, 255, 0.2)'
      }} />
      <div style={{
        position: 'absolute',
        top: '2px',
        left: '2px',
        bottom: '2px',
        width: `${Math.max(0, (progress * 100) - 0.4)}%`,
        background: 'linear-gradient(90deg, #4CAF50 0%, #8BC34A 50%, #CDDC39 100%)',
        transition: 'width 0.3s ease'
      }} />
    </div>
  );
}