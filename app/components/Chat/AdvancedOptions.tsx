'use client';

import { useState } from 'react';
import { Settings, ChevronDown } from 'lucide-react';
import DynamicGeneratorForm from '@/app/containers/DynamicGeneratorForm';

const AdvancedOptions = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-t border-gray-800">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Settings size={16} />
          <span>Advanced Options</span>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="px-4 py-3 bg-gray-900/50 border-t border-gray-800 max-h-96 overflow-y-auto">
          <DynamicGeneratorForm />
        </div>
      )}
    </div>
  );
};

export default AdvancedOptions;
