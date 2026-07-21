import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { CalendarIcon, HomeIcon, MessageCircleIcon, PlusIcon } from '../../components/Icons';
import { useNotifications } from '../../context/NotificationContext';
import { getUserProfile } from '../../lib/api';
import { triggerHomeScrollToTop } from '../../lib/homeScrollRegistry';
import { colors } from '../../theme/colors';

function getInitials(name) {
  if (!name) return '?';
  return name[0]?.toUpperCase();
}

export default function TabsLayout() {
  const { hasTerminNotifs, hasChatUnread } = useNotifications();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getUserProfile().then((res) => setProfile(res?.profile || null));
  }, []);

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
          title: profile?.username || 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.avatarWrap, focused && { borderColor: colors.logoGreen }]}>
              {profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} /> : <Text style={[styles.avatarInitials, { color }]}>{getInitials(profile?.username)}</Text>}
            </View>
          ),
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
  avatarWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line2,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontSize: 10,
    fontWeight: '700',
  },
});
