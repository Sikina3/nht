import Colors from "@/constants/Colors";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View
} from "react-native";

const { width, height } = Dimensions.get("window");

interface AuthBackgroundProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

export default function AuthBackground({
  children,
  showHeader = true,
  showFooter = true,
}: AuthBackgroundProps) {
  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={["#4A6FA5", "#34495E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerCurve}
          />
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>

      {showFooter && (
        <View style={styles.footerContainer}>
          <LinearGradient
            colors={["#34495E", "#2C3E50"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.footerCurve}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    width: width,
    height: height * 0.25,
    overflow: "hidden",
  },
  headerCurve: {
    position: "absolute",
    top: -height * 0.1,
    width: width,
    height: height * 0.35,
    borderBottomLeftRadius: width * 0.5,
    borderBottomRightRadius: width * 0.5,
    transform: [{ scaleX: 1.5 }],
  },
  footerContainer: {
    position: "absolute",
    bottom: 0,
    width: width,
    height: height * 0.2,
    overflow: "hidden",
  },
  footerCurve: {
    position: "absolute",
    bottom: -height * 0.1,
    width: width,
    height: height * 0.3,
    borderTopLeftRadius: width * 0.5,
    borderTopRightRadius: width * 0.5,
    transform: [{ scaleX: 1.5 }],
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: height * 0.1,
    paddingBottom: height * 0.1,
    paddingHorizontal: 30,
    justifyContent: "center",
  },
});
