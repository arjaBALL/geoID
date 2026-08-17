import { View } from "react-native";
import BottomNavbar from "../components/Navbar";
export default function History() {
  return (
    <View className="flex-1 bg-[#0F1620] p-5">
      <View className="absolute bottom-0 left-0 right-0">
        <BottomNavbar />
      </View>
    </View>
  );
}
