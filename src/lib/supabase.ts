import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('[SUPABASE] Initializing with:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[SUPABASE] Missing environment variables');
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'sb-memorycatalog-auth',
    flowType: 'pkce',
  },
  global: {
    headers: {
      'x-application-name': 'memorycatalog',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

supabase.auth.onAuthStateChange((event, session) => {
  console.log('[SUPABASE] Auth state change:', {
    event,
    hasSession: !!session,
    user: session?.user?.email,
  });
});

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