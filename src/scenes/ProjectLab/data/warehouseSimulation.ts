import type { ProjectLabItem } from '../../types';

export type SimStatus = 'nominal' | 'warning' | 'recovery';

export interface RackSimData {
  id: string;
  zone: string;
  label: string;
  position: [number, number, number];
  status: SimStatus;
  occupancyLabel: string;
  detail: string;
  /** 3 shelves x 4 slots boolean/status matrix for procedural box placement */
  slots: (0 | 1 | 2)[]; // 0 = empty, 1 = standard box, 2 = highlighted/alert box
}

export interface NetworkNodeSimData {
  id: string;
  code: string;
  label: string;
  position: [number, number, number];
  status: SimStatus;
  detail: string;
}

export interface ShipmentSimData {
  id: string;
  code: string;
  label: string;
  routeId: string;
  speed: number;
  initialOffset: number;
  status: SimStatus;
  detail: string;
  waypoints: [number, number, number][];
}

export const RACK_SIM_DATA: RackSimData[] = [
  {
    id: 'rack-a1',
    zone: 'ZONE A // INBOUND',
    label: 'Rack A-01 · Raw Components',
    position: [-2.4, 0, -1.6],
    status: 'nominal',
    occupancyLabel: 'Simulated Stock: High buffer',
    detail:
      'Simulation: Inbound staging rack receiving raw electronic & mechanical sub-assemblies. Automated barcode verification active.',
    slots: [1, 1, 1, 0, 1, 1, 2, 1, 1, 0, 1, 1],
  },
  {
    id: 'rack-a2',
    zone: 'ZONE A // INBOUND',
    label: 'Rack A-02 · Sensor Modules',
    position: [-2.4, 0, 0.2],
    status: 'warning',
    occupancyLabel: 'Simulated Alert: Buffer threshold',
    detail:
      'Simulation: Stock monitoring flagged a reorder threshold on optical sensor pallets due to upstream port delay. Agentic replenishment queued.',
    slots: [1, 0, 2, 0, 0, 2, 0, 1, 0, 0, 2, 0],
  },
  {
    id: 'rack-b1',
    zone: 'ZONE B // CORE STORAGE',
    label: 'Rack B-01 · High-Density Core',
    position: [0.0, 0, -1.6],
    status: 'nominal',
    occupancyLabel: 'Simulated Stock: Stable',
    detail:
      'Simulation: Primary climate-monitored storage aisle. Multi-tier pallet tracking linked to PostgreSQL/Neon inventory ledger.',
    slots: [1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 0, 1],
  },
  {
    id: 'rack-b2',
    zone: 'ZONE B // CORE STORAGE',
    label: 'Rack B-02 · Safety Reserve',
    position: [0.0, 0, 0.2],
    status: 'recovery',
    occupancyLabel: 'Simulated Mode: AI Recovery Allocation',
    detail:
      'Simulation: Safety reserve unlocked by ChainHandler recovery decision support to cover delayed coastal freight corridor.',
    slots: [2, 2, 1, 2, 1, 2, 2, 1, 2, 1, 1, 0],
  },
  {
    id: 'rack-c1',
    zone: 'ZONE C // DISPATCH',
    label: 'Rack C-01 · Outbound Consolidation',
    position: [2.4, 0, -1.6],
    status: 'nominal',
    occupancyLabel: 'Simulated Stock: Ready for dispatch',
    detail:
      'Simulation: Outbound staging rack sorted for regional distribution routes via OSRM-calculated road corridors.',
    slots: [1, 1, 0, 1, 1, 1, 1, 0, 2, 1, 1, 1],
  },
  {
    id: 'rack-c2',
    zone: 'ZONE C // DISPATCH',
    label: 'Rack C-02 · Priority Express Bay',
    position: [2.4, 0, 0.2],
    status: 'recovery',
    occupancyLabel: 'Simulated Mode: Expedited Reroute',
    detail:
      'Simulation: Priority express bay dynamically assigned to Shipment SHIP-312 on the agentic recovery route.',
    slots: [2, 1, 2, 1, 2, 2, 0, 1, 1, 2, 1, 0],
  },
];

export const NETWORK_NODES_SIM: NetworkNodeSimData[] = [
  {
    id: 'node-sup-01',
    code: 'SUP-01',
    label: 'Tier-1 Supplier Hub (West)',
    position: [-5.4, 0.08, -3.2],
    status: 'nominal',
    detail:
      'Simulation: Primary upstream manufacturing node feeding raw components into the central warehouse.',
  },
  {
    id: 'node-wh-core',
    code: 'WH-CORE',
    label: 'Central Smart Warehouse',
    position: [0.0, 0.08, 1.8],
    status: 'recovery',
    detail:
      'Simulation: Central ChainHandler hub coordinating inventory visibility, stock alerts, and autonomous rerouting.',
  },
  {
    id: 'node-port-02',
    code: 'PORT-02',
    label: 'Coastal Freight Terminal (Disrupted)',
    position: [-4.6, 0.08, 3.6],
    status: 'warning',
    detail:
      'Simulation: Disruption alert active — congestion detected along standard coastal corridor. Shipments automatically diverted.',
  },
  {
    id: 'node-alt-04',
    code: 'ALT-04',
    label: 'Inland Recovery Relay Node',
    position: [1.8, 0.08, 4.1],
    status: 'recovery',
    detail:
      'Simulation: Alternate inland logistics relay selected by ChainHandler recovery engine to bypass coastal bottleneck.',
  },
  {
    id: 'node-dist-03',
    code: 'DIST-03',
    label: 'Regional Fulfillment Center (East)',
    position: [5.4, 0.08, -1.4],
    status: 'nominal',
    detail:
      'Simulation: Downstream distribution destination receiving consolidated shipments from Central Warehouse and Recovery Relay.',
  },
];

export const SHIPMENTS_SIM: ShipmentSimData[] = [
  {
    id: 'ship-104',
    code: 'SHIP-104',
    label: 'Inbound Convoy #104 · Raw Stock',
    routeId: 'route-inbound',
    speed: 0.22,
    initialOffset: 0.1,
    status: 'nominal',
    detail:
      'Simulation: Inbound replenishment transport carrying sub-assemblies from SUP-01 to Central Smart Warehouse (Zone A).',
    waypoints: [
      [-5.4, 0.16, -3.2],
      [-3.8, 0.55, -2.4],
      [-2.4, 0.25, -1.6],
      [0.0, 0.16, 1.8],
    ],
  },
  {
    id: 'ship-208',
    code: 'SHIP-208',
    label: 'Coastal Freight #208 · Delayed Alert',
    routeId: 'route-disrupted',
    speed: 0.09,
    initialOffset: 0.45,
    status: 'warning',
    detail:
      'Simulation: Disruption alert triggered on Coastal Corridor (PORT-02). ChainHandler flagged stock risk on Rack A-02 and initiated backup routing.',
    waypoints: [
      [-5.4, 0.16, -3.2],
      [-5.2, 0.38, 0.4],
      [-4.6, 0.16, 3.6],
      [-2.1, 0.35, 2.8],
      [0.0, 0.16, 1.8],
    ],
  },
  {
    id: 'ship-312',
    code: 'SHIP-312',
    label: 'Agentic Reroute #312 · Recovery Active',
    routeId: 'route-recovery',
    speed: 0.28,
    initialOffset: 0.72,
    status: 'recovery',
    detail:
      'Simulation: Autonomous recovery shipment routed via Inland Relay (ALT-04) to Regional Fulfillment (DIST-03), maintaining supply continuity.',
    waypoints: [
      [0.0, 0.16, 1.8],
      [1.8, 0.62, 4.1],
      [3.9, 0.58, 1.6],
      [5.4, 0.16, -1.4],
    ],
  },
];

export function toProjectLabItem(
  source:
    | { kind: 'rack'; data: RackSimData }
    | { kind: 'node'; data: NetworkNodeSimData }
    | { kind: 'shipment'; data: ShipmentSimData }
): ProjectLabItem {
  if (source.kind === 'rack') {
    return {
      type: 'rack',
      id: source.data.id,
      label: source.data.label,
      detail: `${source.data.occupancyLabel} — ${source.data.detail}`,
    };
  }
  if (source.kind === 'node') {
    return {
      type: 'node',
      id: source.data.id,
      label: `${source.data.code} · ${source.data.label}`,
      detail: source.data.detail,
    };
  }
  return {
    type: 'shipment',
    id: source.data.id,
    label: source.data.label,
    detail: source.data.detail,
  };
}
