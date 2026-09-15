import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { ContainerNode, AlertNotification, HubStatus } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory data store for the smart kitchen inventory service
const now = Date.now();

let containers: ContainerNode[] = [
  {
    id: 'jar_001',
    name: 'Jar 01 - Arabica Coffee',
    ingredient: 'Arabica Coffee Beans',
    category: 'Coffee & Tea',
    raw_weight_g: 220,
    empty_weight_g: 150,
    capacity_g: 500,
    battery_v: 3.82,
    battery_pct: 82,
    rssi: -58,
    low_threshold_pct: 25,
    last_updated: now - 1000 * 60 * 2,
    status: 'low',
    net_weight_g: 70,
    fill_pct: 20,
    telemetry_history: [
      { timestamp: now - 1000 * 60 * 60 * 12, weight_g: 390, fill_pct: 68 },
      { timestamp: now - 1000 * 60 * 60 * 8, weight_g: 330, fill_pct: 51 },
      { timestamp: now - 1000 * 60 * 60 * 4, weight_g: 270, fill_pct: 34 },
      { timestamp: now - 1000 * 60 * 2, weight_g: 220, fill_pct: 20 },
    ],
  },
  {
    id: 'jar_002',
    name: 'Jar 02 - Jasmine Rice',
    ingredient: 'Jasmine White Rice',
    category: 'Grains',
    raw_weight_g: 1480,
    empty_weight_g: 240,
    capacity_g: 1500,
    battery_v: 4.12,
    battery_pct: 95,
    rssi: -52,
    low_threshold_pct: 15,
    last_updated: now - 1000 * 60 * 5,
    status: 'online',
    net_weight_g: 1240,
    fill_pct: 98,
    telemetry_history: [
      { timestamp: now - 1000 * 60 * 60 * 24, weight_g: 1500, fill_pct: 100 },
      { timestamp: now - 1000 * 60 * 5, weight_g: 1480, fill_pct: 98 },
    ],
  },
  {
    id: 'jar_003',
    name: 'Jar 03 - Bread Flour',
    ingredient: 'Unbleached Bread Flour',
    category: 'Baking',
    raw_weight_g: 220,
    empty_weight_g: 190,
    capacity_g: 1000,
    battery_v: 3.65,
    battery_pct: 45,
    rssi: -64,
    low_threshold_pct: 20,
    last_updated: now - 1000 * 60 * 15,
    status: 'critical',
    net_weight_g: 30,
    fill_pct: 4,
    telemetry_history: [
      { timestamp: now - 1000 * 60 * 60 * 48, weight_g: 890, fill_pct: 86 },
      { timestamp: now - 1000 * 60 * 60 * 24, weight_g: 450, fill_pct: 32 },
      { timestamp: now - 1000 * 60 * 15, weight_g: 220, fill_pct: 4 },
    ],
  },
  {
    id: 'jar_004',
    name: 'Jar 04 - Rolled Oats',
    ingredient: 'Organic Rolled Oats',
    category: 'Grains',
    raw_weight_g: 450,
    empty_weight_g: 170,
    capacity_g: 700,
    battery_v: 3.98,
    battery_pct: 88,
    rssi: -60,
    low_threshold_pct: 20,
    last_updated: now - 1000 * 60 * 30,
    status: 'online',
    net_weight_g: 280,
    fill_pct: 53,
    telemetry_history: [
      { timestamp: now - 1000 * 60 * 60 * 24, weight_g: 580, fill_pct: 77 },
      { timestamp: now - 1000 * 60 * 30, weight_g: 450, fill_pct: 53 },
    ],
  },
  {
    id: 'jar_005',
    name: 'Jar 05 - Golden Cane Sugar',
    ingredient: 'Raw Cane Sugar',
    category: 'Baking',
    raw_weight_g: 330,
    empty_weight_g: 200,
    capacity_g: 900,
    battery_v: 3.74,
    battery_pct: 62,
    rssi: -70,
    low_threshold_pct: 25,
    last_updated: now - 1000 * 60 * 45,
    status: 'low',
    net_weight_g: 130,
    fill_pct: 19,
    telemetry_history: [
      { timestamp: now - 1000 * 60 * 60 * 24, weight_g: 650, fill_pct: 64 },
      { timestamp: now - 1000 * 60 * 45, weight_g: 330, fill_pct: 19 },
    ],
  },
];

let alerts: AlertNotification[] = [
  {
    id: 'alert_001',
    container_id: 'jar_003',
    container_name: 'Jar 03 - Bread Flour',
    ingredient: 'Unbleached Bread Flour',
    type: 'critical_stock',
    message: 'Bread Flour is critically low at 4% (30g remaining). Added to smart grocery list.',
    timestamp: now - 1000 * 60 * 15,
    read: false,
  },
  {
    id: 'alert_002',
    container_id: 'jar_001',
    container_name: 'Jar 01 - Arabica Coffee',
    ingredient: 'Arabica Coffee Beans',
    type: 'low_stock',
    message: 'Arabica Coffee Beans reached 20% threshold (70g remaining).',
    timestamp: now - 1000 * 60 * 2,
    read: false,
  },
  {
    id: 'alert_003',
    container_id: 'jar_005',
    container_name: 'Jar 05 - Golden Cane Sugar',
    ingredient: 'Raw Cane Sugar',
    type: 'low_stock',
    message: 'Raw Cane Sugar reached 19% threshold (130g remaining).',
    timestamp: now - 1000 * 60 * 45,
    read: true,
  },
];

const hubStartTime = Date.now();
const hubStatus: HubStatus = {
  is_online: true,
  uptime_seconds: 3600,
  packets_received: 142,
  active_nodes_count: containers.length,
  adapter_mode: 'rest',
  ble_scanning: true,
  last_heartbeat: Date.now(),
};

// SSE connected clients
type SSEClient = Response;
const sseClients: Set<SSEClient> = new Set();

function broadcastEvent(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  });
}

// Utility to re-calculate container metrics
function calculateContainerMetrics(container: ContainerNode, newRawWeight?: number, newBatteryV?: number, newRssi?: number): ContainerNode {
  const rawWeight = typeof newRawWeight === 'number' ? newRawWeight : container.raw_weight_g;
  const usableCapacity = Math.max(10, container.capacity_g - container.empty_weight_g);
  const netWeight = Math.max(0, Math.round(rawWeight - container.empty_weight_g));
  const fillPct = Math.min(100, Math.max(0, Math.round((netWeight / usableCapacity) * 100)));

  let status: ContainerNode['status'] = 'online';
  if (fillPct <= 5) {
    status = 'critical';
  } else if (fillPct <= container.low_threshold_pct) {
    status = 'low';
  }

  const batteryV = typeof newBatteryV === 'number' ? newBatteryV : container.battery_v;
  // approximate 3.0V = 0%, 4.2V = 100%
  const batteryPct = Math.min(100, Math.max(0, Math.round(((batteryV - 3.0) / 1.2) * 100)));

  return {
    ...container,
    raw_weight_g: rawWeight,
    net_weight_g: netWeight,
    fill_pct: fillPct,
    status,
    battery_v: batteryV,
    battery_pct: batteryPct,
    rssi: typeof newRssi === 'number' ? newRssi : container.rssi,
    last_updated: Date.now(),
  };
}

// ==========================================
// API ROUTES
// ==========================================

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Smart Kitchen Inventory System',
    timestamp: Date.now(),
    containers_count: containers.length,
    active_alerts: alerts.filter((a) => !a.read).length,
  });
});

// SSE endpoint for live updates
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  sseClients.add(res);

  // Send initial snapshot
  res.write(`event: initial_state\ndata: ${JSON.stringify({ containers, alerts, hubStatus })}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Ingress endpoint for telemetry packets
app.post('/api/telemetry', (req: Request, res: Response) => {
  const { container_id, raw_weight_g, battery_v, rssi, timestamp } = req.body;

  if (!container_id || typeof raw_weight_g !== 'number') {
    return res.status(400).json({
      error: 'Invalid payload. "container_id" (string) and "raw_weight_g" (number) are required.',
    });
  }

  const existingIndex = containers.findIndex((c) => c.id === container_id);
  let updatedContainer: ContainerNode;
  let isNewContainer = false;

  if (existingIndex >= 0) {
    const prev = containers[existingIndex];
    updatedContainer = calculateContainerMetrics(prev, raw_weight_g, battery_v, rssi);

    // Keep up to 20 history points
    const newPoint = {
      timestamp: timestamp || Date.now(),
      weight_g: updatedContainer.net_weight_g,
      fill_pct: updatedContainer.fill_pct,
    };
    const history = [...(prev.telemetry_history || []), newPoint].slice(-20);
    updatedContainer.telemetry_history = history;

    containers[existingIndex] = updatedContainer;
  } else {
    // Auto-register discovered node with sensible defaults
    isNewContainer = true;
    const defaultTare = 150;
    const defaultCapacity = 1000;
    const netWeight = Math.max(0, raw_weight_g - defaultTare);
    const fillPct = Math.min(100, Math.max(0, Math.round((netWeight / (defaultCapacity - defaultTare)) * 100)));

    updatedContainer = {
      id: container_id,
      name: `Discovered Container (${container_id})`,
      ingredient: 'Unassigned Ingredient',
      category: 'Pantry',
      raw_weight_g,
      empty_weight_g: defaultTare,
      capacity_g: defaultCapacity,
      battery_v: battery_v || 3.9,
      battery_pct: Math.min(100, Math.max(0, Math.round((((battery_v || 3.9) - 3.0) / 1.2) * 100))),
      rssi: rssi || -65,
      low_threshold_pct: 20,
      last_updated: Date.now(),
      status: fillPct <= 10 ? 'critical' : fillPct <= 20 ? 'low' : 'online',
      net_weight_g: netWeight,
      fill_pct: fillPct,
      telemetry_history: [
        {
          timestamp: timestamp || Date.now(),
          weight_g: netWeight,
          fill_pct: fillPct,
        },
      ],
    };
    containers.push(updatedContainer);
  }

  // Update hub status
  hubStatus.packets_received += 1;
  hubStatus.last_heartbeat = Date.now();
  hubStatus.active_nodes_count = containers.length;

  // Check alert condition
  let alertTriggered = false;
  if (updatedContainer.fill_pct <= updatedContainer.low_threshold_pct) {
    const isCritical = updatedContainer.fill_pct <= 8;
    const alertType = isCritical ? 'critical_stock' : 'low_stock';

    // Prevent duplicate alert within 15 minutes for the same container
    const recentAlert = alerts.find(
      (a) => a.container_id === container_id && Date.now() - a.timestamp < 1000 * 60 * 15 && a.type === alertType
    );

    if (!recentAlert) {
      const newAlert: AlertNotification = {
        id: `alert_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        container_id: updatedContainer.id,
        container_name: updatedContainer.name,
        ingredient: updatedContainer.ingredient,
        type: alertType,
        message: `${updatedContainer.ingredient} is ${isCritical ? 'critically low' : 'running low'} at ${updatedContainer.fill_pct}% (${updatedContainer.net_weight_g}g remaining).`,
        timestamp: Date.now(),
        read: false,
      };
      alerts.unshift(newAlert);
      alertTriggered = true;
      broadcastEvent('new_alert', newAlert);
    }
  }

  // Broadcast update to all connected UIs
  broadcastEvent('telemetry_update', {
    container: updatedContainer,
    isNew: isNewContainer,
    hubStatus,
  });

  return res.json({
    success: true,
    container_id: updatedContainer.id,
    net_weight_g: updatedContainer.net_weight_g,
    fill_pct: updatedContainer.fill_pct,
    status: updatedContainer.status,
    alert_triggered: alertTriggered,
  });
});

// Get all inventory
app.get('/api/inventory', (req: Request, res: Response) => {
  res.json({
    containers,
    summary: {
      total_containers: containers.length,
      low_stock_count: containers.filter((c) => c.status === 'low' || c.status === 'critical').length,
      critical_stock_count: containers.filter((c) => c.status === 'critical').length,
      healthy_count: containers.filter((c) => c.status === 'online').length,
    },
  });
});

// Register or edit container
app.post('/api/containers', (req: Request, res: Response) => {
  const { id, name, ingredient, category, empty_weight_g, capacity_g, low_threshold_pct } = req.body;

  if (!id || !ingredient) {
    return res.status(400).json({ error: 'Container ID and ingredient name are required.' });
  }

  const existing = containers.find((c) => c.id === id);
  if (existing) {
    return res.status(400).json({ error: `Container "${id}" already exists.` });
  }

  const newContainer: ContainerNode = {
    id,
    name: name || `Jar - ${ingredient}`,
    ingredient,
    category: category || 'Pantry',
    raw_weight_g: empty_weight_g || 180,
    empty_weight_g: empty_weight_g || 180,
    capacity_g: capacity_g || 1000,
    battery_v: 4.1,
    battery_pct: 95,
    rssi: -55,
    low_threshold_pct: low_threshold_pct || 20,
    last_updated: Date.now(),
    status: 'critical', // freshly zeroed
    net_weight_g: 0,
    fill_pct: 0,
    telemetry_history: [{ timestamp: Date.now(), weight_g: 0, fill_pct: 0 }],
  };

  containers.push(newContainer);
  broadcastEvent('container_added', newContainer);

  res.status(201).json({ success: true, container: newContainer });
});

// Patch container configuration (ingredient, capacity, tare, threshold)
app.patch('/api/containers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = containers.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Container not found.' });
  }

  const target = containers[index];
  const { name, ingredient, category, empty_weight_g, capacity_g, low_threshold_pct } = req.body;

  if (name !== undefined) target.name = name;
  if (ingredient !== undefined) target.ingredient = ingredient;
  if (category !== undefined) target.category = category;
  if (typeof empty_weight_g === 'number') target.empty_weight_g = empty_weight_g;
  if (typeof capacity_g === 'number') target.capacity_g = capacity_g;
  if (typeof low_threshold_pct === 'number') target.low_threshold_pct = low_threshold_pct;

  // Re-evaluate metrics
  const updated = calculateContainerMetrics(target);
  containers[index] = updated;

  broadcastEvent('container_updated', updated);
  res.json({ success: true, container: updated });
});

// Delete container
app.delete('/api/containers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLength = containers.length;
  containers = containers.filter((c) => c.id !== id);

  if (containers.length === initialLength) {
    return res.status(404).json({ error: 'Container not found.' });
  }

  broadcastEvent('container_deleted', { id });
  res.json({ success: true, deleted_id: id });
});

// Tare container (zero-calibration)
app.post('/api/containers/:id/tare', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = containers.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Container not found.' });
  }

  const target = containers[index];
  // Tare sets empty_weight_g = current raw_weight_g
  target.empty_weight_g = target.raw_weight_g;
  const updated = calculateContainerMetrics(target);
  containers[index] = updated;

  const tareAlert: AlertNotification = {
    id: `alert_tare_${Date.now()}`,
    container_id: target.id,
    container_name: target.name,
    ingredient: target.ingredient,
    type: 'tare_success',
    message: `Scale tare zero-calibrated for ${target.name}. Tare offset set to ${target.empty_weight_g}g.`,
    timestamp: Date.now(),
    read: false,
  };
  alerts.unshift(tareAlert);

  broadcastEvent('container_updated', updated);
  broadcastEvent('new_alert', tareAlert);

  res.json({
    success: true,
    message: `Tare complete for ${target.id}`,
    new_tare_g: target.empty_weight_g,
    net_weight_g: updated.net_weight_g,
  });
});

// Simulate pour or refill directly
app.post('/api/containers/:id/simulate-pour', (req: Request, res: Response) => {
  const { id } = req.params;
  const { delta_g } = req.body; // e.g. -50 to pour 50g, +300 to refill

  const index = containers.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Container not found.' });
  }

  const delta = typeof delta_g === 'number' ? delta_g : -30;
  const target = containers[index];
  const newRaw = Math.max(target.empty_weight_g, target.raw_weight_g + delta);

  const updated = calculateContainerMetrics(target, newRaw);
  const newPoint = {
    timestamp: Date.now(),
    weight_g: updated.net_weight_g,
    fill_pct: updated.fill_pct,
  };
  updated.telemetry_history = [...(target.telemetry_history || []), newPoint].slice(-20);
  containers[index] = updated;

  hubStatus.packets_received += 1;
  hubStatus.last_heartbeat = Date.now();

  // Check alert
  if (updated.fill_pct <= updated.low_threshold_pct) {
    const isCritical = updated.fill_pct <= 8;
    const newAlert: AlertNotification = {
      id: `alert_${Date.now()}`,
      container_id: updated.id,
      container_name: updated.name,
      ingredient: updated.ingredient,
      type: isCritical ? 'critical_stock' : 'low_stock',
      message: `${updated.ingredient} is low at ${updated.fill_pct}% (${updated.net_weight_g}g remaining).`,
      timestamp: Date.now(),
      read: false,
    };
    alerts.unshift(newAlert);
    broadcastEvent('new_alert', newAlert);
  }

  broadcastEvent('telemetry_update', {
    container: updated,
    isNew: false,
    hubStatus,
  });

  res.json({
    success: true,
    container: updated,
    poured_delta_g: delta,
  });
});

// Alerts endpoints
app.get('/api/alerts', (req: Request, res: Response) => {
  res.json({ alerts });
});

app.post('/api/alerts/clear', (req: Request, res: Response) => {
  alerts = [];
  broadcastEvent('alerts_cleared', {});
  res.json({ success: true, message: 'All alerts cleared.' });
});

app.post('/api/alerts/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;
  const alert = alerts.find((a) => a.id === id);
  if (alert) {
    alert.read = true;
    broadcastEvent('alert_read', { id });
  }
  res.json({ success: true });
});

// Hub status & configuration
app.get('/api/hub/status', (req: Request, res: Response) => {
  hubStatus.uptime_seconds = Math.floor((Date.now() - hubStartTime) / 1000);
  res.json(hubStatus);
});

app.post('/api/hub/adapter', (req: Request, res: Response) => {
  const { mode } = req.body;
  if (['rest', 'firebase', 'mqtt'].includes(mode)) {
    hubStatus.adapter_mode = mode;
    broadcastEvent('hub_status_update', hubStatus);
    res.json({ success: true, mode: hubStatus.adapter_mode });
  } else {
    res.status(400).json({ error: 'Mode must be one of "rest", "firebase", or "mqtt".' });
  }
});

// ==========================================
// Vite Middleware / Static Server
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Kitchen Inventory Service listening on port ${PORT}`);
  });
}

startServer();
