import { ActivityIndicator, Pressable, Text } from "react-native";

const Button = ({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
}) => {
  const variants = {
    primary: "bg-[#38BDF8] border-[#38BDF8]",
    secondary: "bg-[#1D2833] border-white/10",
    outline: "bg-transparent border-[#38BDF8]",
  };

  const textVariants = {
    primary: "text-[#0F1620]",
    secondary: "text-white",
    outline: "text-[#38BDF8]",
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`
        w-full
        flex-row
        items-center
        justify-center
        rounded-2xl
        border
        px-5
        py-3.5
        active:opacity-80
        ${variants[variant]}
        ${disabled ? "opacity-50" : ""}
        ${className}
      `}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? "#0F1620" : "#38BDF8"}
        />
      ) : (
        <Text
          className={`
            font-outfit-bold
            text-base
            ${textVariants[variant]}
          `}>
          {title}
        </Text>
      )}
    </Pressable>
  );
};

export default Button;
