export const BASE_URL = "https://nht.blocsland.com";
export const PLACEHOLDER_IMAGE = "https://picsum.photos/seed/nht/400/600";

export function getImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return PLACEHOLDER_IMAGE;

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  if (imagePath.startsWith("/uploads/") || imagePath.startsWith("uploads/")) {
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return `${BASE_URL}${cleanPath}`;
  }

  return `${BASE_URL}/uploads/${imagePath}`;
}
