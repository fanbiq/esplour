import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Menu, Search } from "lucide-react-native";
import { SegmentedTabs, type HomeTab } from "@/components/SegmentedTabs";
import { MenuSheet } from "@/components/MenuSheet";
import { SwipeDeck } from "@/components/SwipeDeck";
import { LikesGrid } from "@/components/LikesGrid";
import { DynamicBackground } from "@/components/DynamicBackground";

/**
 * Mobile equivalent of apps/web/src/app/page.tsx.
 *
 * Web structure this mirrors:
 *   <main>
 *     <DynamicBackground />                         (see NOTE below)
 *     <TopBar>: [Search] ---- [Swipe|Likes pill] ---- [Hamburger -> Sheet]
 *     <TabsContent value="swipe">  <SwipeVideoFeed /> </TabsContent>
 *     <TabsContent value="likes">  <LikesList />      </TabsContent>
 *   </main>
 *
 * NOTE: DynamicBackground (the blurred, animated backdrop synced to the
 * currently-focused card) is intentionally left out of this pass — it
 * depends on the web-only `useBackgroundStore` + `useBlurData` hooks and
 * is called out as a later step, see chat.
 */
export default function HomeScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<HomeTab>("swipe");
  const [menuOpen, setMenuOpen] = useState(false);
  const [backgroundUri, setBackgroundUri] = useState<string | undefined>();

  return (
    <View style={styles.root}>
      <DynamicBackground show={tab === "swipe"} uri={backgroundUri} />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.topBar}>
          <Pressable
            style={styles.iconButton}
            onPress={() => router.push("/(main)/search")}
            hitSlop={12}
          >
            <Search color="#ffffff" size={22} />
          </Pressable>

          <SegmentedTabs value={tab} onChange={setTab} />

          <Pressable style={styles.iconButton} onPress={() => setMenuOpen(true)} hitSlop={12}>
            <Menu color="#ffffff" size={22} />
          </Pressable>
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        {tab === "swipe" ? <SwipeDeck isActive={tab === "swipe"} onActiveBackgroundChange={setBackgroundUri} /> : <LikesGrid />}
      </View>

      <MenuSheet visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  safeArea: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1 },
});
