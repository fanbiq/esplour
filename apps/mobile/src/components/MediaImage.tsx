import { useEffect, useState } from "react";
import { Image, ImageContentFit } from "expo-image";
import { ImageStyle, StyleProp } from "react-native";
import { API_BASE_URL } from "@/api/client";
import { tokenStorage } from "@/api/tokenStorage";

/**
 * fanbIQ's /api/media/image/:id endpoint is auth-gated (same as every other
 * API route) and the web app relies on the browser sending the session
 * cookie automatically. React Native's <Image> has no cookie jar, so we
 * build the full URL ourselves and attach the Bearer token as a header.
 */
export function mediaImageUrl(id: string, imageType: "Primary" | "Backdrop" | "Logo" | "Thumb" = "Primary", tag?: string) {
  const params = new URLSearchParams({ imageType });
  if (tag) params.set("tag", tag);
  return `${API_BASE_URL}/api/media/image/${id}?${params.toString()}`;
}

interface Props {
  id: string;
  imageType?: "Primary" | "Backdrop" | "Logo" | "Thumb";
  tag?: string;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
}

export function MediaImage({ id, imageType = "Primary", tag, style, contentFit = "cover" }: Props) {
  const [authHeader, setAuthHeader] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    tokenStorage.getAccessToken().then((token) => {
      if (mounted && token) setAuthHeader(`Bearer ${token}`);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Image
      source={{ uri: mediaImageUrl(id, imageType, tag), headers: authHeader ? { Authorization: authHeader } : undefined }}
      style={style}
      contentFit={contentFit}
      transition={150}
    />
  );
}
