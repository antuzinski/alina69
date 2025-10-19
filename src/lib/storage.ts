// src/storage.ts
import { supabase } from './supabase';

// Если хочешь — вынеси в src/config.ts
const BUCKET = 'images';          // ДОЛЖЕН совпадать с миграцией
const MAX_SIZE = 200 * 1024 * 1024; // 200MB

// Supported file types
const SUPPORTED_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  gif: ['image/gif'],
  video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov', 'video/x-msvideo', 'video/3gpp', 'video/3gpp2']
};

/** Determine media type from file */
function getMediaType(file: File): 'image' | 'gif' | 'video' | null {
  const type = file.type.toLowerCase();
  
  if (SUPPORTED_TYPES.image.includes(type)) return 'image';
  if (SUPPORTED_TYPES.gif.includes(type)) return 'gif';
  if (SUPPORTED_TYPES.video.includes(type)) return 'video';
  
  return null;
}

/** Check if file type is supported */
function isSupportedMediaType(file: File): boolean {
  return getMediaType(file) !== null;
}
export interface UploadResult {
  path: string; // относительный путь в бакете, храним в items.image_url
  url: string;  // публичный URL для рендера
  mediaType: 'image' | 'gif' | 'video';
}

/** Умеренный санитайзер имени */
function safeFilename(name: string) {
  const dot = name.lastIndexOf('.');
  const base = (dot > -1 ? name.slice(0, dot) : name)
    .replace(/[а-яё]/gi, (match) => {
      // Транслитерация кириллицы
      const map = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
      };
      return map[match.toLowerCase()] || match;
    })
    .replace(/[^a-z0-9\-_ ]/gi, '_')
    .trim();
  const ext  = dot > -1 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const trimmed = base.replace(/\s+/g, '-').slice(0, 60) || 'file';
  return ext ? `${trimmed}.${ext}` : trimmed;
}

/** Гекс-рандом для уникальности пути */
function randHex(n = 6) {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return Array.from(a).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Формирование пути: items/<itemId>/<ts>_<rand>_<filename> или <folder>/… */
function makePath(file: File, opts: { itemId?: string; folder?: string }) {
  const filename = safeFilename(file.name || 'image');
  const ts = Date.now();
  const rx = randHex(3);
  const head = opts.itemId ? `items/${opts.itemId}` : (opts.folder || 'uploads');
  return `${head}/${ts}_${rx}_${filename}`;
}

/** Получить публичный URL (теперь бакет публичный) */
export function getPublicUrl(path: string): string {
  if (!path) {
    console.warn('[STORAGE] Empty path provided to getPublicUrl');
    return '';
  }
  
  // If it's already a full URL, return as is
  if (path.startsWith('http')) {
    return path;
  }
  
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  
  // Add cache control headers hint for iOS
  const url = data.publicUrl;
  console.log('[STORAGE] Generated public URL:', { path, url });
  
  return data.publicUrl;
}

export const storage = {
  /**
   * Загрузка медиа-файла (изображение, GIF, видео) в публичный бакет `images`.
   * Рекомендуется передавать itemId — файл ляжет в items/<itemId>/…
   */
  async uploadMedia(file: File, opts: { itemId?: string; folder?: string } = {}): Promise<UploadResult> {
    try {
      // Валидация типа файла
      const mediaType = getMediaType(file);
      if (!mediaType) {
        throw new Error('Поддерживаются только изображения (JPEG/PNG/WebP), GIF и видео (MP4/WebM/MOV)');
      }
      
      if (file.size > MAX_SIZE) {
        throw new Error('Размер файла не должен превышать 200MB');
      }

      const path = makePath(file, opts);
      console.log('[STORAGE] Uploading media to public bucket', { 
        bucket: BUCKET, 
        path, 
        size: file.size, 
        type: file.type,
        mediaType 
      });

      const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
      if (error) throw new Error(`Ошибка загрузки: ${error.message}`);

      const url = getPublicUrl(data?.path ?? path);
      console.log('[STORAGE] Media upload successful, public URL:', url);
      
      return { path: data?.path ?? path, url, mediaType };
    } catch (err) {
      console.error('[STORAGE] Media upload failed:', err);
      throw err;
    }
  },

  // Backward compatibility
  async uploadImage(file: File, opts: { itemId?: string; folder?: string } = {}): Promise<UploadResult> {
    return this.uploadMedia(file, opts);
  },

  /**
   * Сменить медиа-файл: сначала загрузка нового, потом безопасное удаление старого (если передан oldPath).
   * Возвращает новый { path, url }.
   */
  async replaceMedia(file: File, oldPath?: string | null, opts: { itemId?: string; folder?: string } = {}): Promise<UploadResult> {
    const uploaded = await this.uploadMedia(file, opts);
    if (oldPath) {
      try {
        await this.deleteMedia(oldPath);
      } catch (e) {
        // не критично — просто логируем
        console.warn('[STORAGE] Old file delete failed:', e);
      }
    }
    return uploaded;
  },

  // Backward compatibility
  async replaceImage(file: File, oldPath?: string | null, opts: { itemId?: string; folder?: string } = {}): Promise<UploadResult> {
    return this.replaceMedia(file, oldPath, opts);
  },

  /** Удаление файла по path */
  async deleteMedia(path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage.from(BUCKET).remove([path]);
      if (error) throw new Error(error.message);
      return true;
    } catch (err) {
      console.error('[STORAGE] Delete failed:', err);
      return false;
    }
  },

  // Backward compatibility
  async deleteImage(path: string): Promise<boolean> {
    return this.deleteMedia(path);
  },

  /** Получить публичный URL */
  getPublicUrl(path: string): string {
    return getPublicUrl(path);
  },
};