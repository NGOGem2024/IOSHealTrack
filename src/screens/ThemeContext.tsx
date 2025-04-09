import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from 'react';
import {useColorScheme} from 'react-native';

type ThemeName = 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark';

interface ThemeColors {
  mainColor: string | undefined;
  primary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  notification: string;
  box:string
}

interface Theme {
  name: ThemeName;
  colors: ThemeColors;
}

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: Theme;
  setTheme: (name: ThemeName) => void;
}

const lightTheme: Theme = {
  name: 'blue',
  colors: {
    primary: '#119FB3',
    background: '#FFFFFF',
    card: '#F0F0F0',
    text: '#000000',
    border: '#E0E0E0',
    notification: '#FF0000',
    box:'#F5F7FA',
    mainColor: '#007b8e'
  },
};

const darkTheme: Theme = {
  name: 'dark',
  colors: {
    primary: '#0D7A8A',
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    border: '#2C2C2C',
    notification: '#FF6B6B',
    box:'#1d2229',
    mainColor: '#007b8e'
  },
};

// Add more themes as needed
const purpleTheme: Theme = {
  name: 'purple',
  colors: {
    primary: '#8A2BE2',
    background: '#F8F0FF',
    card: '#E6D0FF',
    text: '#4B0082',
    border: '#D8BFD8',
    notification: '#FF1493',
    box:'#F5F7FA',
    mainColor: '#007b8e'
  },
};

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
  theme: lightTheme,
  setTheme: () => {},
});

const getThemeByName = (name: ThemeName): Theme => {
  switch (name) {
    case 'dark':
      return darkTheme;
    case 'blue':
      return lightTheme;
    case 'purple':
      return purpleTheme;
    // Add cases for other themes
    default:
      return lightTheme;
  }
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({children}) => {
  const colorScheme = useColorScheme();
  const [themeName, setThemeName] = useState<ThemeName>(
    colorScheme === 'dark' ? 'dark' : 'blue',
  );

  useEffect(() => {
    setThemeName(colorScheme === 'dark' ? 'dark' : 'blue');
  }, [colorScheme]);

  const toggleTheme = () => {
    setThemeName(prevName => (prevName === 'dark' ? 'blue' : 'dark'));
  };

  const setTheme = (name: ThemeName) => {
    setThemeName(name);
  };

  const theme = getThemeByName(themeName);

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode: themeName === 'dark',
        toggleTheme,
        theme,
        setTheme,
      }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => useContext(ThemeContext);

export default ThemeContext;
