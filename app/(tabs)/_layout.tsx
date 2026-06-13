import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import React from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

const { width } = Dimensions.get("window");

function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  focused: boolean;
  color: string;
}) {
  return (
    <View
      style={[
        styles.iconContainer,
        props.focused && styles.iconContainerFocused,
      ]}
    >
      <Ionicons
        name={props.name}
        size={props.focused ? 26 : 24}
        color={props.color}
      />
      {props.focused && <View style={styles.dot} />}
    </View>
  );
}

export default function TabLayout() {
  const theme = useColorScheme() ?? "light";
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[theme].primary,
        tabBarInactiveTintColor: Colors[theme].medium,
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors[theme].background,
          borderBottomWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: Colors[theme].text,
          fontWeight: "900",
          fontSize: 22,
        },
        headerTintColor: Colors[theme].text,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: Colors[theme].background,
          borderTopWidth: 1,
          borderTopColor: Colors[theme].borderFaint,
          elevation: 0,
          height: 100,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarBackground: () => (
          <View style={{ flex: 1, backgroundColor: Colors[theme].background }} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "NHT",
          headerTitleStyle: {
            fontWeight: "900",
            fontSize: 28,
            color: Colors[theme].primary,
            letterSpacing: -1,
          },
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon name="home-sharp" focused={focused} color={color} />
          ),
          headerRight: () => (
            <Pressable
              onPress={() => router.push("../modal")}
              style={({ pressed }) => ({
                opacity: pressed ? 0.5 : 1,
                marginRight: 20,
              })}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={Colors[theme].text}
              />
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Bibliothèque",
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon name="library-sharp" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="write"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon name="add-circle-sharp" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: "Collection",
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon name="bookmark-sharp" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon name="person-sharp" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  iconContainerFocused: {
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E50914",
    position: "absolute",
    bottom: 0,
  },
});


