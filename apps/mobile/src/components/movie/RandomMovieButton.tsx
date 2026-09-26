import { Pressable, StyleSheet } from "react-native";
import { Dices } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useMovieDetail } from "./MovieDetailProvider";
import type { MovieListItemData } from "./MovieListItem";

export function RandomMovieButton({ items }: { items?: MovieListItemData[] }) {
  const { openMovie } = useMovieDetail();

  function pickRandomMovie() {
    if (!items?.length) return;
    const movie = items[Math.floor(Math.random() * items.length)];
    Haptics.selectionAsync().catch(() => undefined);
    openMovie(movie.Id, { sessionCode: movie.sessionCode, mediaType: movie.mediaType });
  }

  if (!items?.length) return null;
  return (
    <Pressable style={styles.button} onPress={pickRandomMovie} accessibilityLabel="Pick a random movie">
      <Dices color="#171717" size={21} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { position: "absolute", right: 20, bottom: 20, width: 50, height: 50, alignItems: "center", justifyContent: "center", borderRadius: 25, backgroundColor: "#ffffff", shadowColor: "#000000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.16, shadowRadius: 5, elevation: 4 },
});