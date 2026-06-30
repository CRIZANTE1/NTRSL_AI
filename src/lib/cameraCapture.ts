import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export interface CapturedPhoto {
  base64: string;
  mimeType: string;
}

/** Captura foto em base64 na memória (sem salvar em storage ou galeria). */
export async function captureFoodPhotoBase64(): Promise<CapturedPhoto | null> {
  try {
    const perm = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
    const cameraDenied = perm.camera === 'denied';
    const photosDenied = perm.photos === 'denied';
    if (cameraDenied && photosDenied) {
      return null;
    }

    const photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Prompt,
      saveToGallery: false,
    });

    if (!photo.base64String) return null;

    const format = photo.format ?? 'jpeg';
    return {
      base64: photo.base64String,
      mimeType: `image/${format}`,
    };
  } catch {
    return null;
  }
}
