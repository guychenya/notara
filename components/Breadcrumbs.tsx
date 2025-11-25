import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  noteTitle: string;
  tags?: string[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ noteTitle, tags }) => {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4 flex-wrap">
      <Home className="w-4 h-4" />
      <ChevronRight className="w-3 h-3" />
      <span className="text-gray-700 dark:text-gray-300">Notes</span>
      {tags && tags.length > 0 && (
        <>
          <ChevronRight className="w-3 h-3" />
          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded text-xs">
            {tags[0]}
          </span>
        </>
      )}
      <ChevronRight className="w-3 h-3" />
      <span className="font-medium text-gray-900 dark:text-gray-100">{noteTitle || 'Untitled'}</span>
    </div>
  );
};
