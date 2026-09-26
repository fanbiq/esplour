import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/Typography";
import { useRouter } from "expo-router";
import { Settings, UserRound, X } from "lucide-react-native";

export function MenuSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const navigate = (path: "/(main)/profile" | "/(main)/session") => { onClose(); router.push(path); };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={styles.backdrop} onPress={onClose} />
    <View style={styles.sheet}><View style={styles.header}><Text style={styles.title}>Settings</Text><Pressable onPress={onClose}><X color="#171717" size={22} /></Pressable></View>
      <Pressable style={styles.item} onPress={() => navigate("/(main)/profile")}><UserRound color="#171717" size={20} /><Text style={styles.label}>Profile</Text></Pressable>
      <Pressable style={styles.item} onPress={() => navigate("/(main)/session")}><Settings color="#171717" size={20} /><Text style={styles.label}>Session settings</Text></Pressable>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({ backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }, sheet: { padding: 22, paddingBottom: 36, backgroundColor: "#ffffff", borderTopLeftRadius: 20, borderTopRightRadius: 20 }, header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }, title: { color: "#171717", fontSize: 20, fontWeight: "700" }, item: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16 }, label: { color: "#171717", fontSize: 16 } });