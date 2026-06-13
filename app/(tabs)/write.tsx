import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import AuthInput from "@/components/ui/AuthInput";
import GradientButton from "@/components/ui/GradientButton";
import IconCircle from "@/components/ui/IconCircle";
import ModalActionButtons from "@/components/ui/ModalActionButtons";
import ModalSheet from "@/components/ui/ModalSheet";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text as RNText,
  TextInput,
  TouchableOpacity,
} from "react-native";

const { width, height } = Dimensions.get('window');

const CATEGORIES = [
  { label: "Fitiavana (Amour)", value: "fitiavana" },
  { label: "Mampalahelo (Triste)", value: "mampalahelo" },
  { label: "Mampatahoatra (Horreur)", value: "mampatahoatra" },
  { label: "Hafa (Autre)", value: "hafa" },
];

export default function WriteScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const theme = useColorScheme() ?? "light";
  const [image, setImage] = useState<string | null>(null);
  const [titre, setTitre] = useState("");
  const [sousTitre, setSousTitre] = useState("");
  const [contenu, setContenu] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showBecomeWriterModal, setShowBecomeWriterModal] = useState(false);
  const [biographie, setBiographie] = useState("");

  const wordCount = contenu.trim() ? contenu.trim().split(/\s+/).length : 0;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "Nous avons besoin de permission pour accéder à vos photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setImage(null);
  };

  const handlePublish = async () => {
    if (!user) {
      Alert.alert("Erreur", "Connectez-vous pour publier.");
      return;
    }
    if (!titre.trim()) {
      Alert.alert("Erreur", "Titre manquant.");
      return;
    }
    if (!selectedCategory) {
      Alert.alert("Erreur", "Catégorie manquante.");
      return;
    }
    if (!contenu.trim()) {
      Alert.alert("Erreur", "Contenu vide.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("titre", titre);
      formData.append("description", sousTitre || titre);
      formData.append("categories", selectedCategory!);
      formData.append("auteurId", user!.id.toString());
      formData.append("prixCoins", "0");

      if (image) {
        const imageExtension = image.split(".").pop() || "jpg";
        const imageName = `cover_${Date.now()}.${imageExtension}`;
        formData.append("image", {
          uri: image,
          type: `image/${imageExtension}`,
          name: imageName,
        } as any);
      }

      const storyResponse = await api.post("/stories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const storyId = storyResponse.data.id;
      const chapterData = {
        sousTitre: sousTitre || "Chapitre 1",
        contenu: contenu,
        numeroChapitre: 1,
        histoireId: storyId,
        coutCoins: 0,
      };

      await api.post("/chapters/add", chapterData);

      Alert.alert("Succès !", "Histoire publiée !");
      setImage(null);
      setTitre("");
      setSousTitre("");
      setContenu("");
      setSelectedCategory(null);
      router.push("/");
    } catch (error: any) {
      Alert.alert("Erreur", "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBecomeWriter = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await api.post(`/users/${user.id}/become-writer`, {
        biographie: biographie
      });

      if (response.data) {
        // Mise à jour locale du rôle dans le contexte Auth
        await updateUser({ role: 'ecrivain', bio: biographie });
        Alert.alert("Félicitations !", "Vous êtes maintenant un écrivain. Vous pouvez commencer à publier !");
        setShowBecomeWriterModal(false);
      }
    } catch (error) {
      console.error("Erreur become writer:", error);
      Alert.alert("Erreur", "Impossible de valider votre demande. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.role?.toLowerCase() !== 'ecrivain') {
    return (
      <View style={styles.notWriterContainer}>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
        <IconCircle iconName="create-outline" />
        <Text style={[styles.notWriterTitle, { color: Colors[theme].text }]}>Espace Écrivain</Text>
        <Text style={[styles.notWriterText, { color: Colors[theme].textMuted }]}>
          Prêt à partager votre talent ?{'\n'}
          Devenez écrivain pour commencer à publier vos propres histoires.
        </Text>
        <TouchableOpacity
          style={[styles.becomeWriterBtn, { backgroundColor: Colors[theme].primary }]}
          onPress={() => setShowBecomeWriterModal(true)}
        >
          <RNText style={[styles.becomeWriterBtnText, { color: 'white' }]}>Devenir Écrivain</RNText>
        </TouchableOpacity>

        {/* Modal de biographie */}
        <ModalSheet
          visible={showBecomeWriterModal}
          onClose={() => setShowBecomeWriterModal(false)}
          animationType="fade"
        >
          <RNText style={[styles.modalTitle, { color: Colors[theme].text }]}>Parlez-nous de vous</RNText>
          <AuthInput
            label="Votre biographie ou motivation"
            value={biographie}
            onChangeText={setBiographie}
            placeholder="Ex: Passionné d'histoires d'amour et de mystères..."
            multiline
          />
          <ModalActionButtons
            onCancel={() => setShowBecomeWriterModal(false)}
            onConfirm={handleBecomeWriter}
            confirmLabel="Confirmer"
            loading={isLoading}
          />
        </ModalSheet>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: Colors[theme].background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: Colors[theme].text }]}>Nouvelle Œuvre</Text>
          <Text style={[styles.headerSubtitle, { color: Colors[theme].textMuted }]}>Laissez libre cours à votre imagination</Text>
        </View>

        <TouchableOpacity
          style={[styles.imageUpload, !image && styles.imageUploadEmpty, { backgroundColor: Colors[theme].cardBgHover, borderColor: Colors[theme].borderColor }]}
          onPress={pickImage}
        >
          {image ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.coverImage} />
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={removeImage}
              >
                <Ionicons name="trash" size={20} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadPlaceholder}>
              <View style={[styles.uploadIconCircle, { backgroundColor: Colors[theme].primaryAlpha5 }]}>
                <Ionicons name="camera-outline" size={30} color={Colors[theme].primary} />
              </View>
              <Text style={[styles.uploadText, { color: Colors[theme].textMuted }]}>
                Couverture de l'histoire
              </Text>
              <Text style={[styles.uploadSubtext, { color: Colors[theme].textHint }]}>Recommandé : 3:4 ratio</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: Colors[theme].textMuted }]}>Titre de l'histoire</Text>
          <TextInput
            style={[styles.input, { color: Colors[theme].text, backgroundColor: Colors[theme].cardBgHover, borderColor: Colors[theme].borderColor }]}
            placeholder="Ex: Le mystère de l'Imerina"
            placeholderTextColor={Colors[theme].textHint}
            value={titre}
            onChangeText={setTitre}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: Colors[theme].textMuted }]}>Genre / Catégorie</Text>
          <TouchableOpacity
            style={[styles.pickerContainer, { backgroundColor: Colors[theme].cardBgHover, borderColor: Colors[theme].borderColor }]}
            onPress={() => setShowCategoryPicker(true)}
          >
            <RNText
              style={[styles.pickerText, !selectedCategory && { color: "rgba(255,255,255,0.2)" }]}
            >
              {selectedCategory ? CATEGORIES.find(c => c.value === selectedCategory)?.label : "Choisir une catégorie"}
            </RNText>
            <Ionicons
              name="chevron-down"
              size={20}
              color="rgba(255,255,255,0.3)"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: Colors[theme].textMuted }]}>Sous-titre (Optionnel)</Text>
          <TextInput
            style={[styles.input, { color: Colors[theme].text, backgroundColor: Colors[theme].cardBgHover, borderColor: Colors[theme].borderColor }]}
            placeholder="Ex: Une épopée fantastique"
            placeholderTextColor={Colors[theme].textHint}
            value={sousTitre}
            onChangeText={setSousTitre}
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.contentLabelContainer}>
            <Text style={[styles.label, { color: Colors[theme].textMuted }]}>Texte du Chapitre 1</Text>
            <Text style={[styles.wordCount, { color: Colors[theme].textHint }]}>{wordCount} mots</Text>
          </View>
          <TextInput
            style={[styles.input, styles.contentInput, { color: Colors[theme].text, backgroundColor: Colors[theme].cardBgHover, borderColor: Colors[theme].borderColor }]}
            placeholder="Il était une fois..."
            placeholderTextColor={Colors[theme].textHint}
            multiline
            value={contenu}
            onChangeText={setContenu}
          />
        </View>

        <GradientButton
          title="Publier mon histoire"
          onPress={handlePublish}
          loading={isLoading}
          style={styles.publishButton}
        />

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Modal catégorie (bottom sheet) */}
      <ModalSheet
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        animationType="slide"
        bottomSheet
      >
        <RNText style={[styles.modalTitle, { color: Colors[theme].text }]}>Choisir une catégorie</RNText>
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.value}
            style={[
              styles.categoryOption,
              { backgroundColor: Colors[theme].cardBgHover },
              selectedCategory === category.value && [styles.categoryOptionSelected, { backgroundColor: Colors[theme].primaryAlpha5, borderColor: Colors[theme].primaryAlpha5 }],
            ]}
            onPress={() => {
              setSelectedCategory(category.value);
              setShowCategoryPicker(false);
            }}
          >
            <RNText
              style={[
                styles.categoryOptionText,
                { color: Colors[theme].text },
                selectedCategory === category.value && { color: Colors[theme].primary, fontWeight: '700' },
              ]}
            >
              {category.label}
            </RNText>
            {selectedCategory === category.value && (
              <Ionicons name="checkmark-circle" size={24} color={Colors[theme].primary} />
            )}
          </TouchableOpacity>
        ))}
      </ModalSheet>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notWriterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  notWriterTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: 'white',
    marginBottom: 12,
  },
  notWriterText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 24,
  },
  becomeWriterBtn: {
    marginTop: 30,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 16,
  },
  becomeWriterBtnText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16,
  },
  formContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 30,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 5,
  },
  imageUpload: {
    width: width * 0.45,
    height: width * 0.6,
    borderRadius: 20,
    alignSelf: 'center',
    overflow: "hidden",
    marginBottom: 30,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  imageUploadEmpty: {
    borderStyle: 'dashed',
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },
  coverImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removeImageBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadPlaceholder: {
    alignItems: "center",
    backgroundColor: "transparent",
  },
  uploadIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  uploadText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: '700',
    textAlign: "center",
    paddingHorizontal: 10,
  },
  uploadSubtext: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  label: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    marginLeft: 5,
  },
  input: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    color: "white",
    backgroundColor: "rgba(255,255,255,0.05)",
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  pickerText: {
    color: "white",
    fontSize: 16,
    fontWeight: '600',
  },
  contentLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: "transparent",
  },
  wordCount: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    fontWeight: '600',
  },
  contentInput: {
    height: 200,
    textAlignVertical: "top",
    paddingTop: 16,
  },
  publishButton: {
    height: 60,
    borderRadius: 20,
    marginTop: 20,
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "white",
    marginBottom: 20,
    textAlign: "center",
  },
  categoryOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  categoryOptionSelected: {
    backgroundColor: 'rgba(229, 9, 20, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.2)',
  },
  categoryOptionText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    fontWeight: '600',
  },
});
