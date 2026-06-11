import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Fornece feedback tátil de sucesso (notificação).
 */
export const hapticsSuccess = async () => {
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch (_e) {
    // Falha silenciosa se não suportado
  }
};

/**
 * Fornece feedback tátil de erro (notificação).
 */
export const hapticsError = async () => {
  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch (_e) {
    // Falha silenciosa
  }
};

/**
 * Fornece um impacto leve (sutil).
 */
export const hapticsImpactLight = async () => {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (_e) {
    // Falha silenciosa
  }
};

/**
 * Fornece um impacto médio.
 */
export const hapticsImpactMedium = async () => {
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch (_e) {
    // Falha silenciosa
  }
};
