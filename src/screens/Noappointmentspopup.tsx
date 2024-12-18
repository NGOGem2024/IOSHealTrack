import React from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface NoAppointmentsPopupProps {
  visible: boolean;
}

const NoAppointmentsPopup: React.FC<NoAppointmentsPopupProps> = ({visible}) => {
  const styles = getStyles();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, scaleAnim]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.noAppointmentsPopup, {transform: [{scale: scaleAnim}]}]}>
      <Icon name="calendar-outline" size={50} color="#119FB3" />
      <Text style={styles.noAppointmentsTitle}>No Appointments Today</Text>
      <Text style={styles.noAppointmentsText}>
        Enjoy your free time or catch up on other tasks!
      </Text>
    </Animated.View>
  );
};

const getStyles = () =>
  StyleSheet.create({
    noAppointmentsPopup: {
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      marginBottom: 10,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    noAppointmentsTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#119FB3',
      marginTop: 10,
      marginBottom: 5,
    },
    noAppointmentsText: {
      fontSize: 16,
      color: '#000000',
      textAlign: 'center',
      marginTop: 5,
    },
  });

export default NoAppointmentsPopup;
