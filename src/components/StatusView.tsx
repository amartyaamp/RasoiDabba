import React, { useState } from 'react';
import {
  Radio,
  Wifi,
  Scale,
  Battery,
  BatteryWarning,
  Clock,
  Search,
  Plus,
  Sliders,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  LayoutGrid,
  List,
  Cpu,
  Activity,
  Signal,
} from 'lucide-react';
import { ContainerNode, HubStatus } from '../types';

interface StatusViewProps {
  containers: ContainerNode[];
  hubStatus: HubStatus;
  sseConnected: boolean;
  onTare: (id: string) => Promise<void>;
  onEdit: (container: ContainerNode) => void;
  onAddNew: () => void;
}

export const StatusView: React.FC<StatusViewProps> = ({
  containers,
  hubStatus,
  sseConnected,
  onTare,
  onEdit,
  onAddNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [taringId, setTaringId] = useState<string | null>(null);

  const categories = ['All', 'Coffee & Tea', 'Grains', 'Baking', 'Pantry'];

  const filteredContainers = containers.filter((c) => {
    const matchesSearch =
      c.ingredient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleTare = async (id: string) => {
    setTaringId(id);
    try {
      await onTare(id);
    } finally {
      setTaringId(null);
    }
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getStatusBadge = (status: ContainerNode['status'], fillPct: number) => {
    switch (status) {
      case 'critical':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-1.5 animate-ping" />
            Critical ({fillPct}%)
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-1.5" />
            Low Stock ({fillPct}%)
          </span>
        );
      case 'online':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
            Normal ({fillPct}%)
          </span>
        );
    }
  };

  const getFillColor = (fillPct: number, lowThreshold: number) => {
    if (fillPct <= 8) return 'bg-rose-500';
    if (fillPct <= lowThreshold) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const lowCount = containers.filter((c) => c.status === 'low' || c.status === 'critical').length;
  const totalNetGrams = containers.reduce((acc, c) => acc + c.net_weight_g, 0);

  return (
    <div className="space-y-6">
      {/* 1. CENTRAL HUB STATUS PANEL */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center shadow-xs">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-stone-900">Central Kitchen Gateway Hub</h2>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    hubStatus.is_online
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      hubStatus.is_online ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  {hubStatus.is_online ? 'Hub Online' : 'Offline'}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Local Raspberry Pi coordinator aggregating Bluetooth sensor pucks and dispatching telemetry.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                sseConnected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{sseConnected ? 'Live Stream Active' : 'Connecting Stream...'}</span>
            </div>
          </div>
        </div>

        {/* Hub Key Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-stone-100 p-2 sm:p-3 bg-white text-xs">
          <div className="p-3">
            <div className="text-stone-400 font-medium mb-1">Active Nodes</div>
            <div className="text-lg font-bold text-stone-900">{containers.length} nodes</div>
            <div className="text-[11px] text-stone-500">BLE load cells</div>
          </div>

          <div className="p-3">
            <div className="text-stone-400 font-medium mb-1">Low / Attention</div>
            <div className={`text-lg font-bold ${lowCount > 0 ? 'text-amber-600' : 'text-stone-900'}`}>
              {lowCount} {lowCount === 1 ? 'item' : 'items'}
            </div>
            <div className="text-[11px] text-stone-500">needs restock</div>
          </div>

          <div className="p-3">
            <div className="text-stone-400 font-medium mb-1">Packets Ingested</div>
            <div className="text-lg font-bold text-stone-900">{hubStatus.packets_received}</div>
            <div className="text-[11px] text-stone-500">telemetry frames</div>
          </div>

          <div className="p-3">
            <div className="text-stone-400 font-medium mb-1">Transport Adapter</div>
            <div className="text-lg font-bold text-stone-900 uppercase tracking-wide">
              {hubStatus.adapter_mode}
            </div>
            <div className="text-[11px] text-stone-500">ingress interface</div>
          </div>

          <div className="p-3">
            <div className="text-stone-400 font-medium mb-1">Hub Uptime</div>
            <div className="text-lg font-bold text-stone-900">{formatUptime(hubStatus.uptime_seconds)}</div>
            <div className="text-[11px] text-stone-500">daemon runtime</div>
          </div>

          <div className="p-3">
            <div className="text-stone-400 font-medium mb-1">Last Heartbeat</div>
            <div className="text-lg font-bold text-stone-900">{formatTimeAgo(hubStatus.last_heartbeat)}</div>
            <div className="text-[11px] text-stone-500">gateway sync</div>
          </div>
        </div>
      </div>

      {/* 2. NODES STATUS SECTION */}
      <div className="space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-stone-200 shadow-2xs">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter nodes by ingredient or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
            />
          </div>

          {/* Categories & View Switcher */}
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-xl">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Data Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onAddNew}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Node</span>
            </button>
          </div>
        </div>

        {/* NODES PRESENTATION */}
        {filteredContainers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-2xs">
            <Scale className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-stone-900 mb-1">No container nodes match</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
              {searchQuery ? `No results found for "${searchQuery}".` : 'No nodes in this category.'}
            </p>
            <button
              onClick={onAddNew}
              className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-xl hover:bg-stone-800 transition-colors inline-flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Register Container Node</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Card View (Pure Data Presentation) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContainers.map((container) => (
              <div
                key={container.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-2xs hover:shadow-xs transition-all overflow-hidden flex flex-col justify-between"
              >
                <div className="p-4 sm:p-5">
                  {/* Top Bar: ID, Category & Status */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center space-x-1.5 text-xs text-stone-500 font-mono mb-1">
                        <span>{container.id}</span>
                        <span>&bull;</span>
                        <span className="font-sans px-1.5 py-0.2 rounded bg-stone-100 text-stone-600">
                          {container.category}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-stone-900 leading-snug">
                        {container.ingredient}
                      </h3>
                    </div>
                    {getStatusBadge(container.status, container.fill_pct)}
                  </div>

                  {/* Main Weight & Fill Progress */}
                  <div className="my-4 bg-stone-50 p-3.5 rounded-xl border border-stone-100">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-xs text-stone-500 font-medium">Usable Net Weight</span>
                      <div className="flex items-baseline space-x-1">
                        <span className="text-2xl font-bold text-stone-900">{container.net_weight_g}</span>
                        <span className="text-xs text-stone-500">g</span>
                      </div>
                    </div>

                    {/* Clean Fill Bar */}
                    <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getFillColor(
                          container.fill_pct,
                          container.low_threshold_pct
                        )} transition-all duration-500`}
                        style={{ width: `${Math.min(100, container.fill_pct)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-stone-500 mt-1.5">
                      <span>{container.fill_pct}% capacity</span>
                      <span>Max: {container.capacity_g}g</span>
                    </div>
                  </div>

                  {/* Telemetry Hardware Specs Grid */}
                  <div className="grid grid-cols-3 gap-2 text-xs py-2 border-t border-stone-100">
                    <div>
                      <div className="text-[10px] text-stone-400 font-medium uppercase">Raw Scale</div>
                      <div className="font-mono text-stone-700 font-semibold">{container.raw_weight_g}g</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-stone-400 font-medium uppercase">Tare Offset</div>
                      <div className="font-mono text-stone-700 font-semibold">{container.empty_weight_g}g</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-stone-400 font-medium uppercase">Threshold</div>
                      <div className="font-mono text-stone-700 font-semibold">{container.low_threshold_pct}%</div>
                    </div>
                  </div>

                  {/* Radio & Battery Status */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-100 text-stone-600">
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

                    <div className="flex items-center space-x-1.5">
                      <Signal className="w-3.5 h-3.5 text-stone-400" />
                      <span className="font-mono">{container.rssi} dBm</span>
                    </div>

                    <div className="flex items-center space-x-1 text-stone-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTimeAgo(container.last_updated)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions (Simple, unobtrusive) */}
                <div className="bg-stone-50/70 px-4 py-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-400 text-[11px] font-mono">ID: {container.id}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleTare(container.id)}
                      disabled={taringId === container.id}
                      className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 rounded-lg border border-stone-200 transition-colors inline-flex items-center space-x-1 disabled:opacity-40"
                      title="Set current scale reading as empty tare weight"
                    >
                      <RotateCcw className={`w-3 h-3 ${taringId === container.id ? 'animate-spin' : ''}`} />
                      <span>Zero Tare</span>
                    </button>
                    <button
                      onClick={() => onEdit(container)}
                      className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 rounded-lg border border-stone-200 transition-colors inline-flex items-center space-x-1"
                      title="Edit container threshold or name"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View (Dense, high-clarity tabular data) */
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Node ID / Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Fill Level</th>
                  <th className="py-3 px-4 text-right">Net Weight</th>
                  <th className="py-3 px-4 text-right">Raw Scale</th>
                  <th className="py-3 px-4 text-right">Tare Offset</th>
                  <th className="py-3 px-4">Battery</th>
                  <th className="py-3 px-4">Signal (RSSI)</th>
                  <th className="py-3 px-4">Last Update</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {filteredContainers.map((container) => (
                  <tr key={container.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900">{container.ingredient}</div>
                      <div className="text-[11px] font-mono text-stone-400">{container.id}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-600 text-[11px]">
                        {container.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(container.status, container.fill_pct)}</td>
                    <td className="py-3.5 px-4">
                      <div className="w-24">
                        <div className="flex justify-between text-[10px] text-stone-500 mb-1">
                          <span>{container.fill_pct}%</span>
                          <span>Cap {container.capacity_g}g</span>
                        </div>
                        <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getFillColor(
                              container.fill_pct,
                              container.low_threshold_pct
                            )}`}
                            style={{ width: `${Math.min(100, container.fill_pct)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-stone-900 font-mono">
                      {container.net_weight_g} g
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-stone-600">
                      {container.raw_weight_g} g
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-stone-500">
                      {container.empty_weight_g} g
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center space-x-1">
                        <span
                          className={container.battery_pct < 20 ? 'text-rose-600 font-bold' : 'text-stone-700'}
                        >
                          {container.battery_pct}%
                        </span>
                        <span className="text-[10px] text-stone-400">({container.battery_v.toFixed(2)}V)</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-stone-600">{container.rssi} dBm</td>
                    <td className="py-3.5 px-4 text-stone-500 whitespace-nowrap">
                      {formatTimeAgo(container.last_updated)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleTare(container.id)}
                          disabled={taringId === container.id}
                          className="p-1 text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded-lg transition-colors"
                          title="Tare scale"
                        >
                          <RotateCcw
                            className={`w-3.5 h-3.5 ${taringId === container.id ? 'animate-spin' : ''}`}
                          />
                        </button>
                        <button
                          onClick={() => onEdit(container)}
                          className="p-1 text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded-lg transition-colors"
                          title="Edit container"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
