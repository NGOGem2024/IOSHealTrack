import {DefaultTheme} from '@react-navigation/native';
import Color from 'color';

export const themeColors = {
  purple: {
    primary: '#6200ee',
    secondary: '#03dac6',
    background: '#f3e5f5',
    card: '#ffffff',
    text: '#000000',
    border: '#e0e0e0',
    notification: '#f50057',
    cardBackground: '#e1bee7',
    box:'#F5F7FA',
    inputBox: '#F8FAFC',
    mainColor: '#007b8e'
  },
  blue: {
    primary: '#1976d2',
    secondary: '#f0f0f0',
    background: '#fefefe',
    card: '#ffffff',
    text: '#000000',
    border: '#e0e0e0',
    notification: '#f44336',
    cardBackground: '#bbdefb',box:'#F5F7FA',
    inputBox: '#F8FAFC',
    mainColor: '#007b8e'

  },
  green: {
    primary: '#388e3c',
    secondary: '#4caf50',
    background: '#e8f5e9',
    card: '#ffffff',
    text: '#000000',
    border: '#e0e0e0',
    notification: '#ff9800',
    cardBackground: '#c8e6c9',box:'#F5F7FA',
    inputBox: '#F8FAFC',
    mainColor: '#007b8e'

  },
  orange: {
    primary: '#f57c00',
    secondary: '#ff9800',
    background: '#fff3e0',
    card: '#ffffff',
    text: '#000000',
    border: '#ffe0b2',
    notification: '#ff5722',
    cardBackground: '#ffe0b2',box:'#F5F7FA',
    inputBox: '#F8FAFC',
    mainColor: '#007b8e'

  },
  pink: {
    primary: '#c2185b',
    secondary: '#f06292',
    background: '#fce4ec',
    card: '#ffffff',
    text: '#000000',
    border: '#f8bbd0',
    notification: '#ff4081',
    cardBackground: '#f8bbd0',box:'#F5F7FA',
    inputBox: '#F8FAFC',
    mainColor: '#007b8e'


  },
  dark: {
    primary: '#bb86fc',
    secondary: '#4c4d4c',
    background: '#121212',
    card: '#1e1e1e',
    text: '#ffffff',
    border: '#333333',
    notification: '#cf6679',
    cardBackground: '#2c2c2c',
    box:'#1d2229',
    inputBox: '#1d2229',
    mainColor: '#04b6d1'
  },
};

export const getTheme = (themeName: keyof typeof themeColors) => {
  const colors = themeColors[themeName];

  // For light themes, create a lighter version of the primary color for the background
  if (themeName !== 'dark') {
    const primaryColor = Color(colors.primary);
    colors.background = primaryColor.lighten(0.9).hex();
    colors.cardBackground = primaryColor.lighten(0.7).hex();
  }

  return {
    ...DefaultTheme,
    colors: colors,
  };
};
