import React, { useState } from 'react';
import { X, Save, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { ContainerNode } from '../types';

interface EditContainerModalProps {
  container: ContainerNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Partial<ContainerNode>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onTare: (id: string) => Promise<void>;
}

export const EditContainerModal: React.FC<EditContainerModalProps> = ({
  container,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onTare,
}) => {
  if (!isOpen || !container) return null;

  const [name, setName] = useState(container.name);
  const [ingredient, setIngredient] = useState(container.ingredient);
  const [category, setCategory] = useState(container.category);
  const [emptyWeightG, setEmptyWeightG] = useState(container.empty_weight_g);
  const [capacityG, setCapacityG] = useState(container.capacity_g);
  const [lowThresholdPct, setLowThresholdPct] = useState(container.low_threshold_pct);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTaring, setIsTaring] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        name,
        ingredient,
        category,
        empty_weight_g: Number(emptyWeightG),
        capacity_g: Number(capacityG),
        low_threshold_pct: Number(lowThresholdPct),
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleTare = async () => {
    setIsTaring(true);
    try {
      await onTare(container.id);
      setEmptyWeightG(container.raw_weight_g);
    } finally {
      setIsTaring(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Remove jar "${container.id}" (${container.ingredient}) from inventory?`)) {
      setIsDeleting(true);
      try {
        await onDelete(container.id);
        onClose();
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 space-y-5">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500">
              Hardware ID: {container.id}
            </span>
            <h3 className="text-lg font-bold text-stone-900">Container Settings</h3>
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
            <label className="block font-semibold text-stone-700 mb-1">Ingredient Stored</label>
            <input
              type="text"
              required
              value={ingredient}
              onChange={(e) => setIngredient(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900/10 focus:outline-hidden"
              placeholder="e.g. Colombian Roast Coffee"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Display Label</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900/10 focus:outline-hidden"
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
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-stone-700">Empty Tare Weight (g)</label>
                <button
                  type="button"
                  onClick={handleTare}
                  disabled={isTaring}
                  className="text-[10px] text-amber-700 font-bold hover:underline flex items-center"
                  title="Set tare to current raw weight"
                >
                  <RotateCcw className={`w-3 h-3 mr-0.5 ${isTaring ? 'animate-spin' : ''}`} />
                  Tare Now
                </button>
              </div>
              <input
                type="number"
                min="0"
                value={emptyWeightG}
                onChange={(e) => setEmptyWeightG(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900/10 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Total Capacity (g)</label>
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
              <label className="font-semibold text-stone-700">Low Stock Alert Threshold (%)</label>
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

          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors flex items-center space-x-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Unpair Jar</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
