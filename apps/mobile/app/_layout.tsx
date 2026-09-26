import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/api/queryClient";
import { useAuthStore } from "@/store/authStore";
import { MovieDetailProvider } from "@/components/movie/MovieDetailProvider";

/**
 * Route-guard: mirrors the web app's behavior where the swipe deck / likes /
 * flicks / profile are all behind login (native, guest, or Google), and
 * anything under (auth) is the logged-out flow.
 */
function useAuthGate() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, isHydrating, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrating) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(main)");
    }
  }, [isAuthenticated, isHydrating, segments, router]);
}

function RootNavigator() {
  useAuthGate();

  return (
    <Stack screenOptions={{
      headerShown: false,
      headerStyle: { backgroundColor: "#ffffff" },
      headerTintColor: "#171717",
      contentStyle: { backgroundColor: "#ffffff" },
    }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="movie/[id]" options={{ headerShown: true, title: "" }} />
      <Stack.Screen name="flick/[id]" options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="user/[username]" options={{ headerShown: true, title: "" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <MovieDetailProvider>
          <RootNavigator />
        </MovieDetailProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
