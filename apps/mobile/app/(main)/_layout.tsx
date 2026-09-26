import { Stack } from "expo-router";

/**
 * Replaces the old bottom-tab (tabs)/_layout.tsx. Web has no persistent
 * bottom nav bar — index/search/flicks/session/profile are all just
 * screens, reached via the search icon, the hamburger menu, or in-app
 * links, so this is a plain (headerless) Stack instead of <Tabs>.
 */
export default function MainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="search" />
      <Stack.Screen name="flicks" />
      <Stack.Screen name="session" options={{ presentation: "modal" }} />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
