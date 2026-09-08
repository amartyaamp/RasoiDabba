export interface TelemetryPoint {
  timestamp: number;
  weight_g: number;
  fill_pct: number;
}

export interface ContainerNode {
  id: string;
  name: string;
  ingredient: string;
  category: 'Pantry' | 'Baking' | 'Coffee & Tea' | 'Grains' | 'Spices' | 'Other';
  raw_weight_g: number;
  empty_weight_g: number;
  capacity_g: number;
  battery_v: number;
  battery_pct: number;
  rssi: number;
  low_threshold_pct: number;
  last_updated: number;
  status: 'online' | 'low' | 'critical' | 'offline';
  net_weight_g: number;
  fill_pct: number;
  telemetry_history: TelemetryPoint[];
}

export interface AlertNotification {
  id: string;
  container_id: string;
  container_name: string;
  ingredient: string;
  type: 'low_stock' | 'critical_stock' | 'low_battery' | 'node_offline' | 'tare_success';
  message: string;
  timestamp: number;
  read: boolean;
}

export interface HubStatus {
  is_online: boolean;
  uptime_seconds: number;
  packets_received: number;
  active_nodes_count: number;
  adapter_mode: 'rest' | 'firebase' | 'mqtt';
  ble_scanning: boolean;
  last_heartbeat: number;
}

export interface RoadmapPhase {
  id: string;
  phase: number;
  title: string;
  subtitle: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  description: string;
  deliverables: string[];
  specs: {
    protocol?: string;
    payloadFormat?: string;
    endpoint?: string;
  };
  codeSnippet: {
    language: string;
    filename: string;
    title: string;
    code: string;
  };
}
