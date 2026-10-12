import type { ComponentProps } from 'react';
import { StyleSheet, View, type ColorValue } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';

import { useCartSummary } from '@/features/cart/cart-store';
import { colors, fonts, radius } from '@/theme';

type IconName = ComponentProps<typeof Feather>['name'];

function TabIcon({ name, focused, color }: { name: IconName; focused: boolean; color: ColorValue }) {
  return (
    <View style={[styles.iconPill, focused && styles.iconPillActive]}>
      <Feather name={name} size={24} color={color} />
    </View>
  );
}

const tab = (title: string, icon: IconName) => ({
  title,
  tabBarIcon: ({ focused, color }: { focused: boolean; color: ColorValue }) => (
    <TabIcon name={icon} focused={focused} color={color} />
  ),
});

export default function TabsLayout() {
  const { productCount } = useCartSummary();

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 13, marginTop: 4 },
        tabBarBadgeStyle: { backgroundColor: colors.primary, color: colors.white, fontFamily: fonts.bold, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Tabs.Screen name="index" options={tab('Home', 'home')} />
      <Tabs.Screen name="shop" options={tab('Shop', 'grid')} />
      <Tabs.Screen name="orders" options={tab('Orders', 'file-text')} />
      <Tabs.Screen
        name="cart"
        options={{ ...tab('Cart', 'shopping-cart'), tabBarBadge: productCount > 0 ? productCount : undefined }}
      />
      <Tabs.Screen name="profile" options={tab('Profile', 'user')} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconPill: { width: 64, height: 34, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  iconPillActive: { backgroundColor: colors.surfaceSuccess },
});
