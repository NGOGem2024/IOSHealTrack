import React, {useState, useEffect, useRef} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSession} from './src/context/SessionContext';
import Icon from 'react-native-vector-icons/Ionicons';
import Icon2 from 'react-native-vector-icons/Feather';
import Icon3 from 'react-native-vector-icons/FontAwesome';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import CreateTherapyPlan from './src/screens/Therapyplan';
import AllPatients from './src/screens/AllPatients';
import PatientScreen from './src/screens/BottomTab/PatientScreen';
import SearchPatients from './src/screens/searchpatient';
import TherapyHistory from './src/screens/UpdateTherapy';
import DoctorScreen from './src/screens/doctorScreen';
import AllDoctors from './src/screens/AllDoctors';
import UpdatePatient from './src/screens/UpdatePatient';
import LogoutScreen from './src/screens/BottomTab/Logout';
import AuthScreen from './src/screens/Authscreen';
import SplashScreen from './src/screens/SplashScreen';
import DoctorProfileEdit from './src/screens/DoctorProfileUpdate';
import PatientRegister from './src/screens/PatientRegister';
import DoctorDashboard from './src/screens/DoctorDashboard';
import {RootStackParamList, RootTabParamList} from './src/types/types';
import EditDoctor from './src/screens/updatedoc';
import CreateTherapy from './src/screens/BottomTab/CreateTherapy';
import DoctorRegister from './src/screens/Doctorreg';
import SettingsScreen from './src/screens/settings';
import TherapyPlanDetails from './src/screens/planDetails';
import PaymentDetailsScreen from './src/screens/paymentpage';
import EditTherapyPlan from './src/screens/editPlan';
import AllAppointmentsPage from './src/screens/AllAppointmen';
import DoctorPatients from './src/screens/DoctorPatients';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AnimatedSplashScreen from './src/components/AnimatedSplashScreen';
// Import your screens...

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

// Create a stack navigator for the main content
const HomeStackNavigator = () => (
  <Stack.Navigator initialRouteName="DoctorDashboard">
    <Stack.Screen
      name="DoctorDashboard"
      component={DoctorDashboard}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="AllPatients"
      component={AllPatients}
      options={{headerShown: false}}
    />

    <Stack.Screen
      name="PatientRegister"
      component={PatientRegister}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="Logout"
      component={LogoutScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="DoctorProfileEdit"
      component={DoctorProfileEdit}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="SearchPatients"
      component={SearchPatients}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="AllDoctors"
      component={AllDoctors}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="UpdatePatient"
      component={UpdatePatient}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="Patient"
      component={PatientScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="CreateTherapy"
      component={CreateTherapy}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="CreateTherapyPlan"
      component={CreateTherapyPlan}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="planDetails"
      component={TherapyPlanDetails}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="UpdateTherapy"
      component={TherapyHistory}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="DoctorRegister"
      component={DoctorRegister}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="Settings"
      component={SettingsScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="Doctor"
      component={DoctorScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="payment"
      component={PaymentDetailsScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="UpdateDoctor"
      component={EditDoctor}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="MyPatient"
      component={DoctorPatients}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="EditTherapyPlan"
      component={EditTherapyPlan}
      options={{headerShown: false}}
    />
  </Stack.Navigator>
);

const TabNavigator = () => (
  <Tab.Navigator
    initialRouteName="HomeStackNavigator"
    screenOptions={{
      tabBarActiveTintColor: 'black',
      tabBarInactiveTintColor: 'gray',
      tabBarActiveBackgroundColor: 'white',
      tabBarInactiveBackgroundColor: 'white',
      tabBarShowLabel: false,
      tabBarStyle: {
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        height: 60,
        paddingBottom: 5,
      },
      tabBarHideOnKeyboard: true,
    }}>
    <Tab.Screen
      name="HomeStackNavigator"
      component={HomeStackNavigator}
      options={{
        headerShown: false,
        tabBarIcon: ({color, size}) => (
          <Icon name="home-outline" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen
      name="AllAppointments"
      component={AllAppointmentsPage}
      options={{
        headerShown: false,
        tabBarIcon: ({color, size}) => (
          <Icon3 name="calendar" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen
      name="AddPatient"
      component={PatientRegister}
      options={{
        headerShown: false,
        tabBarIcon: ({color, size}) => (
          <Icon name="person-add-sharp" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="DoctorProfileEdit"
      component={DoctorProfileEdit}
      options={{
        headerShown: false,
        tabBarIcon: ({color, size}) => (
          <MaterialCommunityIcons
            name="square-edit-outline"
            color={color}
            size={size}
          />
        ),
      }}
    />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const {session, isLoading} = useSession();
  const [isSplashComplete, setSplashComplete] = useState(false);
  if (isLoading) {
    return <SplashScreen />;
  }
  if (!isSplashComplete) {
    return (
      <AnimatedSplashScreen
        onAnimationComplete={() => setSplashComplete(true)}
      />
    );
  }
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          {session.isLoggedIn ? (
            <Stack.Screen name="Main" component={TabNavigator} />
          ) : (
            <Stack.Screen name="Auth" component={AuthScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default AppNavigator;
