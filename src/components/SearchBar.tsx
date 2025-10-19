import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Поиск по словам, тегам...",
  className = ""
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <div className={`flex items-center bg-gray-800 rounded-lg border-2 transition-colors ${
        isFocused ? 'border-emerald-500' : 'border-transparent'
      }`}>
        <Search className="w-4 h-4 text-gray-400 ml-3" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-3 py-3 text-gray-100 placeholder-gray-500 focus:outline-none"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="p-2 text-gray-400 hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;