'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import type { Material } from '@/types';

interface MaterialsListProps {
  materials: Material[];
  title?: string;
}

export function MaterialsList({ materials, title = 'Materials needed' }: MaterialsListProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  if (!materials || materials.length === 0) {
    return null;
  }

  const handleToggle = (materialId: string) => {
    setChecked((prev) => ({ ...prev, [materialId]: !prev[materialId] }));
  };

  const handleCopyList = async () => {
    const plainText = [
      title,
      ...materials.map((m) => `• ${m.quantity} ${m.unit} ${m.name}`),
    ].join('\n');

    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <div className="card p-5 mb-5 border-l-4 border-saffron-500 bg-saffron-50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-ink-900">{title}</h3>
          <p className="text-xs text-ink-400 mt-1">
            {checkedCount}/{materials.length} ready
          </p>
        </div>
        <button
          onClick={handleCopyList}
          className="flex items-center gap-1.5 text-xs font-medium text-saffron-600 hover:text-saffron-700 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy list
            </>
          )}
        </button>
      </div>

      <div className="space-y-2">
        {materials.map((material) => (
          <div
            key={material.id}
            className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-saffron-100 transition-colors"
          >
            <input
              type="checkbox"
              checked={checked[material.id] ?? false}
              onChange={() => handleToggle(material.id)}
              className="mt-0.5 flex-shrink-0 w-4 h-4 rounded accent-saffron-500 cursor-pointer"
            />
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${checked[material.id] ? 'line-through text-ink-400' : 'text-ink-800'}`}>
                {material.quantity} {material.unit} {material.name}
              </p>
            </div>
            {material.purchaseUrl && (
              <a
                href={material.purchaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-saffron-500 hover:text-saffron-700 transition-colors"
                title="Open purchase link"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
