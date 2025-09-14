import React from 'react';

export default function LifeLostOverlay({ visible }) {
  if (!visible) return null;
  return (
    <div style={{
      position: 'absolute',
      top: '12%',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '8px 14px',
      background: 'rgba(0,0,0,0.6)',
      color: '#fff',
      fontFamily: 'system-ui, sans-serif',
      fontSize: 16,
      borderRadius: 6
    }}>
      Life Lost
    </div>
  );
}