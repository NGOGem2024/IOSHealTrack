import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from 'react';
import * as Keychain from 'react-native-keychain';

import AsyncStorage from '@react-native-async-storage/async-storage';

interface Session {
  isLoggedIn: boolean;
  idToken: string | null;
  accessToken: string | null;
  is_admin: boolean;
  doctor_id: string | null;
  preferred_location: string | null;
  organization_industry: string | null;
}

interface SessionContextType {
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  logout: () => Promise<void>;
  isLoading: boolean;
  updateAccessToken: (newAccessToken: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | null>(null);

export const SessionProvider: React.FC<{children: ReactNode}> = ({
  children,
}) => {
  const [session, setSession] = useState<Session>({
    isLoggedIn: false, // Initialize as false instead of null
    idToken: null,
    accessToken: null,
    is_admin: false,
    doctor_id: null,
    preferred_location: null,
    organization_industry: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const keychainResult = await Keychain.getGenericPassword();
        const accessToken = await AsyncStorage.getItem('googleAccessToken');
        const isadmin = await AsyncStorage.getItem('is_admin');
        const doctor_id = await AsyncStorage.getItem('doctor_id');
        const is_admin = isadmin === 'true';
        const organization_industry = await AsyncStorage.getItem(
          'organization_industry',
        );
        const preferred_location = await AsyncStorage.getItem(
          'preferred_location',
        );
        if (keychainResult) {
          const idToken = keychainResult.password; // ← token is stored here
          setSession({
            isLoggedIn: true,
            idToken,
            accessToken,
            is_admin,
            doctor_id,
            preferred_location,
            organization_industry,
          });
        } else {
          setSession(prev => ({...prev, isLoggedIn: false}));
        }
      } catch (error) {
        console.error('Error loading session:', error);
        setSession(prev => ({...prev, isLoggedIn: false}));
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const logout = async () => {
    try {
      // Remove token stored in Keychain
      await Keychain.resetGenericPassword();

      // Remove other data from AsyncStorage
      await AsyncStorage.removeItem('is_admin');
      await AsyncStorage.removeItem('doctor_id');
      await AsyncStorage.removeItem('googleAccessToken');
      await AsyncStorage.removeItem('LiveTokens');
      await AsyncStorage.removeItem('doctor_photo');
      await AsyncStorage.removeItem('expires_in');
      await AsyncStorage.removeItem('organization_industry');
      await AsyncStorage.removeItem('preferred_location');
      // Reset session state
      setSession({
        isLoggedIn: false,
        idToken: null,
        accessToken: null,
        is_admin: false,
        doctor_id: null,
        preferred_location: null,
        organization_industry: null,
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
  const updateAccessToken = async (newAccessToken: string) => {
    await AsyncStorage.setItem('googleAccessToken', newAccessToken);
    setSession(prevSession => ({
      ...prevSession,
      accessToken: newAccessToken,
    }));
  };

  return (
    <SessionContext.Provider
      value={{session, setSession, logout, isLoading, updateAccessToken}}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === null) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
