import React from 'react';
import { Radio, Bell, RefreshCw, Activity, Cpu } from 'lucide-react';
import { HubStatus, AlertNotification } from '../types';

interface HeaderProps {
  activeTab: 'status' | 'alerts';
  setActiveTab: (tab: 'status' | 'alerts') => void;
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
    <header className="border-b border-stone-200 bg-white sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center shadow-xs">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-stone-900 text-base sm:text-lg tracking-tight">
                  Smart Kitchen Inventory
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-700 border border-stone-200">
                  Node & Hub Monitor
                </span>
              </div>
              <p className="text-xs text-stone-500 hidden sm:block">
                Sensor Nodes Telemetry &bull; Central Gateway &bull; Live Alerts
              </p>
            </div>
          </div>

          {/* Quick System Telemetry */}
          <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
            {/* SSE Live Status */}
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-xs ${
                sseConnected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
              title={sseConnected ? 'Real-time Server-Sent Events stream connected' : 'Connecting to live stream...'}
            >
              <span className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="font-medium hidden sm:inline">{sseConnected ? 'Live' : 'Connecting'}</span>
            </div>

            {/* Ingested packets pill */}
            <div className="hidden md:flex items-center space-x-1 px-2.5 py-1 rounded-full border bg-stone-50 border-stone-200 text-stone-700">
              <Cpu className="w-3.5 h-3.5 text-stone-500" />
              <span>{hubStatus.packets_received} pkts</span>
            </div>

            {/* Refresh button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
              title="Refresh telemetry data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Simplified Two-Tab Navigation */}
        <div className="flex space-x-2 sm:space-x-4 border-t border-stone-100 py-1.5">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'status'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Nodes & Hub Status</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap relative ${
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
