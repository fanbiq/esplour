import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Clock3, Play, ShieldCheck, Star, X } from "lucide-react-native";
import { Text } from "@/components/Typography";
import { MediaImage } from "@/components/MediaImage";
import { likesApi, mediaApi, swipeApi } from "@/api/media";
import { watchlistApi } from "@/api/profile";
import { useAuthStore } from "@/store/authStore";
import type { MovieSelection } from "./MovieDetailProvider";
import { MovieLikeButton } from "./MovieListItem";
import { StreamList } from "./StreamList";
import { useState } from "react";

export function MovieDetailView({ selection, onClose }: { selection: MovieSelection | null; onClose: () => void }) {
  const [streamListVisible, setStreamListVisible] = useState(false);
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const movieQuery = useQuery({
    queryKey: ["movie-detail", selection?.id, selection?.sessionCode, selection?.mediaType],
    queryFn: () => mediaApi.getItem(selection!.id, {
      sessionCode: selection?.sessionCode,
      mediaType: selection?.mediaType,
      includeUserState: true,
    }),
    enabled: !!selection,
  });
  const movie = movieQuery.data;
  const mediaType = selection?.mediaType ?? movie?.mediaType ?? "movie";
  const likedByMe = Boolean(movie?.UserData?.Likes || movie?.likedBy?.some((like) =>
    like.userId === user?.Id && (like.sessionCode ?? null) === (selection?.sessionCode ?? null)
  ));
  const isFavorite = Boolean(movie?.UserData?.IsFavorite);
  const refreshMovie = () => {
    queryClient.invalidateQueries({ queryKey: ["movie-detail", selection?.id] });
    queryClient.invalidateQueries({ queryKey: ["likes"] });
  };
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!movie) throw new Error("Movie details are unavailable");
      if (likedByMe) await likesApi.removeLike(movie.Id, selection?.sessionCode);
      else await swipeApi.swipe(movie.Id, "right", movie, mediaType, selection?.sessionCode);
    },
    onSuccess: refreshMovie,
    onError: () => Alert.alert("Couldn't update likes", "Please try again."),
  });
  const favoriteMutation = useMutation({
    mutationFn: () => {
      if (!movie) throw new Error("Movie details are unavailable");
      return watchlistApi.toggle(movie.Id, mediaType, !isFavorite);
    },
    onSuccess: refreshMovie,
    onError: () => Alert.alert("Couldn't update favorites", "Please try again."),
  });

  const ratingSource = movie?.CommunityRatingSource?.toLowerCase() ?? "";
  const rating = typeof movie?.CommunityRating === "number"
    ? ratingSource.includes("tomato") ? `${Math.round(movie.CommunityRating * 10)}%` : movie.CommunityRating.toFixed(1)
    : null;
  const runtime = movie?.RunTimeTicks ? formatRuntime(movie.RunTimeTicks) : null;
  const canEditPersonalState = !!user && !user.isGuest;

  return (
    <Modal visible={!!selection} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modal}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close movie details" />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View style={styles.handle} />
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton} accessibilityLabel="Close">
              <X color="#171717" size={20} />
            </Pressable>
          </View>
          {movieQuery.isLoading ? (
            <View style={styles.state}><ActivityIndicator color="#171717" /></View>
          ) : movieQuery.isError ? (
            <View style={styles.state}>
              <Text style={styles.stateTitle}>Couldn't load this title</Text>
              <Pressable onPress={() => movieQuery.refetch()} style={styles.retryButton}><Text style={styles.retryText}>Try again</Text></Pressable>
            </View>
          ) : movie ? (
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.hero}>
                <MediaImage id={movie.Id} imageType="Backdrop" tag={movie.BackdropImageTags?.[0]} style={StyleSheet.absoluteFill} />
                <View style={styles.heroShade} />
                <View style={styles.heroInfo}>
                  <MediaImage id={movie.Id} tag={movie.ImageTags?.Primary} style={styles.poster} />
                  <View style={styles.heroText}>
                    {!!movie.Genres?.length && <View style={styles.genreRow}>{movie.Genres.slice(0, 3).map((genre) => (
                      <View key={genre} style={styles.genrePill}><Text style={styles.genreText}>{genre}</Text></View>
                    ))}</View>}
                    <Text style={styles.title} numberOfLines={2}>{movie.Name}</Text>
                    <View style={styles.metadata}>
                      {!!movie.ProductionYear && <Text style={styles.metaText}>{movie.ProductionYear}</Text>}
                      {!!movie.OfficialRating && <View style={styles.metaItem}><ShieldCheck size={13} color="#ffffff" /><Text style={styles.metaText}>{movie.OfficialRating}</Text></View>}
                      {rating && <View style={styles.metaItem}><Star size={13} color="#ffffff" /><Text style={styles.metaText}>{rating}</Text></View>}
                      {runtime && <View style={styles.metaItem}><Clock3 size={13} color="#ffffff" /><Text style={styles.metaText}>{runtime}</Text></View>}
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.body}>
                {!!movie.OriginalTitle && movie.OriginalTitle !== movie.Name && <Text style={styles.originalTitle}>{movie.OriginalTitle}</Text>}
                {!!movie.Taglines?.[0] && <Text style={styles.tagline}>{movie.Taglines[0]}</Text>}
                <View style={styles.actions}>
                  <Pressable style={styles.playAction} onPress={() => setStreamListVisible(true)}>
                    <Play size={17} color="#ffffff" fill="#ffffff" />
                    <Text style={styles.primaryActionText}>Play</Text>
                  </Pressable>
                  <MovieLikeButton isLiked={likedByMe} onPress={() => likeMutation.mutate()} disabled={likeMutation.isPending} size="large" />
                  {canEditPersonalState &&
                    <Pressable style={styles.secondaryAction} onPress={() => favoriteMutation.mutate()} disabled={favoriteMutation.isPending}>
                      {isFavorite ? <Bookmark size={17} color="#171717" fill="#171717" /> : <Star size={17} color="#171717" />}
                      <Text style={styles.secondaryActionText}>{isFavorite ? "Favorited" : "Favorite"}</Text>
                    </Pressable>
                  }
                </View>
                {selection?.showLikedBy !== false && !!movie.likedBy?.length && <DetailSection title="Liked by">
                  <View style={styles.nameChips}>{movie.likedBy.map((like) => <Text key={`${like.userId}-${like.sessionCode}`} style={styles.nameChip}>{like.userName}</Text>)}</View>
                </DetailSection>}
                {!!movie.WatchProviders?.length && <DetailSection title="Available on">
                  <View style={styles.providerList}>{movie.WatchProviders.map((provider) => <View key={provider.Id} style={styles.provider}>
                    <Image source={{ uri: `https://image.tmdb.org/t/p/w92${provider.LogoPath}` }} style={styles.providerLogo} contentFit="cover" />
                    <Text style={styles.providerName} numberOfLines={1}>{provider.Name}</Text>
                  </View>)}</View>
                </DetailSection>}
                <View style={styles.detailGrid}>
                  <DetailValue label="Director" value={movie.People?.find((person) => person.Type === "Director")?.Name ?? "Unknown"} />
                  {!!movie.Language && <DetailValue label="Language" value={movie.Language} />}
                  {!!movie.Studios?.[0] && <DetailValue label="Studio" value={movie.Studios[0].Name} />}
                </View>
                <DetailSection title="Synopsis"><Text style={styles.overview}>{movie.Overview || "No overview available."}</Text></DetailSection>
                {!!movie.People?.some((person) => person.Type === "Actor") && <DetailSection title="Cast">
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.castList}>
                    {movie.People.filter((person) => person.Type === "Actor").slice(0, 12).map((person) => <View key={person.Id} style={styles.castMember}>
                      <MediaImage id={person.Id} tag={person.PrimaryImageTag} style={styles.castPhoto} />
                      <Text style={styles.castName} numberOfLines={2}>{person.Name}</Text>
                      <Text style={styles.castRole} numberOfLines={2}>{person.Role}</Text>
                    </View>)}
                  </ScrollView>
                </DetailSection>}
              </View>
            </ScrollView>
          ) : null}
        </View>
        <StreamList
          movieName={movie?.Name ?? ""}
          mediaType={mediaType}
          visible={streamListVisible}
          onClose={() => setStreamListVisible(false)}
        />
      </View>
    </Modal>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

function DetailValue({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailValue}><Text style={styles.sectionTitle}>{label}</Text><Text style={styles.detailText} numberOfLines={2}>{value}</Text></View>;
}

function formatRuntime(ticks: number) {
  const minutes = Math.floor(ticks / 600_000_000);
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

const styles = StyleSheet.create({
  modal: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.42)" },
  scrim: { ...StyleSheet.absoluteFillObject },
  sheet: { height: "92%", overflow: "hidden", backgroundColor: "#ffffff", borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  sheetHeader: { height: 42, alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff", zIndex: 2 },
  handle: { width: 38, height: 4, borderRadius: 2, backgroundColor: "#d4d4d8" },
  closeButton: { position: "absolute", right: 14, top: 7, width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#f4f4f5" },
  scrollContent: { paddingBottom: 36 },
  hero: { height: 300, justifyContent: "flex-end", backgroundColor: "#27272a" },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.44)" },
  heroInfo: { flexDirection: "row", alignItems: "flex-end", gap: 14, paddingHorizontal: 18, paddingBottom: 18 },
  poster: { width: 100, height: 148, borderRadius: 8, backgroundColor: "#e4e4e7" },
  heroText: { flex: 1, paddingBottom: 2 },
  genreRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 7 },
  genrePill: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3, backgroundColor: "rgba(255,255,255,0.22)" },
  genreText: { color: "#ffffff", fontSize: 9, fontWeight: "700", textTransform: "uppercase" },
  title: { color: "#ffffff", fontSize: 23, lineHeight: 27, fontWeight: "800" },
  metadata: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 9, marginTop: 8 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { color: "rgba(255,255,255,0.92)", fontSize: 11, fontWeight: "600" },
  body: { paddingHorizontal: 20, paddingTop: 20 },
  originalTitle: { color: "#71717a", fontSize: 13, fontStyle: "italic", marginBottom: 12 },
  tagline: { color: "#52525b", fontSize: 16, fontStyle: "italic", marginBottom: 20 },
  actions: { flexDirection: "row", gap: 8, marginBottom: 24 },
  playAction: { flex: 1, height: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 8, backgroundColor: "#171717" },
  primaryActionText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  secondaryAction: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 46, borderRadius: 8, backgroundColor: "#f4f4f5" },
  secondaryActionText: { color: "#171717", fontSize: 14, fontWeight: "700" },
  section: { marginBottom: 24 },
  sectionTitle: { color: "#71717a", fontSize: 11, fontWeight: "800", textTransform: "uppercase", marginBottom: 9 },
  nameChips: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  nameChip: { color: "#3f3f46", backgroundColor: "#f4f4f5", borderRadius: 6, paddingHorizontal: 9, paddingVertical: 6, fontSize: 12 },
  providerList: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  provider: { width: 64, alignItems: "center", gap: 5 },
  providerLogo: { width: 40, height: 40, borderRadius: 8, backgroundColor: "#f4f4f5" },
  providerName: { color: "#3f3f46", fontSize: 10, textAlign: "center" },
  detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: 20, marginBottom: 24 },
  detailValue: { width: "44%" },
  detailText: { color: "#171717", fontSize: 14, fontWeight: "600" },
  overview: { color: "#3f3f46", fontSize: 15, lineHeight: 23 },
  castList: { gap: 14, paddingRight: 20 },
  castMember: { width: 74, alignItems: "center" },
  castPhoto: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#f4f4f5", marginBottom: 7 },
  castName: { color: "#171717", fontSize: 11, fontWeight: "700", textAlign: "center" },
  castRole: { color: "#71717a", fontSize: 10, textAlign: "center", marginTop: 3 },
  state: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  stateTitle: { color: "#171717", fontSize: 16, fontWeight: "700" },
  retryButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: "#171717" },
  retryText: { color: "#ffffff", fontWeight: "700" },
});