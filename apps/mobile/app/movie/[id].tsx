import { ScrollView, View, StyleSheet, ActivityIndicator } from "react-native";
import { Text } from "@/components/Typography";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { mediaApi } from "@/api/media";
import { MediaImage } from "@/components/MediaImage";

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: item, isLoading } = useQuery({
    queryKey: ["media-item", id],
    queryFn: () => mediaApi.getItem(id),
  });

  if (isLoading || !item) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#171717" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <MediaImage id={item.Id} imageType="Backdrop" style={styles.backdrop} />
      <View style={styles.body}>
        <Text style={styles.title}>
          {item.Name} {item.ProductionYear ? `(${item.ProductionYear})` : ""}
        </Text>
        {item.Genres && <Text style={styles.genres}>{item.Genres.join(" · ")}</Text>}
        {item.Overview && <Text style={styles.overview}>{item.Overview}</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff" },
  backdrop: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#f4f4f5" },
  body: { padding: 20 },
  title: { color: "#171717", fontSize: 24, fontWeight: "800" },
  genres: { color: "#71717a", fontSize: 14, marginTop: 8 },
  overview: { color: "#52525b", fontSize: 15, lineHeight: 22, marginTop: 16 },
});
