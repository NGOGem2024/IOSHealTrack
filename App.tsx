import React from 'react';
import {Text, TextInput} from 'react-native';
import {ThemeProvider} from './src/screens/ThemeContext';
import {SessionProvider} from './src/context/SessionContext';
import AppNavigator from './AppNavigatior';
import Toast from 'react-native-toast-message';
import {SafeAreaProvider} from 'react-native-safe-area-context';

// Disable font scaling globally for Text and TextInput (TypeScript-safe way)
(Text as any).defaultProps = (Text as any).defaultProps || {};
(Text as any).defaultProps.allowFontScaling = false;

(TextInput as any).defaultProps = (TextInput as any).defaultProps || {};
(TextInput as any).defaultProps.allowFontScaling = false;

const App: React.FC = () => (
  <SafeAreaProvider>
    <SessionProvider>
      <ThemeProvider>
        <AppNavigator />
        <Toast />
      </ThemeProvider>
    </SessionProvider>
  </SafeAreaProvider>
);

export default App;
