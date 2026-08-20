import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { Stack } from "expo-router";
import { Text, View } from "react-native";
import Logs from "../pages/Download_raw";

export default function LogsPage() {
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
              Raw Logs
            </Text>
          ),

          headerRight: () => (
            <View
              style={{
                width: 38,
                height: 38,
                alignItems: "center",
                justifyContent: "center",
              }}>
              <FontAwesome6
                name="clock-rotate-left"
                size={19}
                color="#FFFFFF"
                iconStyle="solid"
              />
            </View>
          ),
        }}
      />

      <Logs />
    </>
  );
}
