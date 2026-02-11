import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, ChevronDown } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  avatar?: string;
  subtitle?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  excludeValues?: string[];
  label?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  onSearch,
  isLoading = false,
  placeholder = 'Search...',
  disabled = false,
  excludeValues = [],
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined!);

  const selectedOption = options.find((o) => o.value === value);
  const filteredOptions = options.filter((o) => !excludeValues.includes(o.value));

  // Debounced search
  const handleSearchChange = useCallback(
    (term: string) => {
      setSearchTerm(term);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onSearch(term), 300);
    },
    [onSearch],
  );

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // Position the portal dropdown
  const openDropdown = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Close + reset
  const close = () => {
    setIsOpen(false);
    setMenuPosition(null);
    setSearchTerm('');
  };

  // Click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(t) &&
        menuRef.current && !menuRef.current.contains(t)
      ) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    close();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    close();
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">{label}</label>
      )}
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => (isOpen ? close() : openDropdown())}
          disabled={disabled}
          className="w-full flex items-center justify-between pl-4 pr-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer text-text-light dark:text-text-dark hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {selectedOption ? (
            <span className="flex items-center gap-2 min-w-0">
              {selectedOption.avatar && (
                <img src={selectedOption.avatar} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
              )}
              <span className="truncate">{selectedOption.label}</span>
            </span>
          ) : (
            <span className="text-text-muted-light dark:text-text-muted-dark">{placeholder}</span>
          )}
          <span className="flex items-center gap-1 shrink-0">
            {value && (
              <span onClick={handleClear} className="p-0.5 hover:bg-background-light dark:hover:bg-background-dark rounded">
                <X size={14} className="text-text-muted-light" />
              </span>
            )}
            <ChevronDown size={16} className={`text-text-muted-light transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </span>
        </button>

        {isOpen && menuPosition && createPortal(
          <div
            ref={menuRef}
            style={{ position: 'absolute', top: menuPosition.top, left: menuPosition.left, minWidth: menuPosition.width, zIndex: 99999 }}
            className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          >
            {/* Search input */}
            <div className="p-2 border-b border-border-light dark:border-border-dark">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted-light" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search employees..."
                  className="w-full pl-8 pr-3 py-1.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded text-sm text-text-light dark:text-text-dark focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Options */}
            <div className="max-h-48 overflow-y-auto py-1">
              {isLoading ? (
                <div className="px-4 py-3 text-sm text-text-muted-light dark:text-text-muted-dark text-center">Loading...</div>
              ) : filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-text-muted-light dark:text-text-muted-dark text-center">
                  {searchTerm ? 'No results found' : 'Type to search'}
                </div>
              ) : (
                filteredOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${
                      opt.value === value
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-text-light dark:text-text-dark hover:bg-background-light dark:hover:bg-background-dark'
                    }`}
                  >
                    {opt.avatar ? (
                      <img src={opt.avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                        {opt.label.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{opt.label}</p>
                      {opt.subtitle && <p className="text-xs text-text-muted-light dark:text-text-muted-dark truncate">{opt.subtitle}</p>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
      </div>
    </div>
  );
};
