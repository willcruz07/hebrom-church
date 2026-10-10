/** Medidas padrão das imagens enviadas no app. O cropper e as telas de exibição usam a mesma proporção. */
export type ImageSpec = { aspect: number; width: number; height: number; label: string }

/** Banner de aviso do mural e capa de evento da agenda. */
export const BANNER_IMAGE: ImageSpec = {
  aspect: 16 / 9,
  width: 1280,
  height: 720,
  label: '1280 × 720 px (16:9)',
}
