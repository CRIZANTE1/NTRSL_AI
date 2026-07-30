import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export interface CapturedPhoto {
  base64: string;
  mimeType: string;
}

/** Mensagens que indicam cancelamento pelo usuário — não devem virar erro visível. */
const CANCEL_MESSAGES = [
  'cancelled',
  'canceled',
  'user cancelled',
  'user canceled',
  'no image picked',
  'no photo',
  'dismissed',
];

function isCancelError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  const msg = e.message.toLowerCase();
  return CANCEL_MESSAGES.some((c) => msg.includes(c));
}

/**
 * Captura foto em base64 na memória (sem salvar em storage ou galeria).
 * Retorna `null` se o usuário cancelar.
 * Lança erro se houver falha real (permissão negada, câmera indisponível, etc.).
 */
export async function captureFoodPhotoBase64(): Promise<CapturedPhoto | null> {
  const perm = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
  const cameraDenied = perm.camera === 'denied';
  const photosDenied = perm.photos === 'denied';
  if (cameraDenied && photosDenied) {
    throw new Error('Permissão de câmera negada. Ative nas configurações do dispositivo.');
  }

  try {
    const photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Prompt,
      saveToGallery: false,
    });

    if (!photo.base64String) {
      throw new Error('Não foi possível obter a imagem. Tente novamente.');
    }

    const format = photo.format ?? 'jpeg';
    return {
      base64: photo.base64String,
      mimeType: `image/${format}`,
    };
  } catch (e) {
    if (isCancelError(e)) return null;
    throw e;
  }
}
