import React from 'react';
import { HUD_GUTTER_PX } from '../utils/constants.js';

export default function MiniMap({ children, size = 160 }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: `-${HUD_GUTTER_PX}px`,
      left: '50%',
      transform: 'translateX(-50%)',
      width: size,
      height: size,
      border: '2px solid #fff',
      boxSizing: 'border-box',
      background: 'transparent',
      pointerEvents: 'none'
    }}>
      {children}
    </div>
  );
}