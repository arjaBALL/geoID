import { useState } from "react";
import { TextInput } from "react-native";

export default function Input({ type = "text", className = "", ...props }) {
  const [isFocused, setIsFocused] = useState(false);

  const inputConfig = {
    text: {
      keyboardType: "default",
      secureTextEntry: false,
      autoCapitalize: "sentences",
      autoCorrect: true,
    },

    email: {
      keyboardType: "email-address",
      secureTextEntry: false,
      autoCapitalize: "none",
      autoCorrect: false,
    },

    password: {
      keyboardType: "default",
      secureTextEntry: true,
      autoCapitalize: "none",
      autoCorrect: false,
    },

    number: {
      keyboardType: "numeric",
      secureTextEntry: false,
      autoCapitalize: "none",
      autoCorrect: false,
    },
  };

  const config = inputConfig[type] ?? inputConfig.text;

  return (
    <TextInput
      {...config}
      {...props}
      onFocus={(event) => {
        setIsFocused(true);
        props.onFocus?.(event);
      }}
      onBlur={(event) => {
        setIsFocused(false);
        props.onBlur?.(event);
      }}
      className={`
        w-full
        rounded-2xl
        border
        ${isFocused ? "border-[#38BDF8]" : "border-white/10"}
        bg-[#1D2833]
        px-4
        py-3.5
        font-outfit-medium
        text-base
        font-semibold
        text-white
        ${className}
      `}
      placeholderTextColor="#94A3B8"
    />
  );
}
