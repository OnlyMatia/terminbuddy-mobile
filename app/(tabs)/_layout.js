import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { CalendarIcon, HomeIcon, MessageCircleIcon, PlusIcon, UserIcon } from '../../components/Icons';
import { colors } from '../../theme/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.logoGreen,
        tabBarInactiveTintColor: colors.navbarText,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Početna',
          tabBarIcon: ({ color }) => <HomeIcon size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'Objavi',
          tabBarIcon: ({ color }) => <PlusIcon size={27} color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-termins"
        options={{
          title: 'Moji termini',
          tabBarIcon: ({ color }) => <CalendarIcon size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Poruke',
          tabBarIcon: ({ color }) => <MessageCircleIcon size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <UserIcon size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bg2,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    height: 82,
    paddingTop: 10,
    paddingBottom: 22,
  },
  tabItem: {
    paddingTop: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
});
