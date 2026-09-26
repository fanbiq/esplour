import { BlurView } from "expo-blur";
import { Pressable, StyleSheet, View } from "react-native";
import { GalleryHorizontalEnd, Heart } from "lucide-react-native";

export type HomeTab = "swipe" | "likes";

interface Props {
  value: HomeTab;
  onChange: (value: HomeTab) => void;
}

export function SegmentedTabs({ value, onChange }: Props) {
  return (
    <BlurView intensity={20} tint="light" style={styles.container}>
      <Pressable style={[styles.tab, value === "swipe" && styles.activeTab]} onPress={() => onChange("swipe")}>
        <GalleryHorizontalEnd size={20} color="#171717" fill={value === "swipe" ? "#171717" : "none"} />
      </Pressable>
      <Pressable style={[styles.tab, value === "likes" && styles.activeTab]} onPress={() => onChange("likes")}>
        <Heart size={20} color="#171717" fill={value === "likes" ? "#171717" : "none"} />
      </Pressable>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 3,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  tab: { width: 64, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  activeTab: { backgroundColor: "#ffffff" },
});