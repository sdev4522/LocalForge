/**
 * LocalForge Design System Token Specification
 * Single source of truth for color palette, typography, and spacing tokens.
 */
export const theme = {
  colors: {
    bg: {
      base: '#12141A',
      panel: '#191C24',
      panelHover: '#1F2330',
      inset: '#0D0F14',
    },
    border: {
      default: '#262A34',
      strong: '#363B48',
    },
    text: {
      primary: '#EDEAE3',
      secondary: '#ACAFB8',
      muted: '#7B7F8B',
      onEmber: '#12141A',
    },
    accent: {
      ember: '#FF6A3D',
      emberHover: '#FF8259',
      emberMuted: '#8A3F26',
      copper: '#C9915B',
    },
    status: {
      success: '#3ED598',
      warning: '#F5B94D',
      error: '#FF5C5C',
      info: '#5B9DFF',
    },
  },
  fonts: {
    display: "'Space Grotesk', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
};
