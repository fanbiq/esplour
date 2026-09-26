import { Image } from "expo-image";
import { Heart, HeartOff, Rewind, Share2, X } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/Typography";

// Neutral light surfaces matching the web app's default theme.
const theme = {
  background: "#ffffff",
  foreground: "#171717",
  primary: "#171717",
  primaryForeground: "#ffffff",
  secondary: "#f4f4f5",
  secondaryForeground: "#171717",
};

interface DeckControlsProps {
  onRewind: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onToggleLike: () => void;
  onOpenFilter: () => void;
  canRewind: boolean;
  isLiked: boolean;
  rewindImageUrl?: string;
  rewindAriaLabel?: string;
  hasAppliedFilters: boolean;
  leftSwipesRemaining?: number;
  rightSwipesRemaining?: number;
}

export function DeckControls({
  onRewind,
  onSwipeLeft,
  onSwipeRight,
  onToggleLike,
  onOpenFilter,
  canRewind,
  isLiked,
  rewindImageUrl,
  hasAppliedFilters,
  leftSwipesRemaining,
  rightSwipesRemaining,
}: DeckControlsProps) {
  const leftDisabled = leftSwipesRemaining !== undefined && leftSwipesRemaining < 1;
  const rightDisabled = !isLiked && rightSwipesRemaining !== undefined && rightSwipesRemaining < 1;

  return (
    <View style={styles.container}>
      <Pressable style={styles.shareButton} onPress={onOpenFilter} accessibilityLabel="Share">
        <Share2 color={theme.foreground} size={24} />
        {hasAppliedFilters && <View style={styles.filterBadge} />}
      </Pressable>

      <Pressable style={[styles.circleButton, leftDisabled && styles.disabled]} onPress={onSwipeLeft} disabled={leftDisabled} accessibilityLabel="Pass">
        <X color={theme.foreground} size={36} />
        {leftSwipesRemaining !== undefined && leftSwipesRemaining > 0 && <Counter value={leftSwipesRemaining} />}
      </Pressable>

      <Pressable
        style={[styles.likeButton, rightDisabled && styles.disabled]}
        onPress={isLiked ? onToggleLike : onSwipeRight}
        disabled={rightDisabled}
        accessibilityLabel={isLiked ? "Remove like" : "Like"}
      >
        {isLiked ? (
          <HeartOff color={theme.primaryForeground} size={36} />
        ) : (
          <Heart color={theme.primaryForeground} size={36} fill={theme.primaryForeground} />
        )}
        {rightSwipesRemaining !== undefined && rightSwipesRemaining > 0 && <Counter value={rightSwipesRemaining} />}
      </Pressable>

      <Pressable style={[styles.rewindButton, !canRewind && styles.disabled]} onPress={onRewind} disabled={!canRewind} accessibilityLabel="Open movie details">
        {rewindImageUrl ? <Image source={{ uri: rewindImageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Rewind color={theme.secondaryForeground} size={22} />}
      </Pressable>
    </View>
  );
}

function Counter({ value }: { value: number }) {
  return <View style={styles.counter}><Text style={styles.counterText}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  container: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24, zIndex: 2 },
  shareButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center", position: "relative" },
  circleButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    backgroundColor: theme.background,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    // shadow-sm shadow-black/20
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  likeButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    // shadow-xs (default Button variant)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  rewindButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(23,23,23,0.2)",
    backgroundColor: theme.background,
    alignItems: "center",
    justifyContent: "center",
    // shadow-xs (secondary Button variant)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  counter: {
    position: "absolute",
    top: -8,
    right: -8,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 999,
    backgroundColor: theme.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  counterText: { color: theme.secondaryForeground, fontSize: 11, fontWeight: "600" },
  filterBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.foreground,
    borderWidth: 2,
    borderColor: theme.background,
  },
  disabled: { opacity: 0.5 },
});