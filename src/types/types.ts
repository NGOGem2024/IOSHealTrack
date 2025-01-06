import {StackNavigationProp} from '@react-navigation/stack';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {NavigatorScreenParams} from '@react-navigation/native';

export type RootStackParamList = {
  TabNavigator: NavigatorScreenParams<RootTabParamList>;
  Register: undefined;
  Auth: undefined;
  CreateTherapyPlan: {patientId?: string};
  UpdatePatient: {patientId?: string};
  PatientRegister: undefined;
  Doctor: {doctorId?: string};
  Patient: {patientId: string; preloadedData?: any};
  TherapyHistory: {patientId?: string};
  HomeStack: undefined;
  Tabs: undefined;
  Media: undefined;
  Report: undefined;
  Logout: undefined;
  payment: {planId?: string; patientId?: string};
  AllPatients: undefined;
  EditTherapyPlan: {planId?: string};
  UpdateTherapy: {patientId?: string};
  CreateTherapy: {patientId?: string};
  DoctorDashboard: undefined;
  DoctorProfileEdit: undefined;
  DoctorRegister: undefined;
  TabScreen: {
    screen?: keyof RootTabParamList;
    params?: object;
  };
  AppointmentDetails: {appointment: any};
  AppointmentDetailsScreen: {appointment: any};
  UpdateDoctor: {doctorId?: string};
  HomeStackNavigator: undefined;
  TodaysAppointments: undefined;
  AllDoctors: undefined;
  SearchPatients: undefined;
  MyPatient: undefined;
  Settings: undefined;
  Main: undefined; // Add this for the TabNavigators
  planDetails: {planId: string};
};

export type RootTabParamList = {
  HomeStackNavigator: undefined;
  AddPatient: undefined;
  DoctorProfileEdit: undefined;
  Dashboard: undefined; // Add this for the DoctorDashboard screen
  AllPatients: undefined;
  MainStack: undefined;
  AllAppointments: undefined;
};

export type RootStackNavProps<T extends keyof RootStackParamList> = {
  navigation: StackNavigationProp<RootStackParamList, T>;
};

export type RootTabNavProps<T extends keyof RootTabParamList> = {
  navigation: BottomTabNavigationProp<RootTabParamList, T>;
};
