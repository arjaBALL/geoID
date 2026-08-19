import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { Stack } from "expo-router";
import { Pressable, Text, View } from "react-native";
import History from "../pages/History";

export default function historyPage() {
  return (
    <>
      <Stack.Screen
        options={{
          headerStyle: {
            backgroundColor: "#0F1620",
          },

          headerTitle: () => (
            <Text
              style={{
                fontFamily: "Outfit_700Bold",
                fontSize: 20,
                color: "#FFFFFF",
              }}>
              Welcome back
            </Text>
          ),

          headerRight: () => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
              }}>
              {/* Notification */}
              <Pressable
                onPress={() => console.log("Notifications")}
                style={{
                  width: 38,
                  height: 38,
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                <FontAwesome6
                  name="bell"
                  size={21}
                  color="#FFFFFF"
                  iconStyle="solid"
                />

                {/* Notification badge */}
                <View
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 3,
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: "#38BDF8",
                  }}
                />
              </Pressable>

              {/* User Avatar */}
              <Pressable
                onPress={() => console.log("Open profile")}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  backgroundColor: "#38BDF8",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                <Text
                  style={{
                    fontFamily: "Outfit_700Bold",
                    fontSize: 14,
                    color: "#0F1620",
                  }}>
                  JD
                </Text>
              </Pressable>
            </View>
          ),
        }}
      />

      <History />
    </>
  );
}
