import Toast from 'react-native-toast-message';
import axios from 'axios';
import React from 'react';
import {View, Text} from 'react-native';

// Custom toast config for dynamic height
export const toastConfig = {
  success: (props: any) => (
    <View
      style={{
        height: 'auto',
        minHeight: 60,
        maxHeight: 150,
        width: '90%',
        backgroundColor: '#28a745',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}>
      <View style={{flex: 1}}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 4,
          }}
          numberOfLines={1}>
          {props.text1}
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: 'white',
            lineHeight: 20,
            flexWrap: 'wrap',
          }}
          numberOfLines={0}>
          {props.text2}
        </Text>
      </View>
    </View>
  ),

  error: (props: any) => (
    <View
      style={{
        height: 'auto',
        minHeight: 60,
        maxHeight: 150,
        width: '90%',
        backgroundColor: '#dc3545',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}>
      <View style={{flex: 1}}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 4,
          }}
          numberOfLines={1}>
          {props.text1}
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: 'white',
            lineHeight: 20,
            flexWrap: 'wrap',
          }}
          numberOfLines={0}>
          {props.text2}
        </Text>
      </View>
    </View>
  ),

  info: (props: any) => (
    <View
      style={{
        height: 'auto',
        minHeight: 60,
        maxHeight: 150,
        width: '90%',
        backgroundColor: '#17a2b8',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}>
      <View style={{flex: 1}}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 4,
          }}
          numberOfLines={1}>
          {props.text1}
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: 'white',
            lineHeight: 20,
            flexWrap: 'wrap',
          }}
          numberOfLines={0}>
          {props.text2}
        </Text>
      </View>
    </View>
  ),
};

export const handleError = (error: any) => {
  let message = 'An unexpected error occurred';

  if (axios.isAxiosError(error)) {
    if (error.response) {
      message =
        error.response.data.msg || error.response.data.error || error.message;
    } else if (error.request) {
      message = 'No response received from the server';
    } else {
      message = error.message;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  Toast.show({
    type: 'error',
    text1: 'Error',
    text2: message,
    visibilityTime: 4000,
    autoHide: true,
    topOffset: 50,
    bottomOffset: 60,
  });
};

export const showSuccessToast = (message: string) => {
  Toast.show({
    type: 'success',
    text1: 'Success',
    text2: message,
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 50,
    bottomOffset: 60,
  });
};

// Optional: Create a generic toast function for reusability
export const showCustomToast = (
  type: 'success' | 'error' | 'info',
  title: string,
  message: string,
  visibilityTime: number = 3000,
) => {
  Toast.show({
    type,
    text1: title,
    text2: message,
    visibilityTime,
    autoHide: true,
    topOffset: 50,
    bottomOffset: 60,
  });
};
