import React from 'react';
import { Scale, Wifi, Radio, Bell, Code2, Layers, Cpu, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { HubStatus, AlertNotification } from '../types';

interface HeaderProps {
  activeTab: 'inventory' | 'simulator' | 'endpoint' | 'roadmap' | 'alerts';
  setActiveTab: (tab: 'inventory' | 'simulator' | 'endpoint' | 'roadmap' | 'alerts') => void;
  hubStatus: HubStatus;
  sseConnected: boolean;
  alerts: AlertNotification[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  hubStatus,
  sseConnected,
  alerts,
  onRefresh,
  isRefreshing,
}) => {
  const unreadAlerts = alerts.filter((a) => !a.read).length;

  return (
    <header className="border-b border-stone-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center shadow-sm">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-stone-900 text-lg tracking-tight">Smart Kitchen Inventory</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
                  MVP Ingress Service
                </span>
              </div>
              <p className="text-xs text-stone-500 hidden sm:block">
                BLE Load Cell Nodes &bull; Central Hub Gateway &bull; Live REST Telemetry
              </p>
            </div>
          </div>

          {/* System Status Indicators */}
          <div className="hidden md:flex items-center space-x-3 text-xs">
            {/* SSE Live Link */}
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border ${
                sseConnected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
              title={sseConnected ? 'Real-time Server-Sent Events stream active' : 'Connecting to live events...'}
            >
              <span className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="font-medium">{sseConnected ? 'Live Stream' : 'Connecting'}</span>
            </div>

            {/* Hub Adapter Mode */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full border bg-stone-50 border-stone-200 text-stone-700">
              <Radio className="w-3.5 h-3.5 text-stone-500" />
              <span>Adapter:</span>
              <span className="font-semibold uppercase tracking-wider text-stone-900">{hubStatus.adapter_mode}</span>
            </div>

            {/* Ingested Packets */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full border bg-stone-50 border-stone-200 text-stone-700">
              <Cpu className="w-3.5 h-3.5 text-stone-500" />
              <span>Ingested:</span>
              <span className="font-semibold text-stone-900">{hubStatus.packets_received} pkts</span>
            </div>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
              title="Refresh inventory"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 sm:space-x-4 overflow-x-auto no-scrollbar border-t border-stone-100 py-1.5">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Kitchen Inventory</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'simulator'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Node & Hub Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('endpoint')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'endpoint'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Endpoint Tester</span>
          </button>

          <button
            onClick={() => setActiveTab('roadmap')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'roadmap'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>Integration Roadmap</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap relative ${
              activeTab === 'alerts'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Alerts & Messages</span>
            {unreadAlerts > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs font-bold bg-amber-500 text-stone-950">
                {unreadAlerts}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
