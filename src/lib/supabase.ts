import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Диагностика env переменных для дебага
console.log('[SUPABASE] Environment check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'missing',
  key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 30)}...` : 'missing',
  // Показываем полные значения для диагностики
  fullUrl: supabaseUrl,
  fullKey: supabaseAnonKey,
  urlType: typeof supabaseUrl,
  keyType: typeof supabaseAnonKey
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[SUPABASE] Missing environment variables:', {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'present' : 'missing'
  });
  throw new Error(`Missing Supabase environment variables. URL: ${!!supabaseUrl}, Key: ${!!supabaseAnonKey}`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

console.log('[SUPABASE] Client created successfully');

// Types
export type ItemType = 'text' | 'image' | 'quote';

export type MediaType = 'image' | 'gif' | 'video';

export interface Folder {
  id: string;
  name: string;
  slug: string;
  parent_id?: string;
  path?: string;
  level: number;
  content_types: string[];
  created_at: string;
  parent?: Folder;
  children?: Folder[];
}

export interface Item {
  id: string;
  type: ItemType;
  title?: string;
  body?: string;
  preview?: string;
  image_url?: string;
  folder_id?: string;
  folder?: Folder;
  media_type?: MediaType;
  tags: string[];
  people: string[];
  taken_at?: string;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  hash?: string;
  is_draft: boolean;
  reactions?: {
    heart: number;
    eyes: number;
    grinning: number;
    bird: number;
  };
}