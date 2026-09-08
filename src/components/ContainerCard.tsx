import React, { useState } from 'react';
import {
  Scale,
  Battery,
  BatteryWarning,
  Wifi,
  Sliders,
  RotateCcw,
  Plus,
  Minus,
  AlertTriangle,
  Clock,
  Sparkles,
  Check,
} from 'lucide-react';
import { ContainerNode } from '../types';

interface ContainerCardProps {
  container: ContainerNode;
  onTare: (id: string) => Promise<void>;
  onSimulatePour: (id: string, deltaG: number) => Promise<void>;
  onEdit: (container: ContainerNode) => void;
  onDelete: (id: string) => Promise<void>;
}

export const ContainerCard: React.FC<ContainerCardProps> = ({
  container,
  onTare,
  onSimulatePour,
  onEdit,
  onDelete,
}) => {
  const [isTaring, setIsTaring] = useState(false);
  const [isPouring, setIsPouring] = useState(false);
  const [pourFeedback, setPourFeedback] = useState<string | null>(null);

  const getStatusBadge = () => {
    switch (container.status) {
      case 'critical':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-1.5 animate-ping" />
            Critical Low ({container.fill_pct}%)
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-1.5" />
            Low Stock ({container.fill_pct}%)
          </span>
        );
      case 'online':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
            Healthy ({container.fill_pct}%)
          </span>
        );
    }
  };

  const getLiquidColor = () => {
    if (container.fill_pct <= 8) return 'from-rose-500 to-rose-600';
    if (container.fill_pct <= container.low_threshold_pct) return 'from-amber-400 to-amber-500';
    return 'from-emerald-400 to-teal-500';
  };

  const handleTareClick = async () => {
    setIsTaring(true);
    try {
      await onTare(container.id);
    } finally {
      setIsTaring(false);
    }
  };

  const handlePourClick = async (delta: number) => {
    setIsPouring(true);
    setPourFeedback(delta > 0 ? `+${delta}g` : `${delta}g`);
    try {
      await onSimulatePour(container.id, delta);
      setTimeout(() => setPourFeedback(null), 1200);
    } finally {
      setIsPouring(false);
    }
  };

  // Format last updated
  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div
      id={`container-card-${container.id}`}
      className={`relative bg-white rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden ${
        container.status === 'critical'
          ? 'border-rose-300 ring-1 ring-rose-200'
          : container.status === 'low'
          ? 'border-amber-300 ring-1 ring-amber-100'
          : 'border-stone-200 hover:border-stone-300'
      }`}
    >
      {/* Top Banner with Node ID and status */}
      <div className="p-4 sm:p-5 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center space-x-1.5 text-xs text-stone-500 font-mono mb-1">
              <span>{container.id}</span>
              <span>&bull;</span>
              <span className="font-sans px-1.5 py-0.2 rounded bg-stone-100 text-stone-600">
                {container.category}
              </span>
            </div>
            <h3 className="font-bold text-stone-900 text-base sm:text-lg leading-snug">
              {container.ingredient}
            </h3>
          </div>
          {getStatusBadge()}
        </div>

        {/* Jar Visual Representation & Fill Level */}
        <div className="my-4 flex items-center space-x-4 bg-stone-50/70 p-3 rounded-xl border border-stone-100">
          {/* Animated 2.5D Jar Graphic */}
          <div className="relative w-16 h-28 bg-stone-100 rounded-b-xl rounded-t-sm border-2 border-stone-300 overflow-hidden flex flex-col justify-end shadow-inner shrink-0">
            {/* Jar Lid */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-stone-400 border-b border-stone-500 z-10" />
            
            {/* Liquid Level */}
            <div
              className={`w-full bg-linear-to-t ${getLiquidColor()} transition-all duration-700 ease-out relative`}
              style={{ height: `${Math.max(4, container.fill_pct)}%` }}
            >
              {/* Surface meniscus shine */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-white/40" />
            </div>

            {/* Measurement lines on glass */}
            <div className="absolute inset-0 flex flex-col justify-between py-3 px-1 pointer-events-none opacity-40">
              <div className="w-2 h-0.5 bg-stone-600" />
              <div className="w-3 h-0.5 bg-stone-600" />
              <div className="w-2 h-0.5 bg-stone-600" />
              <div className="w-3 h-0.5 bg-stone-600" />
            </div>

            {/* Pour popover animation */}
            {pourFeedback && (
              <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center text-white text-xs font-bold animate-fade-in">
                {pourFeedback}
              </div>
            )}
          </div>

          {/* Key Metrics Breakdown */}
          <div className="flex-1 space-y-1.5 text-xs">
            <div className="flex justify-between items-baseline">
              <span className="text-stone-500 font-medium">Net Usable:</span>
              <span className="font-bold text-stone-900 text-sm">{container.net_weight_g} g</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-stone-500">Raw Scale:</span>
              <span className="font-mono text-stone-700">{container.raw_weight_g} g</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-stone-500">Tare (Empty):</span>
              <span className="font-mono text-stone-500">-{container.empty_weight_g} g</span>
            </div>
            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full bg-linear-to-r ${getLiquidColor()} transition-all duration-500`}
                style={{ width: `${container.fill_pct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>Threshold: {container.low_threshold_pct}%</span>
              <span>Cap: {container.capacity_g}g</span>
            </div>
          </div>
        </div>

        {/* Telemetry Hardware Diagnostics */}
        <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-stone-100 text-stone-600">
          <div className="flex items-center space-x-1.5">
            {container.battery_pct < 20 ? (
              <BatteryWarning className="w-3.5 h-3.5 text-rose-500" />
            ) : (
              <Battery className="w-3.5 h-3.5 text-stone-400" />
            )}
            <span>
              {container.battery_v.toFixed(2)}V ({container.battery_pct}%)
            </span>
          </div>
          <div className="flex items-center justify-end space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span className="truncate">{formatTimeAgo(container.last_updated)}</span>
          </div>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="bg-stone-50 p-3 px-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => handlePourClick(-30)}
            disabled={isPouring || container.net_weight_g <= 0}
            className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-stone-100 text-stone-700 rounded-lg border border-stone-200 shadow-2xs transition-colors disabled:opacity-40"
            title="Pour 30g (cook / use recipe ingredient)"
          >
            -30g
          </button>
          <button
            onClick={() => handlePourClick(-75)}
            disabled={isPouring || container.net_weight_g <= 0}
            className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-stone-100 text-stone-700 rounded-lg border border-stone-200 shadow-2xs transition-colors disabled:opacity-40"
            title="Pour 75g"
          >
            -75g
          </button>
          <button
            onClick={() => handlePourClick(250)}
            disabled={isPouring}
            className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-stone-100 text-stone-700 rounded-lg border border-stone-200 shadow-2xs transition-colors"
            title="Refill jar (+250g)"
          >
            +250g
          </button>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handleTareClick}
            disabled={isTaring}
            className="p-1.5 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded-lg transition-colors"
            title="Tare / Zero-Calibrate current scale"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isTaring ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => onEdit(container)}
            className="p-1.5 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded-lg transition-colors"
            title="Configure container settings"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
