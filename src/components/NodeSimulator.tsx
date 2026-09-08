import React, { useState, useEffect } from 'react';
import {
  Radio,
  Cpu,
  Send,
  ArrowRight,
  RefreshCw,
  Play,
  Square,
  CheckCircle2,
  Layers,
  Smartphone,
  Server,
  Zap,
  Sliders,
} from 'lucide-react';
import { ContainerNode, HubStatus } from '../types';

interface NodeSimulatorProps {
  containers: ContainerNode[];
  hubStatus: HubStatus;
  onSendTelemetry: (payload: {
    container_id: string;
    raw_weight_g: number;
    battery_v: number;
    rssi: number;
  }) => Promise<any>;
  onChangeAdapter: (mode: 'rest' | 'firebase' | 'mqtt') => Promise<void>;
}

interface PacketLog {
  id: string;
  timestamp: string;
  containerId: string;
  rawGrams: number;
  netGrams: number;
  fillPct: number;
  batteryV: number;
  adapter: string;
  status: 'delivered' | 'error';
}

export const NodeSimulator: React.FC<NodeSimulatorProps> = ({
  containers,
  hubStatus,
  onSendTelemetry,
  onChangeAdapter,
}) => {
  const [selectedId, setSelectedId] = useState<string>(containers[0]?.id || 'jar_001');
  const [rawWeight, setRawWeight] = useState<number>(300);
  const [batteryV, setBatteryV] = useState<number>(3.85);
  const [rssi, setRssi] = useState<number>(-58);
  const [addNoise, setAddNoise] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isAutoPoring, setIsAutoPouring] = useState<boolean>(false);
  const [packetLogs, setPacketLogs] = useState<PacketLog[]>([]);
  const [lastResponse, setLastResponse] = useState<any>(null);

  const selectedContainer = containers.find((c) => c.id === selectedId) || containers[0];

  // Keep slider synced when container selection changes
  useEffect(() => {
    if (selectedContainer) {
      setRawWeight(selectedContainer.raw_weight_g);
      setBatteryV(selectedContainer.battery_v);
      setRssi(selectedContainer.rssi);
    }
  }, [selectedId]);

  // Auto-pour loop simulation
  useEffect(() => {
    let interval: any = null;
    if (isAutoPoring) {
      interval = setInterval(async () => {
        if (!selectedContainer) return;
        const jitter = addNoise ? Math.floor(Math.random() * 5) - 2 : 0;
        const nextWeight = Math.max(
          selectedContainer.empty_weight_g,
          rawWeight - Math.floor(Math.random() * 25 + 10) + jitter
        );
        setRawWeight(nextWeight);
        await handleTransmit(nextWeight);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isAutoPoring, rawWeight, selectedContainer, addNoise]);

  const handleTransmit = async (weightOverride?: number) => {
    setIsSending(true);
    const weightToTransmit = typeof weightOverride === 'number' ? weightOverride : rawWeight;
    const finalWeight = addNoise
      ? Math.max(0, weightToTransmit + (Math.floor(Math.random() * 5) - 2))
      : weightToTransmit;

    try {
      const res = await onSendTelemetry({
        container_id: selectedId,
        raw_weight_g: finalWeight,
        battery_v: Number(batteryV.toFixed(2)),
        rssi,
      });

      setLastResponse(res);

      const newLog: PacketLog = {
        id: `pkt_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        containerId: selectedId,
        rawGrams: finalWeight,
        netGrams: res?.net_weight_g ?? Math.max(0, finalWeight - (selectedContainer?.empty_weight_g || 0)),
        fillPct: res?.fill_pct ?? 0,
        batteryV,
        adapter: hubStatus.adapter_mode,
        status: 'delivered',
      };

      setPacketLogs((prev) => [newLog, ...prev.slice(0, 15)]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 3-Tier Architecture Interactive Visual Flow */}
      <div className="bg-stone-900 text-stone-100 rounded-2xl p-5 sm:p-6 shadow-md border border-stone-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <span className="text-xs font-mono tracking-wider text-amber-400 uppercase font-semibold">
              Live Topology Pipeline
            </span>
            <h2 className="text-lg font-bold text-white">3-Tier Edge Gateway Connection Flow</h2>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-stone-400">Hub Adapter:</span>
            <select
              value={hubStatus.adapter_mode}
              onChange={(e) => onChangeAdapter(e.target.value as any)}
              className="bg-stone-800 text-stone-200 border border-stone-700 text-xs rounded-lg px-2.5 py-1 focus:ring-amber-400 focus:outline-hidden"
            >
              <option value="rest">Direct REST Endpoint</option>
              <option value="firebase">Firebase Realtime Adapter</option>
              <option value="mqtt">Local Mosquitto MQTT</option>
            </select>
          </div>
        </div>

        {/* The 3 Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          {/* Tier 1 */}
          <div className="bg-stone-800/80 rounded-xl p-4 border border-stone-700/80 relative">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono mb-2">
              <Radio className="w-4 h-4" />
              <span>TIER 1: SENSOR NODE</span>
            </div>
            <h3 className="font-semibold text-white text-sm">ESP32 + HX711 Load Cell</h3>
            <p className="text-xs text-stone-400 mt-1">
              Measures raw weight at jar base. Wakes from deep-sleep, broadcasts BLE GATT payload.
            </p>
            <div className="mt-3 p-2 bg-stone-950/70 rounded-lg text-[11px] font-mono text-emerald-400">
              GATT 0xdef1: {rawWeight}g (uint16)
              <br />
              GATT 0xdef2: {(batteryV * 1000).toFixed(0)}mV
            </div>
          </div>

          {/* Tier 2 */}
          <div className="bg-stone-800/80 rounded-xl p-4 border border-stone-700/80 relative">
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono mb-2">
              <Cpu className="w-4 h-4" />
              <span>TIER 2: CENTRAL HUB</span>
            </div>
            <h3 className="font-semibold text-white text-sm">Raspberry Pi Gateway</h3>
            <p className="text-xs text-stone-400 mt-1">
              Bleak GATT client collects BLE packets. Dispatches through NetworkAdapter interface.
            </p>
            <div className="mt-3 p-2 bg-stone-950/70 rounded-lg text-[11px] font-mono text-cyan-400">
              Adapter: {hubStatus.adapter_mode.toUpperCase()}
              <br />
              Gateway Ingest: /api/telemetry
            </div>
          </div>

          {/* Tier 3 */}
          <div className="bg-stone-800/80 rounded-xl p-4 border border-stone-700/80 relative">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-mono mb-2">
              <Smartphone className="w-4 h-4" />
              <span>TIER 3: ENDPOINT & APP</span>
            </div>
            <h3 className="font-semibold text-white text-sm">Service & Mobile App</h3>
            <p className="text-xs text-stone-400 mt-1">
              Stores telemetry, computes tare net weight, streams SSE, triggers low-stock alerts.
            </p>
            <div className="mt-3 p-2 bg-stone-950/70 rounded-lg text-[11px] font-mono text-amber-400">
              Fill: {lastResponse?.fill_pct ?? selectedContainer?.fill_pct ?? '--'}%
              <br />
              Status: {lastResponse?.status ?? selectedContainer?.status ?? '--'}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Raw Payload Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Node Controls */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-bold text-stone-900 text-base">Node Hardware Stub Controls</h3>
              <p className="text-xs text-stone-500">
                Simulate weight changes, battery levels, and transmit BLE frames.
              </p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>

          {/* Select Node */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Select Container Node to Emulate
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-medium text-stone-800 focus:ring-2 focus:ring-stone-900/10 focus:outline-hidden"
            >
              {containers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} &bull; {c.ingredient} ({c.name})
                </option>
              ))}
            </select>
          </div>

          {/* Raw Scale Weight Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-stone-700">Raw Scale Reading (HX711 Load Cell)</span>
              <div className="flex items-center space-x-1 font-mono font-bold text-stone-900">
                <span>{rawWeight}</span>
                <span className="text-stone-500">grams</span>
              </div>
            </div>
            <input
              type="range"
              min={selectedContainer?.empty_weight_g || 100}
              max={selectedContainer?.capacity_g || 1500}
              value={rawWeight}
              onChange={(e) => setRawWeight(Number(e.target.value))}
              className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
            />
            <div className="flex justify-between text-[10px] text-stone-500 font-mono">
              <span>Tare empty: {selectedContainer?.empty_weight_g}g</span>
              <span>
                Net food: {Math.max(0, rawWeight - (selectedContainer?.empty_weight_g || 0))}g
              </span>
              <span>Max: {selectedContainer?.capacity_g}g</span>
            </div>
          </div>

          {/* Quick Pre-sets */}
          <div>
            <span className="block text-xs font-medium text-stone-500 mb-1.5">Quick Scenarios</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setRawWeight(selectedContainer.empty_weight_g + 20)}
                className="px-2.5 py-1 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100"
              >
                Almost Empty (4%)
              </button>
              <button
                onClick={() =>
                  setRawWeight(
                    selectedContainer.empty_weight_g +
                      Math.round(
                        (selectedContainer.capacity_g - selectedContainer.empty_weight_g) * 0.18
                      )
                  )
                }
                className="px-2.5 py-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100"
              >
                Low Threshold (18%)
              </button>
              <button
                onClick={() => setRawWeight(selectedContainer.capacity_g - 50)}
                className="px-2.5 py-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100"
              >
                Full Jar (95%)
              </button>
            </div>
          </div>

          {/* Battery Voltage Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-stone-700">Node Battery Voltage</span>
              <span className="font-mono font-bold text-stone-900">{batteryV.toFixed(2)} V</span>
            </div>
            <input
              type="range"
              min="3.0"
              max="4.2"
              step="0.05"
              value={batteryV}
              onChange={(e) => setBatteryV(Number(e.target.value))}
              className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
            />
          </div>

          {/* Noise & Auto-Pour Toggles */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            <label className="flex items-center space-x-2 cursor-pointer text-xs text-stone-700 font-medium">
              <input
                type="checkbox"
                checked={addNoise}
                onChange={(e) => setAddNoise(e.target.checked)}
                className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
              />
              <span>Simulate ADC Load Cell Noise (±2g)</span>
            </label>

            <button
              onClick={() => setIsAutoPouring(!isAutoPoring)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                isAutoPoring
                  ? 'bg-amber-500 text-stone-950 animate-pulse'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {isAutoPoring ? (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>Stop Pouring Loop</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Auto-Pour Loop</span>
                </>
              )}
            </button>
          </div>

          {/* Transmit Action */}
          <button
            onClick={() => handleTransmit()}
            disabled={isSending}
            className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 shadow-xs transition-colors"
          >
            <Send className={`w-4 h-4 ${isSending ? 'animate-bounce' : ''}`} />
            <span>Transmit BLE Telemetry Packet to Endpoint</span>
          </button>
        </div>

        {/* Right: Live Ingestion Packet Log */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-3">
              <div>
                <h3 className="font-bold text-stone-900 text-base">Hub Gateway Ingestion Feed</h3>
                <p className="text-xs text-stone-500">Live packets ingested and forwarded to endpoint.</p>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                {packetLogs.length} logged
              </span>
            </div>

            {/* Packet Table */}
            <div className="overflow-hidden rounded-xl border border-stone-100">
              <div className="max-h-[360px] overflow-y-auto font-mono text-xs">
                {packetLogs.length === 0 ? (
                  <div className="p-8 text-center text-stone-400 font-sans">
                    <Radio className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                    <p className="text-xs">No packets transmitted yet.</p>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Click "Transmit BLE Telemetry Packet" on the left to fire a live payload.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="bg-stone-50 text-[10px] text-stone-500 uppercase tracking-wider sticky top-0">
                      <tr>
                        <th className="p-2 pl-3">Time</th>
                        <th className="p-2">Node</th>
                        <th className="p-2">Raw/Net</th>
                        <th className="p-2">Fill</th>
                        <th className="p-2 pr-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {packetLogs.map((pkt) => (
                        <tr key={pkt.id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="p-2 pl-3 text-stone-500">{pkt.timestamp}</td>
                          <td className="p-2 font-bold text-stone-800">{pkt.containerId}</td>
                          <td className="p-2 text-stone-700">
                            {pkt.rawGrams}g <span className="text-stone-400">({pkt.netGrams}g)</span>
                          </td>
                          <td className="p-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                pkt.fillPct <= 10
                                  ? 'bg-rose-100 text-rose-800'
                                  : pkt.fillPct <= 25
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {pkt.fillPct}%
                            </span>
                          </td>
                          <td className="p-2 pr-3">
                            <span className="inline-flex items-center text-emerald-600 text-[11px]">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              200 OK
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Last Response Payload Viewer */}
          {lastResponse && (
            <div className="mt-4 p-3 bg-stone-950 text-stone-200 rounded-xl font-mono text-[11px] overflow-x-auto">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider block mb-1">
                Server Response Payload:
              </span>
              <pre>{JSON.stringify(lastResponse, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
