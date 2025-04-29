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
  therapySessions: {planId?: string};
  Media: undefined;
  Report: undefined;
  Logout: undefined;
  payment: {planId?: string; patientId?: string};
  AllPatients: undefined;
  EditTherapyPlan: {planId?: string};
  OrganizationSettings: undefined;
  UpdateTherapy: {patientId?: string};
  CreateTherapy: {patientId?: string};
  DoctorDashboard: undefined;
  DoctorProfileEdit: undefined;
  DoctorRegister: undefined;
  TabScreen: {
    screen?: keyof RootTabParamList;
    params?: object;
  };
  forgotPassword: undefined;
  AppointmentDetails: {appointment: any};
  AppointmentDetailsScreen: {appointment: any};
  UpdateDoctor: {doctorId?: string};
  HomeStackNavigator: undefined;
  TodaysAppointments: undefined;
  AllDoctors: undefined;
  SearchPatients: undefined;
  MyPatient: undefined;
  Settings: undefined;
  Main: undefined;
  planDetails: {planId: string};
  AdminReport: undefined;
  CreateBlog: {blogId?: string; isEditing?: boolean} | undefined;
  BlogDetails: {blogId: string};
  UpdateBlog: {blogId: string};
  CreateConsultation: {patientId: string; appointmentId: string};
  AllAppointments: undefined;
  Profile: undefined;
};

export type RootTabParamList = {
  HomeStackNavigator: undefined;
  AddPatient: undefined;
  DoctorProfileEdit: undefined;
  Dashboard: undefined;
  AllPatients: undefined;
  MainStack: undefined;
  SearchPatients: undefined;
  CreateBlog: {blogId?: string; isEditing?: boolean} | undefined;
  BlogDetails: {blogId: string};
  Patient: {patientId: string};
  AllAppointments: undefined;
  Profile: undefined;
  AllAppointmentsStack: undefined;
  ProfileStack: undefined;
};

export type RootStackNavProps<T extends keyof RootStackParamList> = {
  navigation: StackNavigationProp<RootStackParamList, T>;
};

export type RootTabNavProps<T extends keyof RootTabParamList> = {
  navigation: BottomTabNavigationProp<RootTabParamList, T>;
};
