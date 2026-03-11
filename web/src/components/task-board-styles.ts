import type { CSSProperties } from 'react';

export const surfaceStyle: CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#f7fafc',
  color: '#1a202c',
};

export const panelStyle: CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
};

export const centeredPanelStyle: CSSProperties = {
  ...panelStyle,
  maxWidth: '480px',
  margin: '64px auto',
};

export const inputStyle: CSSProperties = {
  width: '100%',
  border: '1px solid #cbd5e0',
  borderRadius: '8px',
  padding: '10px 12px',
  font: 'inherit',
  boxSizing: 'border-box',
};

export const boardGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '16px',
  alignItems: 'start',
};
