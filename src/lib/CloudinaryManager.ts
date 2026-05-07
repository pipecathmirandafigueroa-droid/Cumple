import { Cloudinary } from "@cloudinary/url-gen";
import { concatenate } from "@cloudinary/url-gen/actions/videoEdit";
import { videoSource } from "@cloudinary/url-gen/qualifiers/videoSource";
import { format, quality } from "@cloudinary/url-gen/actions/delivery";
import { codec } from "@cloudinary/url-gen/actions/transcode";
import { resize } from "@cloudinary/url-gen/actions/resize";
import { source } from "@cloudinary/url-gen/actions/overlay";
import { audio } from "@cloudinary/url-gen/qualifiers/source";
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
      .resize(resize.fill().width(720).height(1280)) // Formato Vertical Reels/TikTok
      .transcode(codec('h264'))
      .delivery(quality('auto'))
      .delivery(format('auto'));

    // 2. Concatenación de videos adicionales
    for (let i = 1; i < publicIds.length; i++) {
      // Nota: En la versión actual de @cloudinary/url-gen, el concatenate 
      // se puede aplicar como una acción de edición de video.
      myVideo.videoEdit(
        concatenate(videoSource(publicIds[i]).transformation(
          // Aplicamos la misma normalización a cada clip concatenado
          this.cld.video(publicIds[i]).resize(resize.fill().width(720).height(1280)).transcode(codec('h264')).delivery(quality('auto')).delivery(format('auto'))
        ))
      );
    }

    // 3. Audio Overlay (bday_theme)
    if (audioPublicId) {
        // En @cloudinary/url-gen, los audios se añaden como capas
        myVideo.overlay(
            source(audio(audioPublicId))
        );
    }

    return myVideo.toURL();
  }
}

export const cloudinaryManager = new CloudinaryManager();
