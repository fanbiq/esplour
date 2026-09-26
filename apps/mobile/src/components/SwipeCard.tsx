import { useCallback } from "react";
import { Dimensions, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  interpolate,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { MediaItem } from "@/types/media";
import { MediaImage } from "./MediaImage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;

interface Props {
  item: MediaItem;
  onSwiped: (direction: "left" | "right") => void;
  isTop: boolean;
}

export function SwipeCard({ item, onSwiped, isTop }: Props) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const triggerSwipe = useCallback(
    (direction: "left" | "right") => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSwiped(direction);
    },
    [onSwiped]
  );

  const pan = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.4;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > SWIPE_THRESHOLD) {
        const direction = e.translationX > 0 ? "right" : "left";
        translateX.value = withSpring(direction === "right" ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5, {}, () => {
          runOnJS(triggerSwipe)(direction);
        });
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${interpolate(translateX.value, [-SCREEN_WIDTH, SCREEN_WIDTH], [-12, 12])}deg` },
    ],
  }));

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1]),
  }));
  const passOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, -SWIPE_THRESHOLD], [0, 1]),
  }));

  const hasBackdrop = !!item.ImageTags?.Backdrop;
  const hasPrimary = !!item.ImageTags?.Primary;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, cardStyle]}>
        {(hasBackdrop || hasPrimary) && (
          <MediaImage id={item.Id} imageType={hasBackdrop ? "Backdrop" : "Primary"} style={StyleSheet.absoluteFill} />
        )}
        <Animated.View style={styles.topShade} />
        <Animated.View style={styles.bottomShade} />
        <Animated.View style={[styles.badge, styles.likeBadge, likeOpacity]}>
          <Animated.Text style={styles.badgeText}>LIKE</Animated.Text>
        </Animated.View>
        <Animated.View style={[styles.badge, styles.passBadge, passOpacity]}>
          <Animated.Text style={styles.badgeText}>PASS</Animated.Text>
        </Animated.View>
        <Animated.View style={styles.info}>
          <Animated.Text style={styles.mediaType}>{item.mediaType === "tv" ? "SERIES" : "MOVIE"}</Animated.Text>
          <Animated.Text style={styles.title} numberOfLines={2}>
            {item.Name} {item.ProductionYear ? `(${item.ProductionYear})` : ""}
          </Animated.Text>
          {item.Genres && <Animated.Text style={styles.genres}>{item.Genres.slice(0, 3).join(" · ")}</Animated.Text>}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    width: SCREEN_WIDTH - 32,
    height: "82%",
    borderRadius: 18,
    backgroundColor: "#f4f4f5",
    overflow: "hidden",
    alignSelf: "center",
  },
  info: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 22,
    paddingTop: 56,
  },
  topShade: { position: "absolute", top: 0, left: 0, right: 0, height: 150, backgroundColor: "rgba(0,0,0,0.16)" },
  bottomShade: { position: "absolute", bottom: 0, left: 0, right: 0, height: 190, backgroundColor: "rgba(0,0,0,0.58)" },
  mediaType: { color: "#ffffffaa", fontSize: 11, fontWeight: "800", letterSpacing: 1.5, marginBottom: 7 },
  title: { color: "#fff", fontSize: 24, lineHeight: 29, fontWeight: "800" },
  genres: { color: "#ffffffcc", fontSize: 13, marginTop: 7 },
  badge: {
    position: "absolute",
    top: 40,
    borderWidth: 3,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  likeBadge: { right: 24, borderColor: "#4ade80", transform: [{ rotate: "12deg" }] },
  passBadge: { left: 24, borderColor: "#f87171", transform: [{ rotate: "-12deg" }] },
  badgeText: { fontSize: 26, fontWeight: "900", color: "#fff" },
});
