import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import AddNoteScreen from '../screens/AddNoteScreen';
import NoteDetailScreen from '../screens/NoteDetailScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import SearchScreen from '../screens/SearchScreen';
import FoldersScreen from '../screens/FoldersScreen';
import UploadScreen from '../screens/UploadScreen';
import PDFViewer from '../screens/PDFViewer';
import CommentsScreen from '../screens/CommentsScreen';
import CollectionsScreen from '../screens/CollectionsScreen';
import EditNoteScreen from '../screens/EditNoteScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#13131f',
          borderTopColor: '#ffffff08',
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'web' ? 16 : Platform.OS === 'android' ? 8 : insets.bottom || 8,
          paddingTop: 10,
          height: Platform.OS === 'web' ? 90 : Platform.OS === 'android' ? 65 : 60 + (insets.bottom || 0),
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginTop: 2 },
        tabBarIconStyle: { marginBottom: 2 },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Notlar', tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} /> }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: 'Ara', tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} /> }} />
      <Tab.Screen name="Collections" component={CollectionsScreen} options={{ tabBarLabel: 'Koleksiyonlar', tabBarIcon: ({ color, size }) => <Ionicons name="albums-outline" size={size} color={color} /> }} />
      <Tab.Screen name="Folders" component={FoldersScreen} options={{ tabBarLabel: 'Klasorler', tabBarIcon: ({ color, size }) => <Ionicons name="folder-outline" size={size} color={color} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profil', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}

function WebLayout({ children }) {
  if (Platform.OS !== 'web') return children;
  return (
    <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#07070f' }}>
      <View style={{
        width: '100%',
        maxWidth: 600,
        flex: 1,
        backgroundColor: '#0d0d14',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 60,
      }}>
        {children}
      </View>
    </View>
  );
}

export default function AppNavigator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return null;

  return (
    <NavigationContainer>
      <WebLayout>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <>
              <Stack.Screen name="Main" component={TabNavigator} />
              <Stack.Screen name="AddNote" component={AddNoteScreen} />
              <Stack.Screen name="NoteDetail" component={NoteDetailScreen} />
              <Stack.Screen name="Upload" component={UploadScreen} />
              <Stack.Screen name="PDFViewer" component={PDFViewer} />
              <Stack.Screen name="Comments" component={CommentsScreen} />
              <Stack.Screen name="EditNote" component={EditNoteScreen} />
              <Stack.Screen name="Collections" component={CollectionsScreen} />
            </>
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </WebLayout>
    </NavigationContainer>
  );
}