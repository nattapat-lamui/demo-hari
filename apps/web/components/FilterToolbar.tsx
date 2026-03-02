import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';

interface FilterToolbarProps {
  searchValue?: string;
  onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  children,
  trailing,
  className = '',
}) => {
  const { t } = useTranslation('common');
  const placeholder = searchPlaceholder ?? t('filter.search');

  return (
    <div
      className={`p-4 border-b border-border-light dark:border-border-dark bg-gray-50/50 dark:bg-gray-800/20 flex flex-col md:flex-row gap-4 items-center ${className}`}
    >
      {onSearchChange !== undefined && (
        <div className="relative flex-grow w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-light" size={18} />
          <input
            type="text"
            placeholder={placeholder}
            value={searchValue ?? ''}
            onChange={onSearchChange}
            className="w-full pl-10 pr-4 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      )}

      {children && (
        <div className="flex gap-3 flex-wrap w-full md:w-auto">{children}</div>
      )}

      {trailing && <div className="ml-auto flex items-center gap-2">{trailing}</div>}
    </div>
  );
};
