import React, { useState } from 'react';
import { Plus, Search, Filter, AlertTriangle, Scale, Sparkles, CheckCircle2 } from 'lucide-react';
import { ContainerNode } from '../types';
import { ContainerCard } from './ContainerCard';

interface InventoryViewProps {
  containers: ContainerNode[];
  onTare: (id: string) => Promise<void>;
  onSimulatePour: (id: string, deltaG: number) => Promise<void>;
  onEdit: (container: ContainerNode) => void;
  onDelete: (id: string) => Promise<void>;
  onAddNew: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  containers,
  onTare,
  onSimulatePour,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Coffee & Tea', 'Grains', 'Baking', 'Pantry'];

  const filteredContainers = containers.filter((c) => {
    const matchesSearch =
      c.ingredient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowCount = containers.filter((c) => c.status === 'low' || c.status === 'critical').length;
  const criticalCount = containers.filter((c) => c.status === 'critical').length;
  const totalNetGrams = containers.reduce((acc, c) => acc + c.net_weight_g, 0);

  return (
    <div className="space-y-6">
      {/* Top Inventory Metrics Bento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Tracked */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-1">
            <span>Containers Tracked</span>
            <Scale className="w-4 h-4 text-stone-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-stone-900">{containers.length}</span>
            <span className="text-xs text-stone-500">active BLE nodes</span>
          </div>
        </div>

        {/* Low Stock Attention */}
        <div className={`p-4 rounded-2xl border shadow-2xs ${
          lowCount > 0 ? 'bg-amber-50/60 border-amber-200' : 'bg-white border-stone-200'
        }`}>
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-1">
            <span className={lowCount > 0 ? 'text-amber-800' : ''}>Low Stock Items</span>
            <AlertTriangle className={`w-4 h-4 ${lowCount > 0 ? 'text-amber-600' : 'text-stone-400'}`} />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-2xl font-bold ${lowCount > 0 ? 'text-amber-900' : 'text-stone-900'}`}>
              {lowCount}
            </span>
            <span className="text-xs text-stone-500">
              {criticalCount > 0 ? `(${criticalCount} critical)` : 'under threshold'}
            </span>
          </div>
        </div>

        {/* Total Net Weight */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-1">
            <span>Total Usable Goods</span>
            <Sparkles className="w-4 h-4 text-stone-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-stone-900">
              {(totalNetGrams / 1000).toFixed(2)}
            </span>
            <span className="text-xs text-stone-500">kg in pantry</span>
          </div>
        </div>

        {/* Tare Calibration Status */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-1">
            <span>Load Cell Health</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-stone-900">100%</span>
            <span className="text-xs text-stone-500">zero-calibrated</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-stone-200">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ingredient, jar ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-xl">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={onAddNew}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Pair New Jar</span>
          </button>
        </div>
      </div>

      {/* Containers Grid */}
      {filteredContainers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredContainers.map((container) => (
            <ContainerCard
              key={container.id}
              container={container}
              onTare={onTare}
              onSimulatePour={onSimulatePour}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <Scale className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-900 mb-1">No containers found</h3>
          <p className="text-sm text-stone-500 max-w-sm mx-auto mb-4">
            {searchQuery
              ? `No jars match your search "${searchQuery}".`
              : 'No containers currently configured in this category.'}
          </p>
          <button
            onClick={onAddNew}
            className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-xl hover:bg-stone-800 transition-colors inline-flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Container Node</span>
          </button>
        </div>
      )}
    </div>
  );
};
