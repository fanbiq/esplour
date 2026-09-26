import { useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { Text } from "@/components/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react-native";
import { likesApi } from "@/api/media";
import { useMovieDetail } from "@/components/movie/MovieDetailProvider";
import { MovieListItem, type MovieListItemData } from "@/components/movie/MovieListItem";
import { RandomMovieButton } from "@/components/movie/RandomMovieButton";
import { watchlistApi } from "@/api/profile";

export function LikesGrid() {
  const { openMovie } = useMovieDetail();
  const queryClient = useQueryClient();
  const [filter] = useState<"all" | "session" | "solo">("all");
  const { data: likes, isLoading } = useQuery({ queryKey: ["likes", "date", filter], queryFn: () => likesApi.getLikes("date", filter) });
  const unlikeMutation = useMutation({
    mutationFn: (movie: MovieListItemData) => likesApi.removeLike(movie.Id, movie.sessionCode),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["likes"] }),
  });
  const favoriteMutation = useMutation({
    mutationFn: (movie: MovieListItemData) => watchlistApi.toggle(movie.Id, movie.mediaType ?? "movie", !movie.UserData?.IsFavorite),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["likes"] }),
  });

  return (
    <View style={styles.container}>
      <Text style={styles.count}>Showing <Text style={styles.mono}>{isLoading ? "_" : likes?.length ?? 0}</Text> {likes?.length === 1 ? "like" : "likes"}</Text>
      {isLoading ? <ActivityIndicator color="#171717" style={styles.loader} /> : likes?.length ? (
        <FlatList data={likes} keyExtractor={(item: MovieListItemData) => `${item.Id}-${item.sessionCode ?? "solo"}`} contentContainerStyle={styles.list} renderItem={({ item }: { item: MovieListItemData }) => (
          <MovieListItem
            movie={item}
            onPress={() => openMovie(item.Id, { sessionCode: item.sessionCode, mediaType: item.mediaType })}
            isLiked
            onUnlike={() => unlikeMutation.mutate(item)}
            isUnliking={unlikeMutation.isPending}
            onToggleFavorite={() => favoriteMutation.mutate(item)}
            isTogglingFavorite={favoriteMutation.isPending}
          />
        )} />
      ) : <View style={styles.empty}><Heart color="#aaa" size={28} /><Text style={styles.emptyTitle}>No likes yet</Text><Text style={styles.emptyText}>Swipe right on a movie to save it here.</Text></View>}
      <RandomMovieButton items={likes as MovieListItemData[] | undefined} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 92, backgroundColor: "#ffffff" },
  count: { color: "#71717a", fontSize: 13, marginBottom: 12 },
  mono: { color: "#171717", fontVariant: ["tabular-nums"] },
  list: { paddingBottom: 32 },
  loader: { marginTop: 32 },
  empty: { alignItems: "center", paddingTop: 100 },
  emptyTitle: { color: "#171717", fontSize: 18, fontWeight: "700", marginTop: 12 },
  emptyText: { color: "#71717a", marginTop: 6, textAlign: "center" },
});