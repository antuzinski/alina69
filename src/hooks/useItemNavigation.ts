import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Item } from '../lib/supabase';

export const useItemNavigation = (currentItem: Item) => {
  // Get all items of the same type
  const { data, isLoading } = useQuery({
    queryKey: ['navigation-items', currentItem.type],
    queryFn: () => api.getItems({ 
      type: currentItem.type,
      limit: 1000 
    }),
    staleTime: 5 * 60 * 1000,
  });

  const items = data?.data.items || [];
  const currentIndex = items.findIndex(item => item.id === currentItem.id);
  
  const previousItem = currentIndex > 0 ? items[currentIndex - 1] : null;
  const nextItem = currentIndex < items.length - 1 ? items[currentIndex + 1] : null;

  return {
    previousItem,
    nextItem,
    currentIndex,
    totalCount: items.length,
    isLoading
  };
};