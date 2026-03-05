import { Platform } from 'react-native';
import * as ExpoSecureStore from 'expo-secure-store';

const isWeb = Platform.OS === 'web';

const getItemAsync = async (key) => {
  if (isWeb && typeof window !== 'undefined' && window.localStorage) {
    return Promise.resolve(window.localStorage.getItem(key));
  }
  return ExpoSecureStore.getItemAsync(key);
};

const setItemAsync = async (key, value) => {
  if (isWeb && typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(key, value);
    return Promise.resolve();
  }
  return ExpoSecureStore.setItemAsync(key, value);
};

const deleteItemAsync = async (key) => {
  if (isWeb && typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(key);
    return Promise.resolve();
  }
  return ExpoSecureStore.deleteItemAsync(key);
};

export default {
  getItemAsync,
  setItemAsync,
  deleteItemAsync,
};
