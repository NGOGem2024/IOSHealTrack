import React from 'react';
import {ThemeProvider} from './src/screens/ThemeContext';
import {SessionProvider} from './src/context/SessionContext';
import AppNavigator from './AppNavigatior';
import Toast from 'react-native-toast-message';

const App: React.FC = () => (
  <SessionProvider>
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
    <Toast />
  </SessionProvider>
);

export default App;
