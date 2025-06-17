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
import TherapySessionsList from './src/screens/sessiondetails';
import ProfileScreen from './src/screens/ProfileScreen';
import {TouchableOpacity} from 'react-native';
import OrganizationSettingsScreen from './src/screens/OrganizationSettingsScreen';
import AdminReport from './src/screens/AdminReport';
import CreateConsultationScreen from './src/screens/CreateConsultationScreen';
import CreateBlogScreen from './src/screens/CreateBlogScreen';
import BlogDetailsScreen from './src/screens/BlogDetailsScreen';
import UpdateBlogScreen from './src/screens/UpdateBlogScreen';
import PaymentHistory from './src/screens/PaymentHistory';
import NotificationDetailScreen from './src/screens/NotificationDetailsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

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
      name="NotificationDetailScreen"
      component={NotificationDetailScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="NotificationsScreen"
      component={NotificationsScreen}
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
      name="therapySessions"
      component={TherapySessionsList}
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
      name="PaymentHistory"
      component={PaymentHistory}
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
      name="TherapyHistory"
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
    <Stack.Screen
      name="OrganizationSettings"
      component={OrganizationSettingsScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="AdminReport"
      component={AdminReport}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="CreateConsultation"
      component={CreateConsultationScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="CreateBlog"
      component={CreateBlogScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="BlogDetails"
      component={BlogDetailsScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="UpdateBlog"
      component={UpdateBlogScreen}
      options={{headerShown: false}}
    />
  </Stack.Navigator>
);
const AllAppointmentsStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="AllAppointments"
      component={AllAppointmentsPage}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="CreateConsultation"
      component={CreateConsultationScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="EditTherapyPlan"
      component={EditTherapyPlan}
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
      name="TherapyHistory"
      component={TherapyHistory}
      options={{headerShown: false}}
    />
    {/* Add more screens here if you want to navigate deeper from AllAppointments */}
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Profile"
      component={ProfileScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="DoctorProfileEdit"
      component={DoctorProfileEdit}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="CreateBlog"
      component={CreateBlogScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="BlogDetails"
      component={BlogDetailsScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="UpdateBlog"
      component={UpdateBlogScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="AdminReport"
      component={AdminReport}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="OrganizationSettings"
      component={OrganizationSettingsScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="Settings"
      component={SettingsScreen}
      options={{headerShown: false}}
    />
    {/* Add more screens like EditProfile etc. if needed */}
  </Stack.Navigator>
);

const TabNavigator = () => (
  <Tab.Navigator
    initialRouteName="HomeStackNavigator"
    screenOptions={{
      tabBarActiveTintColor: '#007B8E',
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
      options={({navigation}) => ({
        headerShown: false,
        tabBarIcon: ({color, size}) => (
          <Icon name="home-outline" color={color} size={size} />
        ),
        tabBarButton: props => (
          <TouchableOpacity
            {...props}
            onPress={() => {
              // If we're already on the HomeStack, navigate to DoctorDashboard
              // and pass params to trigger scroll to top
              navigation.navigate('HomeStackNavigator', {
                screen: 'DoctorDashboard',
                params: {
                  scrollToTop: true,
                  timestamp: Date.now(), // Force re-render
                },
              });
            }}
          />
        ),
      })}
    />
    <Tab.Screen
      name="AllAppointmentsStack"
      component={AllAppointmentsStack}
      options={{
        headerShown: false,
        tabBarIcon: ({color, size}) => (
          <Icon3 name="calendar" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen
      name="SearchPatients"
      component={SearchPatients}
      options={{
        headerShown: false,
        tabBarIcon: ({color, size}) => (
          <Icon3 name="search" color={color} size={size} />
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
      name="ProfileStack"
      component={ProfileStack}
      options={{
        headerShown: false,
        tabBarIcon: ({color, size}) => (
          <Icon name="person-circle-outline" color={color} size={30} />
        ),
      }}
    />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const {session, isLoading} = useSession();
  const [isSplashComplete, setSplashComplete] = useState(false);
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
