import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { CalendarIcon, HomeIcon, PlusIcon, UserIcon } from '../../components/Icons';
import { colors } from '../../theme/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.logoGreen,
        tabBarInactiveTintColor: colors.textFaint,
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
          tabBarIcon: ({ focused }) => (
            <View style={[styles.postIconWrap, focused && styles.postIconWrapActive]}>
              <PlusIcon size={16} color={focused ? '#000' : colors.text} />
            </View>
          ),
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
  postIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line2,
  },
  postIconWrapActive: {
    backgroundColor: colors.logoGreen,
    borderColor: colors.logoGreen,
    shadowColor: colors.logoGreen,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
});
