/**
 * Using app.config.js instead of app.json so the backend URL can be set via
 * an env var per build/environment (dev, staging, prod) without editing
 * checked-in config. Set FANBIQ_API_URL before running `expo start` / EAS build.
 */
module.exports = ({ config }) => ({
  ...config,
  name: "fanbIQ",
  slug: "fanbiq-mobile",
  scheme: "fanbiq",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "fit",
    backgroundColor: "#000000",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.fanbiq.mobile",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "com.fanbiq.mobile",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    ["expo-video", { supportsBackgroundPlayback: false }],
  ],
  extra: {
    apiBaseUrl: process.env.FANBIQ_API_URL ?? "https://your-fanbiq-instance.example.com",
  },
});
