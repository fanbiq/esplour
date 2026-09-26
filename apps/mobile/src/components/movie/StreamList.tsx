import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { ExternalLink, X } from "lucide-react-native";
import { API_BASE_URL } from "@/api/client";
import { Text } from "@/components/Typography";

const AVAILABLE_REGIONS = ["US", "GB", "CA", "AU", "NG", "FR", "DE"];
const API_ORIGIN = API_BASE_URL.replace(/\/+$/, "");

interface Props {
  movieName: string;
  mediaType: "movie" | "tv";
  visible: boolean;
  onClose: () => void;
}

interface StreamingSource {
  source_id?: number | string;
  name: string;
  type?: string;
  price?: string;
  web_url?: string;
  logo_100px?: string;
}

interface ProviderLogo {
  Id: string;
  Name: string;
  LogoPath: string;
}

async function getJson(url: string) {
  const response = await fetch(url);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || "Unable to load streaming sources.");
  return body;
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

export function StreamList({ movieName, mediaType, visible, onClose }: Props) {
  const [selectedRegions, setSelectedRegions] = useState(["US"]);
  const [providers, setProviders] = useState<ProviderLogo[]>([]);
  const [sources, setSources] = useState<StreamingSource[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstRegion = selectedRegions[0] ?? "US";
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    getJson(`${API_ORIGIN}/api/tmdb/providers?region=${firstRegion}&type=${mediaType}`)
      .then((data) => { if (!cancelled) setProviders(data.providers ?? []); })
      .catch(() => { if (!cancelled) setProviders([]); });
    return () => { cancelled = true; };
  }, [firstRegion, mediaType, visible]);

  function toggleRegion(region: string) {
    setSelectedRegions((current) => current.includes(region)
      ? current.filter((value) => value !== region)
      : [...current, region]
    );
  }

  async function fetchSources() {
    if (!selectedRegions.length) {
      setError("Choose at least one region.");
      return;
    }
    setLoading(true);
    setError(null);
    setSources(null);
    try {
      const searchUrl = `${API_ORIGIN}/api/watchmode/search?q=${encodeURIComponent(movieName)}&type=${mediaType}`;
      const search = await getJson(searchUrl);
      const watchmodeId = search.title_results?.[0]?.id;
      if (!watchmodeId) {
        setSources([]);
        return;
      }
      const regionParam = encodeURIComponent(selectedRegions.join(","));
      const data = await getJson(`${API_ORIGIN}/api/watchmode/sources?id=${encodeURIComponent(watchmodeId)}&regions=${regionParam}`);
      setSources(Array.isArray(data) ? data : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load streaming sources.");
    } finally {
      setLoading(false);
    }
  }

  function providerLogo(source: StreamingSource) {
    const byId = source.source_id == null ? undefined : providers.find((provider) => provider.Id === String(source.source_id));
    const byName = providers.find((provider) => normalizeName(provider.Name) === normalizeName(source.name));
    const logoPath = byId?.LogoPath || byName?.LogoPath;
    return logoPath
      ? `https://image.tmdb.org/t/p/w92${logoPath}`
      : source.logo_100px;
  }

  async function openSource(url?: string) {
    if (!url) return;
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") throw new Error("Unsupported link");
      await Linking.openURL(parsedUrl.toString());
    } catch {
      Alert.alert("Couldn't open provider", "This streaming link is not available.");
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modal}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close streaming sources" />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.handle} />
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton} accessibilityLabel="Close">
              <X size={19} color="#171717" />
            </Pressable>
          </View>
          <Text style={styles.title} numberOfLines={1}>Streaming sources</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{movieName}</Text>
          <Text style={styles.label}>Regions</Text>
          <View style={styles.regions}>
            {AVAILABLE_REGIONS.map((region) => {
              const selected = selectedRegions.includes(region);
              return <Pressable key={region} onPress={() => toggleRegion(region)} style={[styles.region, selected && styles.selectedRegion]}>
                <Text style={[styles.regionText, selected && styles.selectedRegionText]}>{region}</Text>
              </Pressable>;
            })}
          </View>
          <Pressable style={styles.fetchButton} onPress={fetchSources} disabled={loading}>
            {loading ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.fetchText}>Fetch sources</Text>}
          </Pressable>
          {error && <Text style={styles.error}>{error}</Text>}
          <ScrollView style={styles.results} contentContainerStyle={styles.resultsContent}>
            {loading && <ActivityIndicator color="#171717" style={styles.resultLoader} />}
            {sources?.length === 0 && !loading && <Text style={styles.empty}>No streaming sources found.</Text>}
            {sources?.map((source, index) => {
              const logo = providerLogo(source);
              return <View key={`${source.source_id ?? source.name}-${index}`} style={styles.sourceRow}>
                {logo ? <Image source={{ uri: logo }} style={styles.logo} contentFit="cover" /> : <View style={styles.logoPlaceholder} />}
                <View style={styles.sourceInfo}>
                  <Text style={styles.sourceName} numberOfLines={1}>{source.name}</Text>
                  <Text style={styles.sourceMeta} numberOfLines={1}>{[source.type, source.price].filter(Boolean).join(" · ")}</Text>
                </View>
                {!!source.web_url && <Pressable onPress={() => openSource(source.web_url)} style={styles.openButton} accessibilityLabel={`Open ${source.name}`}>
                  <ExternalLink size={16} color="#171717" />
                </Pressable>}
              </View>;
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.42)" },
  scrim: { ...StyleSheet.absoluteFillObject },
  sheet: { height: "78%", paddingHorizontal: 20, paddingBottom: 26, backgroundColor: "#ffffff", borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  header: { height: 42, alignItems: "center", justifyContent: "center" },
  handle: { width: 38, height: 4, borderRadius: 2, backgroundColor: "#d4d4d8" },
  closeButton: { position: "absolute", right: 0, top: 7, width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#f4f4f5" },
  title: { color: "#171717", fontSize: 19, fontWeight: "800" },
  subtitle: { color: "#71717a", fontSize: 13, marginTop: 4, marginBottom: 20 },
  label: { color: "#71717a", fontSize: 11, fontWeight: "800", textTransform: "uppercase", marginBottom: 8 },
  regions: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  region: { minWidth: 43, alignItems: "center", paddingVertical: 7, paddingHorizontal: 9, borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 7, backgroundColor: "#ffffff" },
  selectedRegion: { borderColor: "#171717", backgroundColor: "#f4f4f5" },
  regionText: { color: "#52525b", fontSize: 12, fontWeight: "600" },
  selectedRegionText: { color: "#171717" },
  fetchButton: { height: 44, alignItems: "center", justifyContent: "center", marginTop: 16, borderRadius: 8, backgroundColor: "#171717" },
  fetchText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  error: { color: "#b91c1c", fontSize: 13, marginTop: 10 },
  results: { flex: 1, marginTop: 14 },
  resultsContent: { paddingBottom: 14 },
  resultLoader: { marginTop: 24 },
  empty: { color: "#71717a", textAlign: "center", marginTop: 24 },
  sourceRow: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e4e4e7" },
  logo: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#f4f4f5" },
  logoPlaceholder: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#f4f4f5" },
  sourceInfo: { flex: 1, minWidth: 0 },
  sourceName: { color: "#171717", fontSize: 14, fontWeight: "700" },
  sourceMeta: { color: "#71717a", fontSize: 12, marginTop: 4 },
  openButton: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 7, backgroundColor: "#f4f4f5" },
});