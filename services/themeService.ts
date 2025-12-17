import { Theme } from "../types";

// Helper to generate HSL color palette
const generatePalette = (h: number, s: number) => {
  return {
    50: `hsl(${h}, ${s}%, 97%)`,
    100: `hsl(${h}, ${s}%, 94%)`,
    200: `hsl(${h}, ${s}%, 86%)`,
    300: `hsl(${h}, ${s}%, 77%)`,
    400: `hsl(${h}, ${s}%, 66%)`,
    500: `hsl(${h}, ${s}%, 50%)`, // Main
    600: `hsl(${h}, ${s}%, 42%)`,
    700: `hsl(${h}, ${s}%, 34%)`,
    800: `hsl(${h}, ${s}%, 26%)`,
    900: `hsl(${h}, ${s}%, 20%)`,
    950: `hsl(${h}, ${s}%, 12%)`,
  };
};

const SHAPES = [
  { id: 'sharp', name: 'Строгий (Квадрат)', radius: '0px' },
  { id: 'soft', name: 'Мягкий (Скругленный)', radius: '0.75rem' },
  { id: 'round', name: 'Полный (Овальный)', radius: '1.5rem' },
  { id: 'blob', name: 'Органичный', radius: '1.2rem 0.4rem' },
];

const COLORS = [
  { id: 'sky', name: 'Небесный (Sky)', h: 200, s: 95 },
  { id: 'gold', name: 'Золото Византии', h: 40, s: 90 }, // Amber
  { id: 'monastic', name: 'Монашеский (Black)', h: 0, s: 0 }, // Grayscale
  { id: 'forest', name: 'Еловый Лес', h: 150, s: 60 }, // Green
  { id: 'royal', name: 'Царский Пурпур', h: 270, s: 60 }, // Purple
  { id: 'rose', name: 'Розовый Сад', h: 340, s: 80 }, // Pink
  { id: 'desert', name: 'Пустыня (Sand)', h: 30, s: 50 }, // Orange/Brown
  { id: 'ocean', name: 'Океанская Глубина', h: 220, s: 80 }, // Deep Blue
  { id: 'lavender', name: 'Лаванда', h: 250, s: 70 }, // Light Purple
  { id: 'teal', name: 'Бирюза', h: 175, s: 70 }, // Teal
  { id: 'stone', name: 'Древний Камень', h: 25, s: 10 }, // Warm Gray
  { id: 'indigo', name: 'Индиго', h: 230, s: 85 },
  { id: 'red', name: 'Пасхальный Красный', h: 350, s: 85 },
];

export const ThemeService = {
  generateThemes: (): Theme[] => {
    const themes: Theme[] = [];
    
    COLORS.forEach(color => {
      SHAPES.forEach(shape => {
        themes.push({
          id: `${color.id}-${shape.id}`,
          name: `${color.name} - ${shape.name}`,
          colors: generatePalette(color.h, color.s),
          borderRadius: shape.radius
        });
      });
    });
    
    return themes;
  },

  applyTheme: (theme: Theme) => {
    const root = document.documentElement;
    
    // Apply Colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--brand-${key}`, value);
    });
    
    // Apply Radius
    root.style.setProperty('--radius', theme.borderRadius);
    
    // Apply specific tweaks for "Monastic" theme (dark mode simulation logic if needed)
    if (theme.id.includes('monastic')) {
       root.style.setProperty('--app-bg', '#F5F5F5'); // Slightly darker bg for monastic
    } else {
       root.style.setProperty('--app-bg', theme.colors[50]); // Use brand-50 for background usually
    }
  }
};

export const ALL_THEMES = ThemeService.generateThemes();