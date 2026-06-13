import AsyncStorage from "@react-native-async-storage/async-storage";

export interface DownloadedChapter {
    id: number;
    numeroChapitre: number;
    sousTitre: string;
    contenu: string;
}

export interface DownloadedStory {
    id: number;
    titre: string;
    description: string;
    photoCouverture: string | null;
    categories: string;
    auteurNom: string;
    chapters: DownloadedChapter[];
    downloadedAt: string;
    totalChapters: number;
}

export interface ReadingProgress {
    storyId: number;
    storyTitle: string;
    storyImage: string | null;
    auteurNom: string;
    chapterId: number;
    chapterNumber: number;
    chapterTitle: string;
    currentPage: number;
    totalPages: number;
    progress: number; 
    lastReadAt: string;
}

const DOWNLOADS_INDEX_KEY = "nht_downloads_index"; 
const DOWNLOAD_PREFIX = "nht_story_";
const PROGRESS_INDEX_KEY = "nht_progress_index";
const PROGRESS_PREFIX = "nht_progress_";

export async function saveDownload(story: DownloadedStory): Promise<void> {
    try {
        const key = `${DOWNLOAD_PREFIX}${story.id}`;
        await AsyncStorage.setItem(key, JSON.stringify(story));

        const index = await getDownloadIndex();
        if (!index.includes(story.id)) {
            index.push(story.id);
            await AsyncStorage.setItem(DOWNLOADS_INDEX_KEY, JSON.stringify(index));
        }
    } catch (e) {
        console.error("downloadService.saveDownload:", e);
        throw e;
    }
}

async function getDownloadIndex(): Promise<number[]> {
    try {
        const raw = await AsyncStorage.getItem(DOWNLOADS_INDEX_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export async function getAllDownloads(): Promise<DownloadedStory[]> {
    try {
        const index = await getDownloadIndex();
        const stories: DownloadedStory[] = [];
        for (const id of index) {
            const raw = await AsyncStorage.getItem(`${DOWNLOAD_PREFIX}${id}`);
            if (raw) stories.push(JSON.parse(raw));
        }
        return stories.sort(
            (a, b) =>
                new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime()
        );
    } catch (e) {
        console.error("downloadService.getAllDownloads:", e);
        return [];
    }
}

export async function getDownload(storyId: number): Promise<DownloadedStory | null> {
    try {
        const raw = await AsyncStorage.getItem(`${DOWNLOAD_PREFIX}${storyId}`);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export async function deleteDownload(storyId: number): Promise<void> {
    try {
        await AsyncStorage.removeItem(`${DOWNLOAD_PREFIX}${storyId}`);
        const index = await getDownloadIndex();
        const newIndex = index.filter((id) => id !== storyId);
        await AsyncStorage.setItem(DOWNLOADS_INDEX_KEY, JSON.stringify(newIndex));
    } catch (e) {
        console.error("downloadService.deleteDownload:", e);
        throw e;
    }
}

export async function isDownloaded(storyId: number): Promise<boolean> {
    const index = await getDownloadIndex();
    return index.includes(storyId);
}

export async function saveReadingProgress(progress: ReadingProgress): Promise<void> {
    try {
        const key = `${PROGRESS_PREFIX}${progress.storyId}`;
        await AsyncStorage.setItem(key, JSON.stringify(progress));

        const index = await getProgressIndex();
        if (!index.includes(progress.storyId)) {
            index.push(progress.storyId);
            await AsyncStorage.setItem(PROGRESS_INDEX_KEY, JSON.stringify(index));
        }
    } catch (e) {
        console.error("downloadService.saveReadingProgress:", e);
    }
}

async function getProgressIndex(): Promise<number[]> {
    try {
        const raw = await AsyncStorage.getItem(PROGRESS_INDEX_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export async function getAllReadingProgress(): Promise<ReadingProgress[]> {
    try {
        const index = await getProgressIndex();
        const list: ReadingProgress[] = [];
        for (const id of index) {
            const raw = await AsyncStorage.getItem(`${PROGRESS_PREFIX}${id}`);
            if (raw) list.push(JSON.parse(raw));
        }
        return list.sort(
            (a, b) =>
                new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime()
        );
    } catch (e) {
        console.error("downloadService.getAllReadingProgress:", e);
        return [];
    }
}

export async function getReadingProgress(storyId: number): Promise<ReadingProgress | null> {
    try {
        const raw = await AsyncStorage.getItem(`${PROGRESS_PREFIX}${storyId}`);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export async function deleteReadingProgress(storyId: number): Promise<void> {
    try {
        await AsyncStorage.removeItem(`${PROGRESS_PREFIX}${storyId}`);
        const index = await getProgressIndex();
        const newIndex = index.filter((id) => id !== storyId);
        await AsyncStorage.setItem(PROGRESS_INDEX_KEY, JSON.stringify(newIndex));
    } catch (e) {
        console.error("downloadService.deleteReadingProgress:", e);
    }
}

export function estimateDownloadSize(story: DownloadedStory): string {
    const totalChars = story.chapters.reduce(
        (acc, ch) => acc + (ch.contenu?.length ?? 0),
        0
    );
    const kb = Math.round(totalChars / 1024);
    return kb > 1024 ? `${(kb / 1024).toFixed(1)} Mo` : `${kb} Ko`;
}
