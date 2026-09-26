import { useEffect, useState } from "react";
import { useEventListener } from "expo";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Pause, Play } from "lucide-react-native";
import { AppState, Pressable, StyleSheet, View, Dimensions, ActivityIndicator } from "react-native";
import { Text } from "@/components/Typography";
import { followApi } from "@/api/profile";
import { flicksApi } from "@/api/flicks";
import type { Flick } from "@/types/media";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

interface VideoCardProps {
  flick: Flick;
  isActive: boolean;
  isFeedActive?: boolean;
  initialIsFollowed?: boolean;
  onFollowStatusChange?: (username: string, isFollowing: boolean) => void;
  onOpenComments: () => void;
}

export function VideoCard({ flick, isActive, isFeedActive = true, initialIsFollowed = false, onFollowStatusChange }: VideoCardProps) {
  const router = useRouter();
  const player = useVideoPlayer(flick.videoUrl ?? "", (nativePlayer) => {
    nativePlayer.loop = true;
  });
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(Boolean(flick.videoUrl));
  const [showControls, setShowControls] = useState(false);
  const [followed, setFollowed] = useState(initialIsFollowed);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Mirrors the web client's skip-tracking: an active flick that goes inactive
  // before 3s of playback (and never completed) is logged as skipped.
  const [hasSkippableActivity, setHasSkippableActivity] = useState(false);
  const [skipRecorded, setSkipRecorded] = useState(false);

  const followMutation = useMutation({
    mutationFn: (nextState: boolean) => nextState ? followApi.follow(flick.uploader) : followApi.unfollow(flick.uploader),
  });

  useEventListener(player, "statusChange", ({ status }) => {
    setLoading(status === "loading" || status === "idle");
  });
  useEventListener(player, "playingChange", ({ isPlaying }) => {
    setPlaying(isPlaying);
    if (isPlaying) setLoading(false);
  });
  useEventListener(player, "playToEnd", () => {
    handleEnd();
  });

  useEffect(() => setFollowed(initialIsFollowed), [initialIsFollowed]);

  useEffect(() => {
    setHasCompleted(false);
    setCaptionExpanded(false);
    setShowControls(false);
    setLoading(Boolean(flick.videoUrl));
    setSkipRecorded(false);
    setHasSkippableActivity(false);
  }, [flick.id, flick.videoUrl]);

  useEffect(() => {
    if (!flick.videoUrl) return;
    if (isActive && isFeedActive) {
      setLoading(true);
      player.play();
      setPlaying(true);
      setHasSkippableActivity(true);
      void flicksApi.trackEvent(flick.id, "flick_viewed", {
        movieId: flick.movieId,
        movieTitle: flick.movieTitle,
        uploader: flick.uploader,
      });
    } else {
      // Log a skip if the flick was active, never finished, and was watched
      // for less than 3 seconds before scrolling away.
      if (hasSkippableActivity && !skipRecorded && !hasCompleted && player.currentTime < 3) {
        void flicksApi.trackEvent(flick.id, "flick_skipped", {
          movieId: flick.movieId,
          movieTitle: flick.movieTitle,
          uploader: flick.uploader,
        });
        setSkipRecorded(true);
      }
      setHasSkippableActivity(false);
      player.pause();
      player.currentTime = 0;
      setPlaying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flick.id, flick.videoUrl, isActive, isFeedActive, player]);

  // Pause playback when the app is backgrounded, mirroring the web client's
  // visibilitychange/pagehide handling.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState !== "active") {
        player.pause();
        setPlaying(false);
      }
    });
    return () => subscription.remove();
  }, [player]);

  useEffect(() => {
    if (!showControls) return;
    const timeout = setTimeout(() => setShowControls(false), 2000);
    return () => clearTimeout(timeout);
  }, [showControls]);

  const togglePlay = () => {
    if (!flick.videoUrl) return;
    if (playing) {
      player.pause();
      setPlaying(false);
    } else {
      player.play();
      setPlaying(true);
      setHasCompleted(false);
    }
    setShowControls(true);
  };

  const toggleFollow = () => {
    const nextState = !followed;
    setFollowed(nextState);
    onFollowStatusChange?.(flick.uploader, nextState);
    void flicksApi.trackEvent(flick.id, "uploader_followed", {
      uploader: flick.uploader,
    });
    followMutation.mutate(nextState, {
      onError: () => {
        setFollowed(!nextState);
        onFollowStatusChange?.(flick.uploader, !nextState);
      },
    });
  };

  function handleEnd() {
    setHasCompleted(true);
    if (!hasCompleted) {
      void flicksApi.trackEvent(flick.id, "flick_watch_completed", {
        movieId: flick.movieId,
        movieTitle: flick.movieTitle,
        uploader: flick.uploader,
      });
    }
  }

  return (
    <Pressable style={[styles.container, !isActive && styles.inactive]} onPress={togglePlay}>
      <View style={styles.mediaLayer}>
        {flick.videoUrl ? (
          <VideoView player={player} style={styles.video} contentFit="contain" nativeControls={false} />
        ) : flick.posterUrl ? (
          <Image source={{ uri: flick.posterUrl }} style={styles.video} contentFit="contain" />
        ) : (
          <LinearGradient
            colors={["#1a0520", "#0a1a08", "#050508"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fallback}
          />
        )}
        {flick.videoUrl && loading && <View style={styles.loading}><ActivityIndicator color="#fff" size="large" /></View>}
      </View>

      <LinearGradient
        pointerEvents="none"
        colors={["rgba(0,0,0,0.18)", "rgba(0,0,0,0.22)", "rgba(0,0,0,0.92)"]}
        locations={[0, 0.4, 1]}
        style={styles.scrim}
      />

      {showControls && <View pointerEvents="none" style={styles.playFlash}>{playing ? <Pause color="#fff" size={32} /> : <Play color="#fff" size={32} />}</View>}
      <View style={styles.bottomContent}>
        <View style={styles.uploaderRow}>
          <Pressable onPress={() => router.push(`/user/${flick.uploader}`)} style={styles.avatarButton}>
            {flick.uploaderAvatarUrl ? <Image source={{ uri: flick.uploaderAvatarUrl }} style={styles.avatar} contentFit="cover" /> : <View style={styles.avatarFallback}><Text style={styles.avatarText}>{flick.uploader[0]?.toUpperCase()}</Text></View>}
          </Pressable>
          <Pressable onPress={() => router.push(`/user/${flick.uploader}`)} style={styles.usernameButton}>
            <Text style={styles.username} numberOfLines={1}>@{flick.uploader}</Text>
          </Pressable>
          <Pressable onPress={toggleFollow} disabled={followMutation.isPending} style={styles.followButton}>
            <Text style={styles.followText}>{followed ? "Following" : "Follow"}</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => setCaptionExpanded((value) => !value)}>
          <Text style={[styles.caption, !captionExpanded && styles.captionCollapsed]} numberOfLines={captionExpanded ? 4 : 1}>{flick.caption}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { height: SCREEN_HEIGHT, width: "100%", backgroundColor: "#000" },
  inactive: { opacity: 0.9 },
  mediaLayer: { ...StyleSheet.absoluteFillObject, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  video: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  fallback: { ...StyleSheet.absoluteFillObject },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.6)" },
  scrim: { ...StyleSheet.absoluteFillObject },
  playFlash: { position: "absolute", top: SCREEN_HEIGHT / 2 - 28, left: SCREEN_WIDTH / 2 - 28, width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  bottomContent: { position: "absolute", left: 0, right: 0, bottom: 60, paddingHorizontal: 16, paddingBottom: 40 },
  uploaderRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  avatarButton: { width: 28, height: 28 },
  avatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" },
  avatarFallback: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  usernameButton: { flexShrink: 1 },
  username: { color: "#fff", fontSize: 13, fontWeight: "600" },
  followButton: { marginLeft: 8, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: "#fff" },
  followText: { color: "#000", fontSize: 11, fontWeight: "700" },
  caption: { color: "rgba(255,255,255,0.88)", fontSize: 13, lineHeight: 18, textShadowColor: "rgba(0,0,0,0.7)", textShadowRadius: 4 },
  captionCollapsed: { opacity: 0.9 },
});