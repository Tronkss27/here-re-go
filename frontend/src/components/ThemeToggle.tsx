import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className={`relative transition-all duration-300 hover:scale-105 ${className}`}
      title={`Cambia a tema ${theme === 'light' ? 'scuro' : 'chiaro'}`}
    >
      <Sun 
        className={`h-[1.2rem] w-[1.2rem] transition-all duration-300 ${
          theme === 'dark' ? 'rotate-90 scale-0' : 'rotate-0 scale-100'
        }`} 
      />
      <Moon 
        className={`absolute h-[1.2rem] w-[1.2rem] transition-all duration-300 ${
          theme === 'light' ? 'rotate-90 scale-0' : 'rotate-0 scale-100'
        }`} 
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

export default ThemeToggle; 