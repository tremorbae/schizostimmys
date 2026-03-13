import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MUSIC_DIR = path.join(process.cwd(), 'public', 'music');
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.webm'];

export async function GET() {
  try {
    if (!fs.existsSync(MUSIC_DIR)) {
      return NextResponse.json({ name: "it's psychotherapy", tracks: [] });
    }

    const files = fs.readdirSync(MUSIC_DIR).filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return AUDIO_EXTENSIONS.includes(ext);
    });

    const tracks = files.map((file, index) => {
      const nameWithoutExt = path.basename(file, path.extname(file));

      let artist = 'unknown';
      let title = nameWithoutExt.trim();

      // Split on " - " to get artist and title
      if (nameWithoutExt.includes(' - ')) {
        const parts = nameWithoutExt.split(' - ');
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      }

      return {
        id: String(index + 1),
        title,
        artist,
        src: `/music/${encodeURIComponent(file)}`,
      };
    });

    return NextResponse.json({
      name: "it's psychotherapy",
      tracks,
    });
  } catch (error) {
    return NextResponse.json({ name: "it's psychotherapy", tracks: [] });
  }
}
