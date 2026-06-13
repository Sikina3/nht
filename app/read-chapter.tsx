import { Text, View } from "@/components/Themed";
import BookFlip from "@/components/reader/BookFlip";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import api from "@/services/api";
import { getDownload, saveReadingProgress } from "@/services/downloadService";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const WORDS_PER_PAGE = 150;

interface Chapter {
  id: number;
  sousTitre: string;
  contenu: string;
  numeroChapitre: number;
}

export default function ReadChapterScreen() {
  const theme = useColorScheme() ?? "light";
  const router = useRouter();
  const params = useLocalSearchParams();
  const chapterId = params.chapterId as string;
  const storyId = params.storyId as string;
  const storyTitle = params.storyTitle as string;
  const chapterNumber = params.chapterNumber as string;
  // Paramètre mode offline (passé depuis la bibliothèque hors-ligne)
  const isOffline = params.offline === "true";

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);

  // Comments and Likes
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [hasLiked, setHasLiked] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  // ── Chargement initial ────────────────────────────────────────
  // On charge le chapitre ET la dernière page lue en séquence,
  // pour éviter la race-condition qui réinitialisait la progression.
  useEffect(() => {
    initChapter();
  }, [chapterId]);

  // Auto-hide controls
  useEffect(() => {
    const timer = setTimeout(() => {
      hideControls();
    }, 3000);
    return () => clearTimeout(timer);
  }, [showControls]);

  const initChapter = async () => {
    try {
      let chapterData: Chapter | null = null;

      if (isOffline) {
        // Mode hors-ligne : lecture depuis AsyncStorage
        const story = await getDownload(parseInt(storyId));
        if (story) {
          const found = story.chapters.find((ch) => ch.id === parseInt(chapterId));
          if (found) {
            chapterData = {
              id: found.id,
              sousTitre: found.sousTitre,
              contenu: found.contenu,
              numeroChapitre: found.numeroChapitre,
            };
          }
        }
      } else {
        // ── Mode en ligne : lecture depuis l'API ───────────────
        const response = await api.get(`/chapters/story/${storyId}`);
        const allChapters: Chapter[] = response.data;
        chapterData = allChapters.find((ch) => ch.id === parseInt(chapterId)) ?? null;

        // Incrémenter les vues
        api.post(`/stories/${storyId}/view`).catch(err => console.error(err));
      }

      if (!chapterData) {
        console.error("Chapitre introuvable");
        return;
      }

      setChapter(chapterData);

      const pagesArray = splitContentIntoPages(chapterData.contenu);
      setPages(pagesArray);

      // ── Restaurer la dernière page lue (APRÈS avoir les pages) ──
      const savedPage = await loadLastReadPage();

      if (savedPage !== null && savedPage > 0) {
        // Reprendre là où on s'est arrêté — on NE réinitialise PAS à 0
        setCurrentPage(savedPage);
        // Mettre à jour la progression avec la page restaurée
        await recordProgressRaw(chapterData, pagesArray, savedPage);
      } else {
        // Première ouverture : enregistrer l'ouverture à la page 0
        await recordProgressRaw(chapterData, pagesArray, 0);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du chapitre:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const splitContentIntoPages = (content: string): string[] => {
    // La hauteur de la page ne peut contenir qu'un certain nombre de lignes.
    // Au lieu de compter juste 150 mots (qui peuvent déborder si beaucoup de retours à la ligne),
    // on va calculer virtuellement les lignes !
    const MAX_CHARS_PER_LINE = 36; // Moyenne de caractères qui rentrent sur la largeur de l'écran
    const MAX_LINES_PER_PAGE = 24; // Maximum de lignes qui rentrent dans le composant Page

    const paragraphs = content.split('\n');
    const pagesArray: string[] = [];

    let currentPageContent = "";
    let currentLineCount = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];

      if (paragraph.trim() === "") {
        currentLineCount++;
        if (currentLineCount >= MAX_LINES_PER_PAGE) {
          if (currentPageContent.trim()) pagesArray.push(currentPageContent.trim());
          currentPageContent = "";
          currentLineCount = 0;
        } else {
          currentPageContent += "\n";
        }
        continue;
      }

      const words = paragraph.split(/\s+/).filter(w => w.length > 0);
      let currentLineLength = 0;

      for (let j = 0; j < words.length; j++) {
        const word = words[j];
        const wordLength = word.length + 1; // Mot + espace

        if (currentLineLength + wordLength > MAX_CHARS_PER_LINE) {
          // Le texte passe virtuellement à la ligne suivante
          currentLineCount++;
          currentLineLength = wordLength;

          if (currentLineCount >= MAX_LINES_PER_PAGE) {
            if (currentPageContent.trim()) pagesArray.push(currentPageContent.trim());
            currentPageContent = word + " ";
            currentLineCount = 0;
          } else {
            currentPageContent += word + " ";
          }
        } else {
          currentPageContent += word + " ";
          currentLineLength += wordLength;
        }
      }

      // Fin de paragraphe
      currentLineCount += 2; // L'espace du dernier texte + 1 ligne vide
      if (currentLineCount >= MAX_LINES_PER_PAGE) {
        if (currentPageContent.trim()) pagesArray.push(currentPageContent.trim());
        currentPageContent = "";
        currentLineCount = 0;
      } else {
        // Seulement s'il ne s'agit pas du tout dernier paragraphe
        if (i !== paragraphs.length - 1) {
          currentPageContent += "\n\n";
        }
      }
    }

    if (currentPageContent.trim()) {
      pagesArray.push(currentPageContent.trim());
    }

    return pagesArray.length > 0 ? pagesArray : [""];
  };

  // Retourne le numéro de page sauvegardé, ou null si absente
  const loadLastReadPage = async (): Promise<number | null> => {
    try {
      const key = `lastPage_${storyId}_${chapterId}`;
      const savedPage = await AsyncStorage.getItem(key);
      if (savedPage !== null) {
        return parseInt(savedPage);
      }
      return null;
    } catch (error) {
      console.error("Erreur lors du chargement de la dernière page:", error);
      return null;
    }
  };

  // Enregistre la progression avec des données fraîches (évite les deps de state)
  const recordProgressRaw = async (
    chapterData: Chapter,
    pagesArray: string[],
    pageIndex: number
  ) => {
    try {
      if (!chapterData || pagesArray.length === 0) return;
      const progress = Math.round(((pageIndex + 1) / pagesArray.length) * 100);
      const storyImageRaw = await AsyncStorage.getItem(`story_cover_${storyId}`);
      const auteurNomRaw = await AsyncStorage.getItem(`story_auteur_${storyId}`);
      await saveReadingProgress({
        storyId: parseInt(storyId),
        storyTitle,
        storyImage: storyImageRaw ?? null,
        auteurNom: auteurNomRaw ?? "Auteur inconnu",
        chapterId: parseInt(chapterId),
        chapterNumber: chapterData.numeroChapitre,
        chapterTitle: chapterData.sousTitre,
        currentPage: pageIndex,
        totalPages: pagesArray.length,
        progress,
        lastReadAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("recordProgressRaw:", error);
    }
  };

  const saveCurrentPage = async (pageIndex: number) => {
    try {
      const key = `lastPage_${storyId}_${chapterId}`;
      await AsyncStorage.setItem(key, pageIndex.toString());
      if (chapter && pages.length > 0) {
        await recordProgressRaw(chapter, pages, pageIndex);
      }
    } catch (error) {
      console.error("saveCurrentPage:", error);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    saveCurrentPage(newPage);
  };

  const toggleControls = () => {
    if (showControls) {
      hideControls();
    } else {
      showControlsFunc();
    }
  };

  const showControlsFunc = () => {
    setShowControls(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const hideControls = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowControls(false);
    });
  };

  const loadComments = async () => {
    try {
      const res = await api.get(`/comments/story/${storyId}`);
      setComments(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const openComments = () => {
    setShowComments(true);
    if (!isOffline) {
      loadComments();
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !user) return;
    try {
      await api.post("/comments/add", {
        storyId: parseInt(storyId),
        userId: user.id,
        contenu: newComment
      });
      setNewComment("");
      loadComments(); // Refresh comments
    } catch (error) {
      console.error(error);
    }
  };

  const handleLikeStory = async () => {
    if (hasLiked || isOffline) return; // Prevent duplicate clicks for now
    try {
      await api.post(`/stories/${storyId}/like`);
      setHasLiked(true);
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8E97FD" />
        <Text style={styles.loadingText}>
          {isOffline ? "Chargement hors-ligne..." : "Chargement du chapitre..."}
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
        {/* Header */}
        {showControls && (
          <Animated.View style={[styles.header, { opacity: fadeAnim, backgroundColor: Colors[theme].cardBg }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={28} color={Colors[theme].text} />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={[styles.headerTitle, { color: Colors[theme].text }]} numberOfLines={1}>
                {storyTitle}
                {isOffline && (
                  <Text style={styles.offlineBadge}> 📥</Text>
                )}
              </Text>
              <Text style={[styles.headerSubtitle, { color: Colors[theme].textMuted }]}>
                Chapitre {chapterNumber}
                {chapter?.sousTitre ? ` - ${chapter.sousTitre}` : ""}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={openComments}
            >
              <Ionicons name="chatbubbles-outline" size={24} color={Colors[theme].text} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Book Flip Component */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={toggleControls}
          style={styles.bookContainer}
        >
          <BookFlip
            pages={pages}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
        </TouchableOpacity>

        {/* Progress bar */}
        {showControls && (
          <Animated.View
            style={[styles.progressContainer, { opacity: fadeAnim }]}
          >
            <View style={[styles.progressBar, { backgroundColor: Colors[theme].borderFaint }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${((currentPage + 1) / pages.length) * 100}%`, backgroundColor: Colors[theme].primary },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: Colors[theme].text }]}>
              Page {currentPage + 1} sur {pages.length}
            </Text>
          </Animated.View>
        )}

        {/* Modal pour commentaires et avis */}
        <Modal
          visible={showComments}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowComments(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
          >
            <View style={[styles.modalContent, { backgroundColor: Colors[theme].cardBg, borderColor: Colors[theme].borderColor }]}>
              <View style={styles.modalHeaderRow}>
                <Text style={[styles.modalTitle, { color: Colors[theme].text }]}>Commentaires & Avis</Text>
                <TouchableOpacity onPress={() => setShowComments(false)}>
                  <Ionicons name="close" size={24} color={Colors[theme].text} />
                </TouchableOpacity>
              </View>

              <View style={[styles.likeRow, { backgroundColor: Colors[theme].cardBgHover }]}>
                <Text style={[styles.likeText, { color: Colors[theme].text }]}>Avez-vous aimé cette histoire ?</Text>
                <TouchableOpacity onPress={handleLikeStory} activeOpacity={0.7}>
                  <Ionicons
                    name={hasLiked ? "star" : "star-outline"}
                    size={32}
                    color={hasLiked ? "#FFD700" : Colors[theme].icon}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
                {isOffline ? (
                  <Text style={[styles.offlineCommentText, { color: Colors[theme].textHint }]}>Inaccessible en mode hors-ligne</Text>
                ) : comments.length > 0 ? (
                  comments.map((comment, index) => (
                    <View key={index} style={[styles.commentItem, { backgroundColor: Colors[theme].cardBgHover }]}>
                      <View style={styles.commentHeader}>
                        <Ionicons name="person-circle-outline" size={20} color={Colors[theme].primary} />
                        <Text style={[styles.commentAuthor, { color: Colors[theme].primary }]}>{comment.utilisateur?.nom || "Utilisateur"}</Text>
                      </View>
                      <Text style={[styles.commentText, { color: Colors[theme].textMuted }]}>{comment.contenu}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.offlineCommentText, { color: Colors[theme].textHint }]}>Aucun commentaire pour l'instant. Soyez le premier !</Text>
                )}
              </ScrollView>

              {!isOffline && user && (
                <View style={styles.commentInputRow}>
                  <TextInput
                    style={[styles.commentInput, { backgroundColor: Colors[theme].cardBgHover, color: Colors[theme].text }]}
                    placeholder="Laisser un commentaire..."
                    placeholderTextColor={Colors[theme].textHint}
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                  />
                  <TouchableOpacity onPress={handlePostComment} style={[styles.commentPostBtn, { backgroundColor: Colors[theme].primary }]}>
                    <Ionicons name="send" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </Modal>

      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2C2416",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2C2416",
  },
  loadingText: {
    marginTop: 15,
    color: "#fff",
    fontSize: 14,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: "rgba(229, 9, 20, 0.70)",
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: "transparent",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  offlineBadge: {
    fontSize: 14,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  bookContainer: {
    flex: 1,
  },
  progressContainer: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#8E97FD",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: "white",
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#1A1B20",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "60%",
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "transparent",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  likeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  likeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  commentsList: {
    flex: 1,
    marginBottom: 10,
  },
  commentItem: {
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    backgroundColor: "transparent",
  },
  commentAuthor: {
    color: "#8E97FD",
    fontWeight: "bold",
    marginLeft: 6,
    fontSize: 12,
  },
  commentText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    lineHeight: 20,
  },
  offlineCommentText: {
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    marginTop: 20,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "transparent",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 12,
    color: "white",
    maxHeight: 100,
  },
  commentPostBtn: {
    backgroundColor: "#8E97FD",
    padding: 12,
    borderRadius: 12,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});
