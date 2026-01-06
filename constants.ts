
import { NicheType, VisualStyle, EmotionalVibe, GeneratorConfig, TextOverlay } from './types';

export const NICHES = Object.values(NicheType);
export const STYLES = Object.values(VisualStyle);
export const VIBES = Object.values(EmotionalVibe);

export const DEFAULT_CONFIG: GeneratorConfig = {
  niche: NicheType.GAMING,
  topic: '',
  style: VisualStyle.CINEMATIC,
  vibe: EmotionalVibe.EXCITED,
  primaryColor: '#2563eb', // Blue
  accentColor: '#f59e0b'  // Amber
};

export const createDefaultText = (id: string, text: string = 'NEW TEXT'): TextOverlay => ({
  id,
  text,
  font: 'Bebas Neue',
  textColor: '#ffffff',
  textOutline: '#000000',
  fontSize: 120,
  posX: 50,
  posY: 50
});

export const TEXT_PRESETS = [
  { name: 'Viral Red', text: '#ffffff', outline: '#ff0000', font: 'Bebas Neue' },
  { name: 'Neon Glow', text: '#00ffff', outline: '#0000ff', font: 'Montserrat' },
  { name: 'Clean White', text: '#ffffff', outline: '#000000', font: 'Inter' },
  { name: 'Gold Impact', text: '#facc15', outline: '#78350f', font: 'Poppins' },
  { name: 'Nightmare', text: '#ef4444', outline: '#000000', font: 'Montserrat' },
];

export const FONTS = ['Bebas Neue', 'Montserrat', 'Poppins', 'Inter'];
