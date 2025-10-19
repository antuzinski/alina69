import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useItemNavigation } from '../hooks/useItemNavigation';
import { Item } from '../lib/supabase';

interface ItemNavigationProps {
  currentItem: Item;
}

const ItemNavigation: React.FC<ItemNavigationProps> = ({ currentItem }) => {
  const { previousItem, nextItem, currentIndex, totalCount, isLoading } = useItemNavigation(currentItem);

  if (isLoading || totalCount <= 1) {
    return null;
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-800">
      <div className="flex items-center justify-between">
        {/* Previous Item */}
        <div className="flex-1">
          {previousItem ? (
            <Link
              to={`/item/${previousItem.id}`}
              className="flex items-center space-x-3 text-gray-400 hover:text-emerald-500 transition-colors group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <div className="min-w-0">
                <div className="text-xs text-gray-500 mb-1">Предыдущий</div>
                <div className="text-sm font-medium truncate">
                  {previousItem.title || 'Без названия'}
                </div>
              </div>
            </Link>
          ) : (
            <div></div>
          )}
        </div>

        {/* Position Counter */}
        <div className="text-center px-4">
          <div className="text-xs text-gray-500 mb-1">Позиция</div>
          <div className="text-sm font-medium text-gray-300">
            {currentIndex + 1} из {totalCount}
          </div>
        </div>

        {/* Next Item */}
        <div className="flex-1 flex justify-end">
          {nextItem ? (
            <Link
              to={`/item/${nextItem.id}`}
              className="flex items-center space-x-3 text-gray-400 hover:text-emerald-500 transition-colors group text-right"
            >
              <div className="min-w-0">
                <div className="text-xs text-gray-500 mb-1">Следующий</div>
                <div className="text-sm font-medium truncate">
                  {nextItem.title || 'Без названия'}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemNavigation;