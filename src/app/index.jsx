import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import Login from "./pages/Login";

export default function Index() {
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#0F1620]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        className="flex-1 bg-[#0F1620]"
        contentContainerClassName="flex-grow justify-center px-5 py-8"
        keyboardShouldPersistTaps="handled">
        <View className="w-full rounded-2xl  p-5">
          <Login />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
