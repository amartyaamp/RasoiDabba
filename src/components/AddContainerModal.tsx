import React, { useState } from 'react';
import { X, Plus, Scale } from 'lucide-react';
import { ContainerNode } from '../types';

interface AddContainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (containerData: Partial<ContainerNode>) => Promise<void>;
  existingCount: number;
}

export const AddContainerModal: React.FC<AddContainerModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  existingCount,
}) => {
  if (!isOpen) return null;

  const nextId = `jar_00${existingCount + 1}`;
  const [id, setId] = useState(nextId);
  const [ingredient, setIngredient] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Coffee & Tea' | 'Grains' | 'Baking' | 'Spices' | 'Pantry'>('Pantry');
  const [emptyWeightG, setEmptyWeightG] = useState(180);
  const [capacityG, setCapacityG] = useState(800);
  const [lowThresholdPct, setLowThresholdPct] = useState(20);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !ingredient) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        id,
        name: name || `Jar ${existingCount + 1} - ${ingredient}`,
        ingredient,
        category,
        empty_weight_g: Number(emptyWeightG),
        capacity_g: Number(capacityG),
        low_threshold_pct: Number(lowThresholdPct),
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-5">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-stone-900 text-amber-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">Pair New Smart Jar Node</h3>
              <p className="text-xs text-stone-500">Add a BLE load cell container to the gateway.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Node Hardware ID</label>
            <input
              type="text"
              required
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900/10 focus:outline-hidden"
              placeholder="e.g. jar_006"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Ingredient Name</label>
            <input
              type="text"
              required
              value={ingredient}
              onChange={(e) => {
                setIngredient(e.target.value);
                if (!name) setName(`Jar - ${e.target.value}`);
              }}
              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900/10 focus:outline-hidden"
              placeholder="e.g. Chia Seeds"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900/10 focus:outline-hidden"
            >
              <option value="Coffee & Tea">Coffee & Tea</option>
              <option value="Grains">Grains</option>
              <option value="Baking">Baking</option>
              <option value="Spices">Spices</option>
              <option value="Pantry">Pantry</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Empty Tare (g)</label>
              <input
                type="number"
                min="0"
                value={emptyWeightG}
                onChange={(e) => setEmptyWeightG(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900/10 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Max Capacity (g)</label>
              <input
                type="number"
                min={emptyWeightG + 50}
                value={capacityG}
                onChange={(e) => setCapacityG(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900/10 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-stone-700">Low Alert Threshold (%)</label>
              <span className="font-mono font-bold text-stone-900">{lowThresholdPct}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={lowThresholdPct}
              onChange={(e) => setLowThresholdPct(Number(e.target.value))}
              className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !ingredient}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Register Node</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
