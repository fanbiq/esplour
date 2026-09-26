import { Alert, Share, View, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react-native";
import { flicksApi } from "@/api/flicks";
import { likesApi, swipeApi } from "@/api/media";
import { useAuthStore } from "@/store/authStore";
import { VideoCard } from "@/components/deck/VideoCard";
import { DeckControls } from "@/components/deck/DeckControls";
import { useMovieDetail } from "@/components/movie/MovieDetailProvider";

export default function FlickDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { openMovie } = useMovieDetail();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const { data: flick, isLoading } = useQuery({
    queryKey: ["flick", id],
    queryFn: () => flicksApi.getFlick(id),
  });
  const { data: likes } = useQuery({
    queryKey: ["likes", "date", "all"],
    queryFn: () => likesApi.getLikes(),
  });
  const swipeMutation = useMutation({
    mutationFn: (direction: "left" | "right") => {
      if (!flick) throw new Error("Flick is unavailable");
      const itemId = flick.movieId ?? flick.id;
      return swipeApi.swipe(itemId, direction, {
        Id: itemId,
        Name: flick.movieTitle,
        OriginalTitle: flick.movieTitle,
        Overview: flick.caption,
        BlurDataURL: flick.posterUrl,
        likedBy: [],
      }, flick.movieMediaType);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["likes", "date", "all"] }),
  });
  const undoMutation = useMutation({
    mutationFn: (itemId: string) => swipeApi.unswipe(itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["likes", "date", "all"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: () => flicksApi.deleteFlick(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["flick", id] });
      router.replace("/(main)");
    },
    onError: () => Alert.alert("Could not delete flick", "Please try again."),
  });

  const currentItemId = flick?.movieId ?? flick?.id;
  const isLiked = Boolean(currentItemId && likes?.some((like: any) => {
    if (like.Id !== currentItemId) return false;
    if (like.sessionCode) return true;
    return Array.isArray(like.likedBy) && like.likedBy.some((likedBy: any) => likedBy.userId === user?.Id);
  }));
  const isUploadOwner = Boolean(flick?.uploader && user?.Name && flick.uploader === user.Name);

  const toggleLike = () => {
    if (!currentItemId) return;
    if (isLiked) undoMutation.mutate(currentItemId);
    else swipeMutation.mutate("right");
  };

  const deleteFlick = () => {
    Alert.alert("Delete flick?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate() },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      {isLoading || !flick ? (
        <View style={styles.center}>
          <ActivityIndicator color="#171717" />
        </View>
      ) : (
        <View style={styles.detailContent}>
          <VideoCard flick={flick} isActive isFeedActive onOpenComments={() => {}} />
          <View style={styles.controls}>
            <DeckControls
              onRewind={() => openMovie(flick.movieId ?? flick.id, {
                showLikedBy: false,
                mediaType: flick.movieMediaType,
              })}
              onSwipeLeft={() => undefined}
              onSwipeRight={() => swipeMutation.mutate("right")}
              onToggleLike={toggleLike}
              onOpenFilter={() => Share.share({ message: `${flick.movieTitle} on fanbiQ` })}
              canRewind={Boolean(flick.movieId ?? flick.id)}
              isLiked={isLiked}
              rewindImageUrl={flick.movieBackdropUrl ?? flick.moviePosterUrl ?? flick.posterUrl}
              rewindAriaLabel={`Open ${flick.movieTitle}`}
              hasAppliedFilters={false}
              leftSwipesRemaining={0}
            />
          </View>
        </View>
      )}

      <SafeAreaView style={styles.closeButtonWrap}>
        <Pressable style={styles.closeButton} onPress={() => router.back()} hitSlop={12}>
          <X color="#fff" size={22} />
        </Pressable>
      </SafeAreaView>

      {flick && isUploadOwner && (
        <SafeAreaView style={styles.ownerActions}>
          <Pressable style={styles.deleteButton} onPress={deleteFlick} disabled={deleteMutation.isPending}>
            <X color="#fff" size={18} />
          </Pressable>
        </SafeAreaView>
      )}

      {/*
        NOTE: the web app's comments UI (CommentsSheet.tsx) isn't backed by a
        real API yet either — there's no persisted comments endpoint on the
        server. Wire a bottom sheet here once that lands server-side.
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  detailContent: { flex: 1 },
  controls: { position: "absolute", left: 0, right: 0, bottom: 28, paddingHorizontal: 16, paddingBottom: 20 },
  closeButtonWrap: { position: "absolute", top: 0, left: 0 },
  closeButton: { margin: 16, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 999, padding: 8 },
  ownerActions: { position: "absolute", top: 0, right: 0 },
  deleteButton: { margin: 16, backgroundColor: "rgba(180,30,50,0.8)", borderRadius: 999, padding: 8 },
});
