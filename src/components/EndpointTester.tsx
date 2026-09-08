import React, { useState } from 'react';
import { Play, Copy, Check, Terminal, Code2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface EndpointPreset {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PATCH';
  path: string;
  description: string;
  defaultPayload?: string;
}

const PRESETS: EndpointPreset[] = [
  {
    id: 'telemetry_ingress',
    name: '1. Ingest Sensor Telemetry',
    method: 'POST',
    path: '/api/telemetry',
    description: 'Primary ingress endpoint called by Raspberry Pi Hub or ESP32 Wi-Fi nodes.',
    defaultPayload: JSON.stringify(
      {
        container_id: 'jar_001',
        raw_weight_g: 215,
        battery_v: 3.84,
        rssi: -58,
        timestamp: Date.now(),
      },
      null,
      2
    ),
  },
  {
    id: 'tare_scale',
    name: '2. Tare (Zero) Container Scale',
    method: 'POST',
    path: '/api/containers/jar_001/tare',
    description: 'Calibrate empty jar weight. Sets empty_weight_g to current raw load cell weight.',
    defaultPayload: '{}',
  },
  {
    id: 'simulate_pour',
    name: '3. Simulate Pouring Delta',
    method: 'POST',
    path: '/api/containers/jar_001/simulate-pour',
    description: 'Adjust net weight by delta grams (e.g. -45g poured out for cooking).',
    defaultPayload: JSON.stringify({ delta_g: -45 }, null, 2),
  },
  {
    id: 'get_inventory',
    name: '4. Get Kitchen Inventory',
    method: 'GET',
    path: '/api/inventory',
    description: 'Returns list of all container nodes, fill levels, net weights, and stock summary.',
  },
  {
    id: 'get_alerts',
    name: '5. Get Low-Stock Alerts',
    method: 'GET',
    path: '/api/alerts',
    description: 'Returns list of active grocery alerts and warnings for items below threshold.',
  },
  {
    id: 'get_hub_status',
    name: '6. Get Hub Gateway Status',
    method: 'GET',
    path: '/api/hub/status',
    description: 'Returns gateway health, uptime, active BLE nodes count, and network adapter mode.',
  },
];

export const EndpointTester: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<EndpointPreset>(PRESETS[0]);
  const [endpointPath, setEndpointPath] = useState<string>(PRESETS[0].path);
  const [method, setMethod] = useState<'GET' | 'POST' | 'PATCH'>(PRESETS[0].method);
  const [payload, setPayload] = useState<string>(PRESETS[0].defaultPayload || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<any>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleSelectPreset = (preset: EndpointPreset) => {
    setSelectedPreset(preset);
    setEndpointPath(preset.path);
    setMethod(preset.method);
    setPayload(preset.defaultPayload || '');
  };

  const executeRequest = async () => {
    setIsLoading(true);
    const start = performance.now();

    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (method !== 'GET' && payload.trim()) {
        try {
          JSON.parse(payload); // Validate JSON syntax
          options.body = payload;
        } catch (e: any) {
          setResponseStatus(400);
          setResponseBody({ error: `JSON Parse Error in request payload: ${e.message}` });
          setResponseTimeMs(0);
          setIsLoading(false);
          return;
        }
      }

      const res = await fetch(endpointPath, options);
      const elapsed = Math.round(performance.now() - start);
      setResponseStatus(res.status);
      setResponseTimeMs(elapsed);

      const json = await res.json();
      setResponseBody(json);
    } catch (err: any) {
      setResponseStatus(500);
      setResponseBody({ error: err.message || 'Network request failed' });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate curl command
  const curlCommand =
    method === 'GET'
      ? `curl -X GET "http://localhost:3000${endpointPath}"`
      : `curl -X ${method} "http://localhost:3000${endpointPath}" \\\n  -H "Content-Type: application/json" \\\n  -d '${payload.replace(/\n/g, '')}'`;

  const copyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-xl bg-stone-900 text-amber-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900">Live Endpoint Workbench</h2>
            <p className="text-xs text-stone-500">
              Interactive test console for the running backend service. Test HTTP requests from physical
              ESP32s or Raspberry Pi gateways.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Presets & Request Configuration */}
        <div className="lg:col-span-6 space-y-4">
          {/* Preset Buttons */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs">
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              Select API Endpoint Preset:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                    selectedPreset.id === preset.id
                      ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                      : 'border-stone-200 bg-stone-50/60 hover:bg-stone-100 text-stone-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">{preset.name}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase font-semibold ${
                        preset.method === 'POST'
                          ? selectedPreset.id === preset.id
                            ? 'bg-amber-400 text-stone-950'
                            : 'bg-amber-100 text-amber-800'
                          : selectedPreset.id === preset.id
                          ? 'bg-emerald-400 text-stone-950'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {preset.method}
                    </span>
                  </div>
                  <p
                    className={`text-[11px] line-clamp-1 ${
                      selectedPreset.id === preset.id ? 'text-stone-300' : 'text-stone-500'
                    }`}
                  >
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Request URL and Method */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1.5 bg-stone-100 border border-stone-200 font-mono font-bold text-xs rounded-xl text-stone-800">
                {method}
              </span>
              <input
                type="text"
                value={endpointPath}
                onChange={(e) => setEndpointPath(e.target.value)}
                className="flex-1 px-3 py-1.5 font-mono text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900/10 focus:outline-hidden"
              />
              <button
                onClick={executeRequest}
                disabled={isLoading}
                className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors shrink-0"
              >
                <Play className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Send</span>
              </button>
            </div>

            {/* Request Body (if POST/PATCH) */}
            {method !== 'GET' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Request JSON Body:
                </label>
                <textarea
                  rows={6}
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  className="w-full font-mono text-xs p-3 bg-stone-950 text-emerald-400 rounded-xl border border-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>
            )}

            {/* Live cURL Command */}
            <div className="pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
                <span className="font-semibold">Equivalent cURL (Copy for Terminal / ESP32):</span>
                <button
                  onClick={copyCurl}
                  className="flex items-center space-x-1 text-stone-700 hover:text-stone-900"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-medium text-[11px]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Copy cURL</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-2.5 bg-stone-100 rounded-xl text-[11px] font-mono text-stone-800 overflow-x-auto whitespace-pre-wrap">
                {curlCommand}
              </pre>
            </div>
          </div>
        </div>

        {/* Right: Live Response Inspector */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-3">
              <div>
                <h3 className="font-bold text-stone-900 text-base">HTTP Response Inspector</h3>
                <p className="text-xs text-stone-500">Live output from the endpoint execution.</p>
              </div>
              {responseStatus !== null && (
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-bold font-mono ${
                      responseStatus >= 200 && responseStatus < 300
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    HTTP {responseStatus}
                  </span>
                  {responseTimeMs !== null && (
                    <span className="text-xs text-stone-500 font-mono flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {responseTimeMs} ms
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Response Body Box */}
            <div className="overflow-hidden rounded-xl border border-stone-800 bg-stone-950 p-3 min-h-[300px] max-h-[460px] overflow-y-auto">
              {responseBody ? (
                <pre className="font-mono text-xs text-emerald-400 whitespace-pre-wrap">
                  {JSON.stringify(responseBody, null, 2)}
                </pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-stone-500 py-16 text-center font-sans">
                  <Terminal className="w-8 h-8 mb-2 text-stone-700" />
                  <p className="text-xs">No request executed yet.</p>
                  <p className="text-[11px] text-stone-600 mt-1">
                    Click "Send" on the left to fire a test request to the endpoint.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
