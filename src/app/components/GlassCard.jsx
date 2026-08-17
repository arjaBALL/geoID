import { BlurView } from "expo-blur";
import { StyleSheet, View } from "react-native";

export default function GlassCard({
  children,
  style,
  contentStyle,
  radius = 12,
  intensity = 35,
}) {
  return (
    <BlurView
      intensity={intensity}
      tint="dark"
      style={[styles.card, { borderRadius: radius }, style]}>
      <View style={[styles.overlay, { borderRadius: radius }, contentStyle]}>
        {children}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  overlay: {
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
});
