import Toast from "react-native-toast-message";
import axios from "axios";

export const handleError = (error: any) => {
  let message = "An unexpected error occurred";

  if (axios.isAxiosError(error)) {
    if (error.response) {
      message =
        error.response.data.msg || error.response.data.error || error.message;
    } else if (error.request) {
      message = "No response received from the server";
    } else {
      message = error.message;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  Toast.show({
    type: "error",
    text1: "Error",
    text2: message,
    visibilityTime: 4000,
    autoHide: true,
    topOffset: 50,
    bottomOffset: 60,
    text1Style: { fontSize: 18, fontWeight: "bold" },
    text2Style: { fontSize: 16 },
  });
};

export const showSuccessToast = (message: string) => {
  Toast.show({
    type: "success",
    text1: "Success",
    text2: message,
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 50,
    bottomOffset: 60,
    text1Style: { fontSize: 18, fontWeight: "bold" },
    text2Style: { fontSize: 16 },
  });
};
