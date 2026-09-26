import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";

export function DynamicBackground({ show, uri }: { show: boolean; uri?: string }) {
  if (!show || !uri) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image source={{ uri }} style={styles.image} contentFit="cover" blurRadius={26} />
      <View style={styles.tint} />
    </View>
  );
}

const styles = StyleSheet.create({
  image: { ...StyleSheet.absoluteFillObject, opacity: 0.5, transform: [{ scale: 1.12 }] },
  tint: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,255,255,0.62)" },
});