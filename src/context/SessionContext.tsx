import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Session {
  isLoggedIn: boolean;
  idToken: string | null;
  accessToken: string | null;
  is_admin: boolean;
  doctor_id: string | null;
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
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const idToken = await AsyncStorage.getItem('userToken');
        const accessToken = await AsyncStorage.getItem('googleAccessToken');
        const isadmin = await AsyncStorage.getItem('is_admin');
        const doctor_id = await AsyncStorage.getItem('doctor_id');
        const is_admin = isadmin === 'true';

        if (idToken) {
          setSession({
            isLoggedIn: true,
            idToken,
            accessToken,
            is_admin,
            doctor_id,
          });
        } else {
          // Ensure isLoggedIn is set to false if there's no idToken
          setSession(prev => ({...prev, isLoggedIn: false}));
        }
      } catch (error) {
        console.error('Error loading session:', error);
        // Ensure isLoggedIn is set to false in case of an error
        setSession(prev => ({...prev, isLoggedIn: false}));
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  const logout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('is_admin');
    await AsyncStorage.removeItem('doctor_id');
    await AsyncStorage.removeItem('googleAccessToken');
    await AsyncStorage.removeItem('LiveTokens');
    await AsyncStorage.removeItem('doctor_photo');
    await AsyncStorage.removeItem('expires_in');
    setSession({
      isLoggedIn: false,
      idToken: null,
      accessToken: null,
      is_admin: false,
      doctor_id: null,
    });
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
