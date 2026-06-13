/**
 * Helper centralisé pour construire les URLs d'images du backend NHT.
 * 
 * Le backend peut retourner photoCouverture sous plusieurs formats :
 *   - null / undefined → on retourne une image placeholder
 *   - URL complète : "https://backend-nht.onrender.com/uploads/image.jpg"
 *   - Chemin avec /uploads/ : "/uploads/image.jpg" ou "uploads/image.jpg"
 *   - Nom de fichier seul : "image.jpg" ou "1710000000000-image.jpg"
 */

export const BASE_URL = "https://nht.blocsland.com";
export const PLACEHOLDER_IMAGE = "https://picsum.photos/seed/nht/400/600";

export function getImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath) return PLACEHOLDER_IMAGE;

    // Déjà une URL complète
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        return imagePath;
    }

    // Chemin commençant par /uploads/ ou uploads/
    if (imagePath.startsWith("/uploads/") || imagePath.startsWith("uploads/")) {
        const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
        return `${BASE_URL}${cleanPath}`;
    }

    // Nom de fichier seul → on ajoute /uploads/
    return `${BASE_URL}/uploads/${imagePath}`;
}
