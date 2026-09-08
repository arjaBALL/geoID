// app/main.jsx
import { usePathname } from "expo-router";
import { View } from "react-native";
import BottomNavbar from "../_components/Navbar";
import History from "../_pages/History";
import Home from "../_pages/Home";
import Profile from "../_pages/Profile";

export default function Main() {
  const pathname = usePathname();

  const renderPage = () => {
    switch (pathname) {
      case "/tabs/history":
        return <History />;
      case "/tabs/profile":
        return <Profile />;
      case "/tabs/home":
      default:
        return <Home />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F1620" }}>
      {renderPage()}

      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
        <BottomNavbar />
      </View>
    </View>
  );
}
