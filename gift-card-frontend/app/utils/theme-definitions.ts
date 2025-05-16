// Theme definitions for gift cards
export interface GiftCardTheme {
  id: number;
  name: string;
  displayName: string;
  color: string;
  gradient: string;
  icon?: string;
  backgroundColor?: string;
  textColor?: string;
}

// Card templates
export const cardTemplates = [
  { 
    id: 0, 
    name: 'classic', 
    displayName: 'Classic',
    color: '#000000', 
    gradient: 'linear-gradient(to right, #000000, #434343)',
    icon: '✦',
    backgroundColor: '#121212',
    textColor: 'white'
  },
  { 
    id: 1, 
    name: 'ocean', 
    displayName: 'Ocean',
    color: '#1a4b77', 
    gradient: 'linear-gradient(to right, #1a4b77, #2c7da0)',
    icon: '🌊',
    backgroundColor: '#1e5f8f',
    textColor: 'white'
  },
  { 
    id: 2, 
    name: 'forest', 
    displayName: 'Forest',
    color: '#2d6a4f', 
    gradient: 'linear-gradient(to right, #2d6a4f, #40916c)',
    icon: '🌳',
    backgroundColor: '#2d6a4f',
    textColor: 'white'
  },
  { 
    id: 3, 
    name: 'sunset', 
    displayName: 'Sunset',
    color: '#9d4e15', 
    gradient: 'linear-gradient(to right, #9d4e15, #f48c06)',
    icon: '🌅',
    backgroundColor: '#b95a18',
    textColor: 'white'
  },
];

// Gift card occasion themes
export const occasionThemes = [
  { 
    id: 10, 
    name: 'birthday', 
    displayName: 'Birthday',
    color: '#8338ec', 
    gradient: 'linear-gradient(to right, #8338ec, #3a86ff)',
    icon: '🎂',
    backgroundColor: '#8338ec',
    textColor: 'white'
  },
  { 
    id: 11, 
    name: 'congratulations', 
    displayName: 'Congratulations',
    color: '#ffd166', 
    gradient: 'linear-gradient(to right, #ffd166, #ef476f)',
    icon: '🎉',
    backgroundColor: '#ffd166',
    textColor: 'black'
  },
  { 
    id: 12, 
    name: 'thank_you', 
    displayName: 'Thank You',
    color: '#06d6a0', 
    gradient: 'linear-gradient(to right, #06d6a0, #1b9aaa)',
    icon: '🙏',
    backgroundColor: '#06d6a0',
    textColor: 'black'
  },
  { 
    id: 13, 
    name: 'holidays', 
    displayName: 'Holidays',
    color: '#d62828', 
    gradient: 'linear-gradient(to right, #d62828, #003049)',
    icon: '🎄',
    backgroundColor: '#d62828',
    textColor: 'white'
  },
];

// Combined themes
export const allThemes = [...cardTemplates, ...occasionThemes];

// Helper to get a theme by ID
export function getThemeById(id: number): GiftCardTheme {
  return allThemes.find(theme => theme.id === id) || allThemes[0];
}

// Helper to get a theme by name
export function getThemeByName(name: string): GiftCardTheme {
  return allThemes.find(theme => theme.name === name) || allThemes[0];
} 