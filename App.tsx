import React from 'react';
import {StatusBar} from 'react-native';
import {DefaultTheme, NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Icon, {IconName} from './src/components/Icon';
import HomeScreen from './src/screens/HomeScreen';
import DuaScreen from './src/screens/DuaScreen';
import LibraryHubScreen from './src/screens/LibraryHubScreen';
import SalatScreen from './src/screens/SalatScreen';
import ToolsScreen from './src/screens/ToolsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import {SettingsProvider, useSettings} from './src/state/settings';

const Tab = createBottomTabNavigator();

// Simple glyph icons for now; swap for an icon set in a later milestone.
const icons: Record<string, IconName> = {
  Home: 'home',
  Library: 'library',
  Salat: 'salat',
  Dua: 'dua',
  Tools: 'tools',
  Settings: 'settings',
};

function Tabs() {
  const {t, theme} = useSettings();
  const labels = {
    Home: t.tabs.home,
    Library: t.tabs.library,
    Salat: t.tabs.salat,
    Dua: t.tabs.dua,
    Tools: t.tabs.tools,
    Settings: t.tabs.settings,
  };
  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        dark: theme.name === 'dark',
        colors: {
          ...DefaultTheme.colors,
          background: theme.background,
          card: theme.surface,
          text: theme.text,
          border: theme.border,
          primary: theme.primary,
        },
      }}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
      <Tab.Navigator
        screenOptions={({route}) => ({
          headerShown: false,
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textMuted,
          tabBarLabelStyle: {fontSize: 12},
          tabBarStyle: {minHeight: 60},
          tabBarIcon: ({color}) => (
            <Icon name={icons[route.name]} color={color} size={24} />
          ),
        })}>
        <Tab.Screen name="Home" component={HomeScreen} options={{title: labels.Home}} />
        <Tab.Screen name="Library" component={LibraryHubScreen} options={{title: labels.Library}} />
        <Tab.Screen name="Salat" component={SalatScreen} options={{title: labels.Salat}} />
        <Tab.Screen name="Dua" component={DuaScreen} options={{title: labels.Dua}} />
        <Tab.Screen name="Tools" component={ToolsScreen} options={{title: labels.Tools}} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{title: labels.Settings}} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <Tabs />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
