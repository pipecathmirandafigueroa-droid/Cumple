import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { videoIds, audioId } = await responseToJSON(request);

        if (!videoIds || !Array.isArray(videoIds) || videoIds.length < 2) {
            return NextResponse.json({ error: 'Se requieren al menos 2 videos para el compilado.' }, { status: 400 });
        }

        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        if (!cloudName) {
            return NextResponse.json({ error: 'Configuración de Cloudinary no encontrada.' }, { status: 500 });
        }

        // --- CONSTRUCCIÓN DE LA URL DE TRANSFORMACIÓN ---
        // Empezamos con el primer video como base
        // Aplicamos normalización a 720x1280 (vertical) para consistencia tipo "Reels/Tiktok"
        const baseVideoId = videoIds[0];
        const normalization = 'c_fill,w_720,h_1280';
        
        let transformation = `${normalization}`;

        // Concatenar el resto de los videos
        for (let i = 1; i < videoIds.length; i++) {
            const vid = videoIds[i];
            // IMPORTANTE: Dentro de l_video, los parámetros se separan con COMAS
            transformation += `/l_video:${vid.replace(/\//g, ':')},c_fill,w_720,h_1280/fl_splice`;
        }

        // Añadir música de fondo
        if (audioId) {
            transformation += `/l_audio:${audioId.replace(/\//g, ':')}/fl_layer_apply`;
        }

        // URL Final
        const generatedUrl = `https://res.cloudinary.com/${cloudName}/video/upload/${transformation}/${baseVideoId}.mp4`;

        return NextResponse.json({ 
            success: true, 
            url: generatedUrl,
            message: 'URL generada con éxito. Cloudinary procesará la unión.'
        });

    } catch (error: any) {
        console.error('Error in memories API:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}

// Helper para parsear JSON de forma segura
async function responseToJSON(request: Request) {
    const body = await request.json();
    return body;
}
