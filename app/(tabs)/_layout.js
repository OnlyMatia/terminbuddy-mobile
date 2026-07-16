import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { CalendarIcon, HomeIcon, MessageCircleIcon, PlusIcon, UserIcon } from '../../components/Icons';
import { useNotifications } from '../../context/NotificationContext';
import { triggerHomeScrollToTop } from '../../lib/homeScrollRegistry';
import { colors } from '../../theme/colors';

export default function TabsLayout() {
  const { hasTerminNotifs, hasChatUnread } = useNotifications();

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
        listeners={({ navigation }) => ({
          tabPress: () => {
            if (navigation.isFocused()) {
              triggerHomeScrollToTop();
            }
          },
        })}
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
          tabBarBadge: hasTerminNotifs ? '' : undefined,
          tabBarBadgeStyle: styles.dotBadge,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Poruke',
          tabBarIcon: ({ color }) => <MessageCircleIcon size={22} color={color} />,
          tabBarBadge: hasChatUnread ? '' : undefined,
          tabBarBadgeStyle: styles.dotBadge,
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
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  dotBadge: {
    backgroundColor: colors.logoGreen,
    minWidth: 10,
    maxWidth: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 3,
    marginLeft: 6,
  },
});
