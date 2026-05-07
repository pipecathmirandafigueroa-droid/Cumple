import { Cloudinary, VideoTransformation } from "@cloudinary/url-gen";
import { concatenate } from "@cloudinary/url-gen/actions/videoEdit";
import { video, audio } from "@cloudinary/url-gen/qualifiers/source";
import { format, quality } from "@cloudinary/url-gen/actions/delivery";
import { videoCodec } from "@cloudinary/url-gen/actions/transcode";
import { h264 } from "@cloudinary/url-gen/qualifiers/videoCodec";
import { fill } from "@cloudinary/url-gen/actions/resize";
import { source } from "@cloudinary/url-gen/actions/overlay";
import { Position } from "@cloudinary/url-gen/qualifiers/position";
import { compass } from "@cloudinary/url-gen/qualifiers/gravity";

/**
 * CloudinaryManager Pro
 * Maneja la lógica de generación de memorias de alto nivel.
 */
export class CloudinaryManager {
  private cld: Cloudinary;

  constructor() {
    this.cld = new Cloudinary({
      cloud: {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      },
    });
  }

  /**
   * Genera una URL de compilado profesional.
   * @param publicIds Array de IDs de video en orden.
   * @param audioPublicId ID del audio de fondo.
   */
  generateMemoryUrl(publicIds: string[], audioPublicId: string = 'bday_theme'): string {
    if (publicIds.length === 0) return '';

    // El primer video es el base
    const myVideo = this.cld.video(publicIds[0]);

    // 1. Normalización Crítica (Recomendada por el Prompt Maestro)
    myVideo
      .resize(fill().width(720).height(1280)) // Formato Vertical Reels/TikTok
      .transcode(videoCodec(h264()))
      .delivery(quality('auto'))
      .delivery(format('auto'));

    // 2. Concatenación de videos adicionales
    for (let i = 1; i < publicIds.length; i++) {
      myVideo.videoEdit(
        concatenate(video(publicIds[i]).transformation(
          // Aplicamos la misma normalización a cada clip concatenado usando VideoTransformation
          new VideoTransformation()
            .resize(fill().width(720).height(1280))
            .transcode(videoCodec(h264()))
            .delivery(quality('auto'))
            .delivery(format('auto'))
        ))
      );
    }

    // 3. Audio Overlay (bday_theme)
    // Nota: Si el audio no existe en Cloudinary, la URL puede fallar.
    // En una implementación real, este ID debería ser validado o subido previamente.
    if (audioPublicId && audioPublicId !== 'none') {
        try {
            myVideo.overlay(
                source(audio(audioPublicId))
            );
        } catch (e) {
            console.warn("No se pudo añadir el audio overlay:", e);
        }
    }

    return myVideo.toURL();
  }
}

export const cloudinaryManager = new CloudinaryManager();
