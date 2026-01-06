
export enum NicheType {
  GAMING = 'Gaming',
  TECH = 'Tech & Gadgets',
  FINANCE = 'Finance & Money',
  LIFESTYLE = 'Lifestyle & Vlog',
  EDUCATION = 'Education & Tutorials',
  ENTERTAINMENT = 'Entertainment & Movies',
  FITNESS = 'Fitness & Health',
  COOKING = 'Cooking & Food',
  MUSIC = 'Music & Performance'
}

export enum VisualStyle {
  CINEMATIC = 'Cinematic',
  MINIMALIST = 'Minimalist',
  HIGH_CONTRAST = 'High Contrast',
  CARTOON = 'Cartoon/Vector',
  THREE_D = '3D Render',
  GLOWING = 'Glowing/Neon'
}

export enum EmotionalVibe {
  EXCITED = 'Excited/Hype',
  SHOCKED = 'Shocked/Surprised',
  MYSTERIOUS = 'Mysterious/Dark',
  PROFESSIONAL = 'Professional/Trustworthy',
  ANGRY = 'Angry/Intense',
  HAPPY = 'Happy/Warm'
}

export interface GeneratorConfig {
  niche: NicheType;
  topic: string;
  style: VisualStyle;
  vibe: EmotionalVibe;
  primaryColor: string;
  accentColor: string;
}

export interface TextOverlay {
  id: string;
  text: string;
  font: string;
  textColor: string;
  textOutline: string;
  fontSize: number;
  posX: number; // 0-100 percentage
  posY: number; // 0-100 percentage
}

export interface GeneratedResult {
  prompt: string;
  explanation: string;
  imageUrl?: string;
}
