import { forwardRef } from "react";
import {
  StyleSheet,
  StyleProp,
  Text as NativeText,
  TextInput as NativeTextInput,
  TextStyle,
} from "react-native";

const fontFamilies: Record<string, string> = {
  normal: "GoogleSans_400Regular",
  "400": "GoogleSans_400Regular",
  "500": "GoogleSans_500Medium",
  "600": "GoogleSans_600SemiBold",
  "700": "GoogleSans_700Bold",
  "800": "GoogleSans_700Bold",
  "900": "GoogleSans_700Bold",
  bold: "GoogleSans_700Bold",
};

function getFontFamily(style: StyleProp<TextStyle>) {
  const flattenedStyle = StyleSheet.flatten(style);
  return (
    flattenedStyle?.fontFamily ??
    fontFamilies[flattenedStyle?.fontWeight ?? "normal"] ??
    fontFamilies.normal
  );
}

export const Text = forwardRef<
  React.ElementRef<typeof NativeText>,
  React.ComponentProps<typeof NativeText>
>(function AppText({ style, ...props }, ref) {
  return (
    <NativeText
      ref={ref}
      {...props}
      style={[style, { fontFamily: getFontFamily(style) }]}
    />
  );
});

export const TextInput = forwardRef<
  React.ElementRef<typeof NativeTextInput>,
  React.ComponentProps<typeof NativeTextInput>
>(function AppTextInput({ style, ...props }, ref) {
  return (
    <NativeTextInput
      ref={ref}
      {...props}
      style={[style, { fontFamily: getFontFamily(style) }]}
    />
  );
});