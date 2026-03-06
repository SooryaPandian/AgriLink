import React from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Auth screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// Farmer screens
import HomeScreen from './src/screens/farmer/HomeScreen';
import RequirementDetailScreen from './src/screens/farmer/RequirementDetailScreen';
import ApplicationFormScreen from './src/screens/farmer/ApplicationFormScreen';
import NegotiationScreen from './src/screens/farmer/NegotiationScreen';
import ChatScreen from './src/screens/farmer/ChatScreen';
import MyContractsScreen from './src/screens/farmer/MyContractsScreen';
import NotificationsScreen from './src/screens/farmer/NotificationsScreen';
import ProfileScreen from './src/screens/farmer/ProfileScreen';
import NegotiationsListScreen from './src/screens/farmer/NegotiationsListScreen';

const AuthStack = createStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const ContractStack = createStackNavigator();
const NegotiationsStack = createStackNavigator();

const COLORS = { primary: '#16a34a', bg: '#0f172a', card: '#1e293b', text: '#f1f5f9', muted: '#94a3b8' };

const tabIcon = { Home: '🌾', Contracts: '📄', Negotiations: '🤝', Notifications: '🔔', Profile: '👤' };

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{tabIcon[route.name]}</Text>,
        tabBarStyle: { backgroundColor: COLORS.card, borderTopColor: '#334155', borderTopWidth: 1 },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
        headerStyle: { backgroundColor: COLORS.card },
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontWeight: '700' },
      })}
    >
      <Tab.Screen name="Home" options={{ headerShown: false }}>
        {() => (
          <HomeStack.Navigator screenOptions={{
            headerStyle: { backgroundColor: COLORS.card },
            headerTintColor: COLORS.text,
            headerTitleStyle: { fontWeight: '700' },
          }}>
            <HomeStack.Screen name="HomeList" component={HomeScreen} options={{ title: '🌾 AgriLink – Browse Requirements' }} />
            <HomeStack.Screen name="RequirementDetail" component={RequirementDetailScreen} options={{ title: 'Requirement Details' }} />
            <HomeStack.Screen name="ApplicationForm" component={ApplicationFormScreen} options={{ title: 'Apply for Contract' }} />
            <HomeStack.Screen name="Negotiation" component={NegotiationScreen} options={{ title: 'Negotiation' }} />
            <HomeStack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
          </HomeStack.Navigator>
        )}
      </Tab.Screen>
      <Tab.Screen name="Negotiations" options={{ title: 'My Negotiations', headerShown: false }}>
        {() => (
          <NegotiationsStack.Navigator screenOptions={{
            headerStyle: { backgroundColor: COLORS.card },
            headerTintColor: COLORS.text,
            headerTitleStyle: { fontWeight: '700' },
          }}>
            <NegotiationsStack.Screen name="NegotiationsList" component={NegotiationsListScreen} options={{ title: 'My Negotiations' }} />
            <NegotiationsStack.Screen name="RequirementDetail" component={RequirementDetailScreen} options={{ title: 'Requirement Details' }} />
            <NegotiationsStack.Screen name="Negotiation" component={NegotiationScreen} options={{ title: 'Negotiation' }} />
            <NegotiationsStack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
          </NegotiationsStack.Navigator>
        )}
      </Tab.Screen>
      <Tab.Screen name="Contracts" component={MyContractsScreen} options={{ title: 'My Contracts' }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();
  if (loading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg }}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );
  return (
    <NavigationContainer>
      {!user ? (
        <AuthStack.Navigator screenOptions={{
          headerStyle: { backgroundColor: COLORS.card },
          headerTintColor: COLORS.text,
          headerTitleStyle: { fontWeight: '700' },
        }}>
          <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <AuthStack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        </AuthStack.Navigator>
      ) : (
        <HomeTabs />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
