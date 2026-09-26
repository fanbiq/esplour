import { Pressable, StyleSheet, View } from "react-native";
import { Bookmark, Heart, HeartOff, Star } from "lucide-react-native";
import { Text } from "@/components/Typography";
import { MediaImage } from "@/components/MediaImage";
import type { MediaItem } from "@/types/media";

export type MovieListItemData = MediaItem & {
  sessionCode?: string | null;
  isMatch?: boolean;
};

interface Props {
  movie: MovieListItemData;
  onPress: () => void;
  variant?: "full" | "condensed";
  isLiked?: boolean;
  onUnlike?: () => void;
  isUnliking?: boolean;
  onToggleFavorite?: () => void;
  isTogglingFavorite?: boolean;
}

export function MovieListItem({
  movie,
  onPress,
  variant = "full",
  isLiked = false,
  onUnlike,
  isUnliking = false,
  onToggleFavorite,
  isTogglingFavorite = false,
}: Props) {
  const isCondensed = variant === "condensed";
  const isFavorite = Boolean(movie.UserData?.IsFavorite);

  return (
    <Pressable onPress={onPress} style={[styles.row, isCondensed && styles.condensedRow]}>
      <View style={[styles.posterWrap, isCondensed && styles.condensedPosterWrap]}>
        <MediaImage id={movie.Id} tag={movie.ImageTags?.Primary} style={[styles.poster, isCondensed && styles.condensedPoster]} />
        {movie.isMatch && <View style={styles.matchBadge}><Text style={styles.matchText}>MATCH</Text></View>}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{movie.Name}</Text>
        <View style={styles.metadata}>
          {!!movie.ProductionYear && <Text style={styles.metaText}>{movie.ProductionYear}</Text>}
          {typeof movie.CommunityRating === "number" && <Text style={styles.metaText}>★ {movie.CommunityRating.toFixed(1)}</Text>}
          {movie.RunTimeTicks ? <Text style={styles.metaText}>{formatRuntime(movie.RunTimeTicks)}</Text> : null}
        </View>
        {!!movie.likedBy?.length && (
          <View style={styles.likedBy}>
            {movie.likedBy.slice(0, 3).map((like) => (
              <View key={`${like.userId}-${like.sessionCode}`} style={styles.avatar}>
                <Text style={styles.avatarText}>{like.userName.slice(0, 1).toUpperCase()}</Text>
              </View>
            ))}
            <Text style={styles.likedByText} numberOfLines={1}>{movie.likedBy[0].userName}{movie.likedBy.length > 1 ? ` +${movie.likedBy.length - 1}` : ""}</Text>
          </View>
        )}
        {(onUnlike || onToggleFavorite) && (
          <View style={styles.actions}>
            {onToggleFavorite && (
              <Pressable style={styles.actionButton} onPress={onToggleFavorite} disabled={isTogglingFavorite} accessibilityLabel={isFavorite ? "Remove favorite" : "Add favorite"}>
                {isFavorite ? <Bookmark size={17} color="#171717" fill="#171717" /> : <Star size={17} color="#52525b" />}
                <Text style={styles.actionText}>{isFavorite ? "Favorited" : "Favorite"}</Text>
              </Pressable>
            )}
            {onUnlike && isLiked && (
              <MovieLikeButton isLiked onPress={onUnlike} disabled={isUnliking} />
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

export function MovieLikeButton({
  isLiked,
  onPress,
  disabled = false,
  size = "compact",
}: {
  isLiked: boolean;
  onPress: () => void;
  disabled?: boolean;
  size?: "compact" | "large";
}) {
  const Icon = isLiked ? HeartOff : Heart;
  return (
    <Pressable
      style={[styles.iconButton, size === "large" && styles.largeIconButton]}
      onPress={onPress}
      disabled={disabled}
      hitSlop={size === "compact" ? 8 : 0}
      accessibilityLabel={isLiked ? "Remove like" : "Add like"}
    >
      <Icon size={17} color="#71717a" />
    </Pressable>
  );
}

function formatRuntime(ticks: number) {
  const minutes = Math.floor(ticks / 600_000_000);
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 14, padding: 12, marginBottom: 10, borderRadius: 8, borderWidth: 1, borderColor: "#e4e4e7", backgroundColor: "#ffffff" },
  condensedRow: { padding: 8, marginBottom: 8 },
  posterWrap: { position: "relative" },
  condensedPosterWrap: { width: 58, height: 82 },
  poster: { width: 76, height: 108, borderRadius: 6, backgroundColor: "#f4f4f5" },
  condensedPoster: { width: 58, height: 82 },
  matchBadge: { position: "absolute", top: -5, right: -5, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, backgroundColor: "#171717" },
  matchText: { color: "#ffffff", fontSize: 8, fontWeight: "800" },
  info: { flex: 1, minWidth: 0, justifyContent: "center" },
  title: { color: "#171717", fontSize: 15, lineHeight: 19, fontWeight: "700" },
  metadata: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 6 },
  metaText: { color: "#71717a", fontSize: 11 },
  likedBy: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  avatar: { width: 22, height: 22, borderRadius: 11, marginRight: -5, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#ffffff", backgroundColor: "#e4e4e7" },
  avatarText: { color: "#3f3f46", fontSize: 9, fontWeight: "700" },
  likedByText: { color: "#71717a", fontSize: 10, marginLeft: 10, flexShrink: 1 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  actionButton: { flexDirection: "row", alignItems: "center", gap: 5, minHeight: 30, paddingHorizontal: 8, borderRadius: 6, backgroundColor: "#f4f4f5" },
  actionText: { color: "#3f3f46", fontSize: 11, fontWeight: "600" },
  iconButton: { width: 30, height: 30, alignItems: "center", justifyContent: "center", borderRadius: 6, backgroundColor: "#f4f4f5" },
  largeIconButton: { width: 46, height: 46 },
});