// src/api.ts
import { supabase } from './supabase';
import { Item, Folder, ItemType } from './supabase';
import { toSlug } from '../utils/toSlug';
import { storage } from './storage';

// Debug logging helper
const debugLog = (operation: string, data: any) => {
  console.log(`[API] ${operation}:`, data);
};
const debugError = (operation: string, error: any) => {
  console.error(`[API ERROR] ${operation}:`, error);
};

// ── helpers ───────────────────────────────────────────────────────────────────

async function sha256Hex(input: string): Promise<string> {
  try {
    const enc = new TextEncoder().encode(input);
    const hashBuf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(hashBuf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    let h = 0;
    for (let i = 0; i < input.length; i++) {
      h = (h << 5) - h + input.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h).toString(16);
  }
}

// Нормализация значений из UI (чтобы не улетали [object Object])
function normalizeItemType(x: unknown): ItemType | undefined {
  const v =
    typeof x === 'string'
      ? x
      : (x as any)?.value ?? (x as any)?.id ?? undefined;
  if (v === 'text' || v === 'image' || v === 'quote') return v;
  return undefined;
}

function normalizeId(x: unknown): string | undefined {
  if (!x) return undefined;
  if (typeof x === 'string') return x;
  const v = (x as any)?.id ?? (x as any)?.value;
  return typeof v === 'string' ? v : undefined;
}

function normalizeTags(tags: unknown): string[] | undefined {
  if (!tags) return undefined;
  if (Array.isArray(tags)) {
    const out = tags
      .map(t =>
        typeof t === 'string'
          ? t
          : (t as any)?.value ?? (t as any)?.name ?? '',
      )
      .map(s => String(s).trim())
      .filter(Boolean);
    return out.length ? out : undefined;
  }
  // строка "tag1 tag2"
  if (typeof tags === 'string') {
    const out = tags
      .split(/\s+/)
      .map(s => s.trim())
      .filter(Boolean);
    return out.length ? out : undefined;
  }
  return undefined;
}

export interface ItemsQuery {
  type?: ItemType | { value?: string } | unknown;
  q?: string;
  folder?: string | { id?: string } | unknown;
  tags?: string[] | { value?: string; name?: string }[] | string | unknown;
  limit?: number;
  cursor?: string;
  sort?: 'created_at_desc' | 'created_at_asc' | 'title_asc';
}

export interface ItemsResponse {
  data: {
    items: Item[];
    next_cursor?: string;
  };
  error?: string;
  meta: {
    count: number;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  color: string;
  created_at: string;
  updated_at: string;
}

function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const api = {
  // Get items with filtering and search
  async getItems(query: ItemsQuery = {}): Promise<ItemsResponse> {
    // Add timeout for mobile networks
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      // нормализуем вход
      const type = normalizeItemType(query.type);
      const folderId = normalizeId(query.folder);
      const tags = normalizeTags(query.tags);
      const qText = query.q?.trim();

      console.log('[API] getItems normalized params:', {
        type,
        folderId,
        tags,
        qText,
        originalTags: query.tags
      });
      debugLog('getItems called with normalized query', {
        type,
        folderId,
        tags,
        qText,
        sort: query.sort,
        limit: query.limit,
      });

      // начинаем с select, чтобы получить FilterBuilder
      let q = supabase
        .from('items')
        .select(
          `
          *,
          folder:folders(id, name, slug)
        `,
          { count: 'exact' }
        );

      // Фильтры
      if (type) q = q.eq('type', type);
      if (folderId) q = q.eq('folder_id', folderId);
      if (tags && tags.length > 0) q = q.contains('tags', tags);

      // Exclude chat messages from regular queries unless specifically requested
      // Only exclude chat messages if we're NOT specifically looking for them
      // and we're not in a general search context
      if (!tags || (!tags.includes('chat') && !qText)) {
        q = q.not('tags', 'cs', '{"chat"}');
      }

      // Поиск (FTS) по tsvector "ts"
      if (qText) {
        q = q.textSearch('ts', qText, { type: 'websearch', config: 'simple' });
      }

      // Сортировка: пины сверху, потом taken_at desc, потом created_at desc
      const sort = query.sort || 'created_at_desc';
      if (sort === 'title_asc') {
        q = q.order('is_pinned', { ascending: false, nullsFirst: false })
             .order('title', { ascending: true, nullsFirst: true });
      } else if (sort === 'created_at_asc') {
        q = q.order('is_pinned', { ascending: false, nullsFirst: false })
             .order('created_at', { ascending: true, nullsFirst: false });
      } else {
        q = q.order('is_pinned', { ascending: false, nullsFirst: false })
             .order('taken_at', { ascending: false, nullsFirst: false })
             .order('created_at', { ascending: false, nullsFirst: false });
      }

      // Пагинация
      const limit = query.limit ?? 20;
      q = q.limit(limit);

      const { data, error, count } = await q.abortSignal(controller.signal);
      clearTimeout(timeoutId);
      
      debugLog('getItems supabase response', { data: data?.length, error, count });
      if (error) throw error;

      // Ensure items is always an array
      const items = Array.isArray(data) ? data.map(item => ({
        ...item,
        // Convert storage paths to public URLs
        image_url: item.image_url ? storage.getPublicUrl(item.image_url) : item.image_url
      })) : [];

      return {
        data: { items: items as Item[] },
        meta: { count: count ?? (data?.length ?? 0) },
      };
    } catch (error) {
      debugError('getItems', error);
      return {
        data: { items: [] },
        error: error instanceof Error ? error.message : String(error),
        meta: { count: 0 },
      };
    }
  },

  // Get single item
  async getItem(id: string): Promise<Item | null> {
    try {
      debugLog('getItem called with id', id);

      const { data, error } = await supabase
        .from('items')
        .select(
          `
          *,
          folder:folders(id, name, slug)
        `
        )
        .eq('id', id)
        .single();

      debugLog('getItem supabase response', { data: !!data, error });
      if (error) throw error;
      
      // Convert storage path to public URL
      const item = data as Item;
      if (item.image_url && !item.image_url.startsWith('http')) {
        item.image_url = storage.getPublicUrl(item.image_url);
      }
      
      return item;
    } catch (error) {
      debugError('getItem', error);
      return null;
    }
  },

  // Get folders
  async getFolders(): Promise<Folder[]> {
    try {
      debugLog('getFolders called', {});
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('name');
      debugLog('getFolders supabase response', { data: data?.length, error });
      if (error) throw error;
      return (data ?? []) as Folder[];
    } catch (error) {
      debugError('getFolders', error);
      return [];
    }
  },

  // Create item
  async createItem(item: Partial<Item>): Promise<Item | null> {
    try {
      debugLog('createItem called with item', item);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        debugError('createItem', 'No authenticated session');
        throw new Error('Not authenticated');
      }

      // Generate hash for text/quote items, but skip for chat messages
      if ((item.type === 'text' || item.type === 'quote') && item.body && !item.tags?.includes('chat')) {
        item.hash = await sha256Hex(item.body);
      }

      debugLog('createItem processed item', item);

      const { data, error } = await supabase
        .from('items')
        .insert([item])
        .select(
          `
          *,
          folder:folders(id, name, slug)
        `
        )
        .single();

      debugLog('createItem supabase response', { data: !!data, error });
      if (error) {
        debugError('createItem', error);
        throw error;
      }
      
      // Convert storage path to public URL
      const createdItem = data as Item;
      if (createdItem.image_url && !createdItem.image_url.startsWith('http')) {
        createdItem.image_url = storage.getPublicUrl(createdItem.image_url);
      }
      
      return createdItem;
    } catch (error) {
      debugError('createItem', error);
      throw error;
    }
  },

  // Update item
  async updateItem(id: string, updates: Partial<Item>): Promise<Item | null> {
    try {
      debugLog('updateItem called', { id, updates });

      // Нормализуем теги, если пришли строкой
      if ((updates as any)?.tags && Array.isArray((updates as any).tags) === false) {
        const t = String((updates as any).tags)
          .split(/\s+/)
          .map(s => s.trim())
          .filter(Boolean);
        (updates as any).tags = t;
      }

      const { data, error } = await supabase
        .from('items')
        .update(updates)
        .eq('id', id)
        .select(
          `
          *,
          folder:folders(id, name, slug)
        `
        )
        .single();

      debugLog('updateItem supabase response', { data: !!data, error });
      if (error) throw error;
      
      // Convert storage path to public URL
      const item = data as Item;
      if (item.image_url && !item.image_url.startsWith('http')) {
        item.image_url = storage.getPublicUrl(item.image_url);
      }
      
      return item;
    } catch (error) {
      debugError('updateItem', error);
      return null;
    }
  },

  // Delete item
  async deleteItem(id: string): Promise<boolean> {
    try {
      debugLog('deleteItem called with id', id);
      const { error } = await supabase.from('items').delete().eq('id', id);
      debugLog('deleteItem supabase response', { error });
      if (error) throw error;
      return true;
    } catch (error) {
      debugError('deleteItem', error);
      return false;
    }
  },

  // Create folder
  async createFolder(folderData: { 
    name: string; 
    parent_id?: string; 
    content_types?: string[] 
  }): Promise<Folder | null> {
    try {
      debugLog('createFolder called with folder', folderData);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        debugError('createFolder', 'No authenticated session');
        throw new Error('Not authenticated');
      }

      const name = folderData.name.trim();
      const slug = toSlug(name);
      const parent_id = folderData.parent_id || null;
      const content_types = folderData.content_types || [];

      debugLog('createFolder processed data', { name, slug, parent_id, content_types });

      const { data, error } = await supabase
        .from('folders')
        .insert([{ name, slug, parent_id, content_types }])
        .select('*')
        .single();

      debugLog('createFolder supabase response', { data: !!data, error });
      if (error) throw error;
      return data as Folder;
    } catch (error) {
      debugError('createFolder', error);
      throw error;
    }
  },

  // Update folder
  async updateFolder(id: string, updates: Partial<Folder>): Promise<Folder | null> {
    try {
      debugLog('updateFolder called', { id, updates });

      if (updates.name) {
        updates.slug = toSlug(updates.name);
      }

      const { data, error } = await supabase
        .from('folders')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      debugLog('updateFolder supabase response', { data: !!data, error });
      if (error) throw error;
      return data as Folder;
    } catch (error) {
      debugError('updateFolder', error);
      return null;
    }
  },

  // Delete folder
  async deleteFolder(id: string): Promise<boolean> {
    try {
      debugLog('deleteFolder called with id', id);
      const { error } = await supabase.from('folders').delete().eq('id', id);
      debugLog('deleteFolder supabase response', { error });
      if (error) throw error;
      return true;
    } catch (error) {
      debugError('deleteFolder', error);
      return false;
    }
  },

  // Add reaction to item
  async addReaction(itemId: string, reactionType: 'heart' | 'eyes' | 'grinning' | 'bird'): Promise<boolean> {
    try {
      debugLog('addReaction called', { itemId, reactionType });

      // Get current item to read current reactions
      const { data: item, error: fetchError } = await supabase
        .from('items')
        .select('reactions')
        .eq('id', itemId)
        .single();

      if (fetchError) throw fetchError;

      // Initialize reactions if null or increment existing
      const currentReactions = item.reactions || { heart: 0, eyes: 0, grinning: 0, bird: 0 };
      const newReactions = {
        ...currentReactions,
        [reactionType]: (currentReactions[reactionType] || 0) + 1
      };

      // Update the item with new reactions
      const { error: updateError } = await supabase
        .from('items')
        .update({ reactions: newReactions })
        .eq('id', itemId);

      if (updateError) throw updateError;

      debugLog('addReaction successful', { itemId, reactionType, newReactions });
      return true;
    } catch (error) {
      debugError('addReaction', error);
      return false;
    }
  },

  async getCalendarEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      const start = formatDateLocal(startDate);
      const end = formatDateLocal(endDate);

      debugLog('getCalendarEvents called', { start, end });

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .lte('start_date', end)
        .gte('end_date', start)
        .order('start_date', { ascending: true });

      if (error) throw error;
      debugLog('getCalendarEvents success', { count: data?.length });
      return (data || []) as CalendarEvent[];
    } catch (error) {
      debugError('getCalendarEvents', error);
      return [];
    }
  },

  async createCalendarEvent(event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>): Promise<CalendarEvent | null> {
    try {
      debugLog('createCalendarEvent called', event);

      const { data, error } = await supabase
        .from('calendar_events')
        .insert([event])
        .select()
        .single();

      if (error) throw error;
      debugLog('createCalendarEvent success', data);
      return data as CalendarEvent;
    } catch (error) {
      debugError('createCalendarEvent', error);
      throw error;
    }
  },

  async updateCalendarEvent(id: string, updates: Partial<Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>>): Promise<CalendarEvent | null> {
    try {
      debugLog('updateCalendarEvent called', { id, updates });

      const { data, error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      debugLog('updateCalendarEvent success', data);
      return data as CalendarEvent;
    } catch (error) {
      debugError('updateCalendarEvent', error);
      return null;
    }
  },

  async deleteCalendarEvent(id: string): Promise<boolean> {
    try {
      debugLog('deleteCalendarEvent called', { id });

      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      debugLog('deleteCalendarEvent success', { id });
      return true;
    } catch (error) {
      debugError('deleteCalendarEvent', error);
      return false;
    }
  },
};