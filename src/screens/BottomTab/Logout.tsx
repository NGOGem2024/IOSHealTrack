import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSession} from '../../context/SessionContext';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../types/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Updated import

type LogoutNavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;

const LogoutScreen = () => {
  const {logout} = useSession();
  const navigation = useNavigation<LogoutNavigationProp>();

  const handleLogout = async () => {
    await logout();
    navigation.navigate('Auth');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Icon name="power-standby" size={48} color="#4A5568" />
        </View>
        <Text style={styles.title}>Confirm Logout</Text>
        <Text style={styles.message}>
          Are you sure you want to log out of your account?
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.button, styles.cancelButton]}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleLogout}
            style={[styles.button, styles.logoutButton]}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#119FB3',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#4A5568',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#EDF2F7',
  },
  logoutButton: {
    backgroundColor: '#119FB3',
  },
  cancelButtonText: {
    color: '#4A5568',
    fontWeight: '600',
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default LogoutScreen;
