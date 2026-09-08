import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { InventoryView } from './components/InventoryView';
import { NodeSimulator } from './components/NodeSimulator';
import { EndpointTester } from './components/EndpointTester';
import { RoadmapView } from './components/RoadmapView';
import { AlertsView } from './components/AlertsView';
import { EditContainerModal } from './components/EditContainerModal';
import { AddContainerModal } from './components/AddContainerModal';
import { ContainerNode, AlertNotification, HubStatus } from './types';
import { AlertCircle, CheckCircle2, WifiOff } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'simulator' | 'endpoint' | 'roadmap' | 'alerts'>('inventory');
  const [containers, setContainers] = useState<ContainerNode[]>([]);
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [hubStatus, setHubStatus] = useState<HubStatus>({
    is_online: true,
    uptime_seconds: 0,
    packets_received: 0,
    active_nodes_count: 0,
    adapter_mode: 'rest',
    ble_scanning: true,
    last_heartbeat: Date.now(),
  });
  const [sseConnected, setSseConnected] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [editingContainer, setEditingContainer] = useState<ContainerNode | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'info' | 'alert' | 'success' } | null>(null);

  const showToast = (text: string, type: 'info' | 'alert' | 'success' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch initial data
  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [invRes, alertsRes, hubRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/alerts'),
        fetch('/api/hub/status'),
      ]);

      if (invRes.ok) {
        const invData = await invRes.json();
        setContainers(invData.containers || []);
      }
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.alerts || []);
      }
      if (hubRes.ok) {
        const hubData = await hubRes.json();
        setHubStatus(hubData);
      }
    } catch (err) {
      console.error('Error fetching system data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Connect to SSE live stream
  useEffect(() => {
    fetchData();

    const eventSource = new EventSource('/api/events');

    eventSource.onopen = () => {
      setSseConnected(true);
    };

    eventSource.addEventListener('initial_state', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.containers) setContainers(data.containers);
        if (data.alerts) setAlerts(data.alerts);
        if (data.hubStatus) setHubStatus(data.hubStatus);
      } catch (err) {
        console.error('Error parsing initial state:', err);
      }
    });

    eventSource.addEventListener('telemetry_update', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.container) {
          setContainers((prev) => {
            const idx = prev.findIndex((c) => c.id === data.container.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = data.container;
              return updated;
            }
            return [...prev, data.container];
          });
        }
        if (data.hubStatus) setHubStatus(data.hubStatus);
      } catch (err) {
        console.error('Error parsing telemetry update:', err);
      }
    });

    eventSource.addEventListener('new_alert', (e: MessageEvent) => {
      try {
        const alert: AlertNotification = JSON.parse(e.data);
        setAlerts((prev) => [alert, ...prev]);
        showToast(alert.message, alert.type === 'critical_stock' ? 'alert' : 'info');
      } catch (err) {
        console.error('Error parsing new alert:', err);
      }
    });

    eventSource.addEventListener('container_updated', (e: MessageEvent) => {
      try {
        const container: ContainerNode = JSON.parse(e.data);
        setContainers((prev) => prev.map((c) => (c.id === container.id ? container : c)));
      } catch (err) {
        console.error('Error parsing container update:', err);
      }
    });

    eventSource.addEventListener('container_added', (e: MessageEvent) => {
      try {
        const container: ContainerNode = JSON.parse(e.data);
        setContainers((prev) => [...prev, container]);
        showToast(`Paired new smart jar: ${container.name}`, 'success');
      } catch (err) {
        console.error('Error parsing container added:', err);
      }
    });

    eventSource.addEventListener('container_deleted', (e: MessageEvent) => {
      try {
        const { id } = JSON.parse(e.data);
        setContainers((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        console.error('Error parsing container deleted:', err);
      }
    });

    eventSource.addEventListener('alerts_cleared', () => {
      setAlerts([]);
    });

    eventSource.addEventListener('alert_read', (e: MessageEvent) => {
      try {
        const { id } = JSON.parse(e.data);
        setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
      } catch (err) {
        console.error('Error parsing alert read:', err);
      }
    });

    eventSource.addEventListener('hub_status_update', (e: MessageEvent) => {
      try {
        const status = JSON.parse(e.data);
        setHubStatus(status);
      } catch (err) {
        console.error('Error parsing hub status update:', err);
      }
    });

    eventSource.onerror = () => {
      setSseConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [fetchData]);

  // Actions
  const handleTare = async (id: string) => {
    try {
      const res = await fetch(`/api/containers/${id}/tare`, { method: 'POST' });
      const data = await res.json();
      showToast(`Tare calibrated for ${id}. Offset set to ${data.new_tare_g}g.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Tare calibration failed', 'alert');
    }
  };

  const handleSimulatePour = async (id: string, deltaG: number) => {
    try {
      await fetch(`/api/containers/${id}/simulate-pour`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta_g: deltaG }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendTelemetry = async (payload: {
    container_id: string;
    raw_weight_g: number;
    battery_v: number;
    rssi: number;
  }) => {
    const res = await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  };

  const handleSaveContainer = async (updated: Partial<ContainerNode>) => {
    if (!editingContainer) return;
    try {
      await fetch(`/api/containers/${editingContainer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      showToast(`Saved settings for ${editingContainer.name}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save container settings', 'alert');
    }
  };

  const handleDeleteContainer = async (id: string) => {
    try {
      await fetch(`/api/containers/${id}`, { method: 'DELETE' });
      showToast(`Removed container ${id}`, 'info');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete container', 'alert');
    }
  };

  const handleAddContainer = async (containerData: Partial<ContainerNode>) => {
    try {
      await fetch('/api/containers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(containerData),
      });
    } catch (err) {
      console.error(err);
      showToast('Failed to register container node', 'alert');
    }
  };

  const handleChangeAdapter = async (mode: 'rest' | 'firebase' | 'mqtt') => {
    try {
      await fetch('/api/hub/adapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      showToast(`Hub network adapter swapped to "${mode.toUpperCase()}"`, 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAlerts = async () => {
    try {
      await fetch('/api/alerts/clear', { method: 'POST' });
      showToast('All notifications cleared', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/alerts/${id}/read`, { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50/80 text-stone-900 flex flex-col font-sans selection:bg-stone-900 selection:text-white">
      {/* Header with Navigation and System Telemetry */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hubStatus={hubStatus}
        sseConnected={sseConnected}
        alerts={alerts}
        onRefresh={fetchData}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'inventory' && (
          <InventoryView
            containers={containers}
            onTare={handleTare}
            onSimulatePour={handleSimulatePour}
            onEdit={(c) => setEditingContainer(c)}
            onDelete={handleDeleteContainer}
            onAddNew={() => setIsAddModalOpen(true)}
          />
        )}

        {activeTab === 'simulator' && (
          <NodeSimulator
            containers={containers}
            hubStatus={hubStatus}
            onSendTelemetry={handleSendTelemetry}
            onChangeAdapter={handleChangeAdapter}
          />
        )}

        {activeTab === 'endpoint' && <EndpointTester />}

        {activeTab === 'roadmap' && <RoadmapView />}

        {activeTab === 'alerts' && (
          <AlertsView
            alerts={alerts}
            containers={containers}
            onClearAlerts={handleClearAlerts}
            onMarkRead={handleMarkRead}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-4 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Smart Kitchen Ingress Service &bull; Port 3000</span>
          </div>
          <div className="text-stone-400">
            BLE Load Cells &bull; Edge Gateway &bull; Decoupled Network Adapters (REST / Firebase / MQTT)
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
          <div
            className={`px-4 py-3 rounded-2xl shadow-lg border flex items-center space-x-3 text-xs font-medium ${
              toastMessage.type === 'alert'
                ? 'bg-rose-900 text-white border-rose-800'
                : toastMessage.type === 'success'
                ? 'bg-stone-900 text-white border-stone-800'
                : 'bg-stone-900 text-stone-100 border-stone-800'
            }`}
          >
            {toastMessage.type === 'alert' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Edit Container Settings Modal */}
      <EditContainerModal
        container={editingContainer}
        isOpen={!!editingContainer}
        onClose={() => setEditingContainer(null)}
        onSave={handleSaveContainer}
        onDelete={handleDeleteContainer}
        onTare={handleTare}
      />

      {/* Pair New Container Modal */}
      <AddContainerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddContainer}
        existingCount={containers.length}
      />
    </div>
  );
}
