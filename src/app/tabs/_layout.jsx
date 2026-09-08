import { Redirect, Stack, useRootNavigationState } from "expo-router";
import { View } from "react-native";

import BottomNavbar from "../../_components/Navbar";
import { useAuth } from "../../_context/AuthContext";

export default function TabsLayout() {
  const { session, loading } = useAuth();
  const rootNavState = useRootNavigationState();

  if (!rootNavState?.key || loading) {
    return null;
  }

  if (!session) {
    return <Redirect href="/" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0F1620" }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          animationDuration: 200,
          contentStyle: { backgroundColor: "#0F1620" },
        }}
      />
      <View
        pointerEvents="box-none"
        style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
        <BottomNavbar />
      </View>
    </View>
  );
}
