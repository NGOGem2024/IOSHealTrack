import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
// import HomeStackNavigator from "../HomeStackNavigator";
// import PatientRegister from "../PatientRegister";
// import DoctorProfileEdit from "../DoctorProfileUpdate";
// import LogoutScreen from "./Logout";
// import { RootTabParamList } from "../../types/types";

//const Tab = createBottomTabNavigator<RootTabParamList>();

const TabScreen: React.FC = () => {
  return (
    <>hii</>
    // <Tab.Navigator
    //   initialRouteName="HomeStackNavigator"
    //   screenOptions={{
    //     tabBarActiveTintColor: "black",
    //     tabBarInactiveTintColor: "gray",
    //     tabBarActiveBackgroundColor: "white",
    //     tabBarInactiveBackgroundColor: "white",
    //     tabBarShowLabel: false,
    //     tabBarStyle: {
    //       borderTopWidth: 1,
    //       borderTopColor: "#E2E8F0",
    //       height: 60,
    //       paddingBottom: 5,
    //     },
    //   }}
    // >
    //   <Tab.Screen
    //     name="HomeStackNavigator"
    //     component={HomeStackNavigator}
    //     options={{
    //       headerShown: false,
    //       tabBarIcon: ({ color, size }) => (
    //         <Octicons name="home" size={size} color={color} />
    //       ),
    //     }}
    //   />
    //   <Tab.Screen
    //     name="AddPatient"
    //     component={PatientRegister}
    //     options={{
    //       headerShown: false,
    //       tabBarIcon: ({ color, size }) => (
    //         <Octicons name="plus-circle" size={size} color={color} />
    //       ),
    //     }}
    //   />
    //   <Tab.Screen
    //     name="DoctorProfileEdit"
    //     component={DoctorProfileEdit}
    //     options={{
    //       headerShown: false,
    //       tabBarIcon: ({ color, size }) => (
    //         <Octicons name="person" size={size} color={color} />
    //       ),
    //     }}
    //   />
    // </Tab.Navigator>
  );
};

export default TabScreen;
