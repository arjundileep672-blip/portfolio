import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { ProjectLabItem, SceneQuality } from '../../types';
import {
  RACK_SIM_DATA,
  NETWORK_NODES_SIM,
  SHIPMENTS_SIM,
  toProjectLabItem,
  type RackSimData,
  type NetworkNodeSimData,
  type ShipmentSimData,
  type SimStatus,
} from '../data/warehouseSimulation';
import { setSceneCursor } from '../../shared/cursor';

export interface WarehouseLayers {
  structure: boolean;
  racks: boolean;
  routes: boolean;
  shipments: boolean;
  recoveryHighlight: boolean;
}

interface WarehouseSceneProps {
  quality: SceneQuality;
  reducedMotion: boolean;
  layers: WarehouseLayers;
  selectedItem: ProjectLabItem | null;
  onSelectItem: (item: ProjectLabItem) => void;
}

function statusToColor(status: SimStatus): string {
  if (status === 'recovery') return '#C5FF55';
  if (status === 'warning') return '#FFB86B';
  return '#9FD4FF';
}

/**
 * Procedural Multi-Tier Storage Rack + Instanced Inventory Boxes
 */
function StorageRack({
  rack,
  selected,
  onSelect,
}: {
  rack: RackSimData;
  selected: boolean;
  onSelect: (item: ProjectLabItem) => void;
}) {
  const statusColor = statusToColor(rack.status);
  const frameColor = selected ? '#C5FF55' : '#282D27';

  // Compute box positions for occupied slots (3 shelves x 4 slots)
  const boxes = useMemo(() => {
    const items: { pos: [number, number, number]; tier: 1 | 2 }[] = [];
    for (let shelf = 0; shelf < 3; shelf++) {
      const y = 0.28 + shelf * 0.44;
      for (let col = 0; col < 4; col++) {
        const slotVal = rack.slots[shelf * 4 + col];
        if (slotVal > 0) {
          const x = -0.54 + col * 0.36;
          items.push({ pos: [x, y, 0], tier: slotVal as 1 | 2 });
        }
      }
    }
    return items;
  }, [rack.slots]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(toProjectLabItem({ kind: 'rack', data: rack }));
  };

  return (
    <group position={rack.position}>
      {/* Interactive hit volume */}
      <mesh
        position={[0, 0.72, 0]}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setSceneCursor('Inspect Rack');
        }}
        onPointerOut={() => setSceneCursor(null)}
      >
        <boxGeometry args={[1.68, 1.5, 0.72]} />
        <meshBasicMaterial
          color={selected ? '#C5FF55' : statusColor}
          transparent
          opacity={selected ? 0.12 : 0.02}
          depthWrite={false}
        />
      </mesh>

      {/* Base Zone Pad */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <planeGeometry args={[1.76, 0.84]} />
        <meshBasicMaterial
          color={selected ? '#C5FF55' : statusColor}
          transparent
          opacity={selected ? 0.28 : 0.09}
        />
      </mesh>

      {/* 4 Vertical Uprights */}
      {[-0.78, 0.78].map((x) =>
        [-0.28, 0.28].map((z) => (
          <mesh key={`post-${x}-${z}`} position={[x, 0.72, z]} raycast={() => null}>
            <boxGeometry args={[0.04, 1.44, 0.04]} />
            <meshStandardMaterial color={frameColor} metalness={0.7} roughness={0.3} />
          </mesh>
        ))
      )}

      {/* 3 Horizontal Shelf Decks */}
      {[0.14, 0.58, 1.02, 1.42].map((y, idx) => (
        <mesh key={`shelf-${idx}`} position={[0, y, 0]} raycast={() => null}>
          <boxGeometry args={[1.6, 0.03, 0.6]} />
          <meshStandardMaterial
            color={selected ? '#C5FF55' : '#181C17'}
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>
      ))}

      {/* Inventory Cargo Boxes on Shelves */}
      {boxes.map((b, i) => {
        const isAlertBox = b.tier === 2;
        const boxColor = isAlertBox ? statusColor : '#F2F2EA';
        return (
          <mesh key={`box-${i}`} position={b.pos} raycast={() => null}>
            <boxGeometry args={[0.28, 0.24, 0.44]} />
            <meshStandardMaterial
              color={boxColor}
              emissive={isAlertBox || selected ? statusColor : '#000000'}
              emissiveIntensity={isAlertBox ? 0.45 : selected ? 0.2 : 0}
              roughness={0.35}
              metalness={0.3}
            />
          </mesh>
        );
      })}

      {/* Overhead Status Beacon */}
      <mesh position={[0, 1.62, 0]} raycast={() => null}>
        <octahedronGeometry args={[0.07, 0]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>

      {/* Rack Code Micro-Tag */}
      <Html position={[0, 1.85, 0]} center distanceFactor={15} style={{ pointerEvents: 'none' }}>
        <div
          className={`border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider whitespace-nowrap transition-colors ${
            selected
              ? 'border-acid bg-acid text-ink font-semibold'
              : rack.status === 'warning'
              ? 'border-[#FFB86B]/70 bg-ink-2/90 text-[#FFB86B]'
              : rack.status === 'recovery'
              ? 'border-acid/60 bg-ink-2/90 text-acid'
              : 'border-line bg-ink/85 text-bone/85'
          }`}
        >
          {rack.id.toUpperCase()}
        </div>
      </Html>
    </group>
  );
}

/**
 * Supply Chain Network Node Beacon on Tactical Ground Plane
 */
function SupplyNetworkNode({
  node,
  selected,
  reducedMotion,
  onSelect,
}: {
  node: NetworkNodeSimData;
  selected: boolean;
  reducedMotion: boolean;
  onSelect: (item: ProjectLabItem) => void;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const color = statusToColor(node.status);

  useFrame((state) => {
    if (!ringRef.current || reducedMotion) return;
    const t = state.clock.getElapsedTime();
    const s = 1 + Math.sin(t * 2.8) * 0.14;
    ringRef.current.scale.set(s, s, 1);
  });

  return (
    <group position={node.position}>
      <mesh
        position={[0, 0.18, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(toProjectLabItem({ kind: 'node', data: node }));
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setSceneCursor('Inspect Node');
        }}
        onPointerOut={() => setSceneCursor(null)}
      >
        <cylinderGeometry args={[0.24, 0.3, 0.36, 6]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 0.9 : 0.45}
          metalness={0.7}
          roughness={0.25}
        />
      </mesh>

      {/* Ground Pulse Ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} raycast={() => null}>
        <ringGeometry args={[0.38, 0.45, 24]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.75} />
      </mesh>

      <Html position={[0, 0.58, 0]} center distanceFactor={16} style={{ pointerEvents: 'none' }}>
        <div
          className={`border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest whitespace-nowrap ${
            selected
              ? 'border-acid bg-acid text-ink font-semibold'
              : 'border-line bg-ink-2/95 text-bone'
          }`}
        >
          {node.code}
        </div>
      </Html>
    </group>
  );
}

/**
 * Route Corridor Curve + Moving Autonomous Shipment Marker
 */
function ShipmentRouteAndMarker({
  shipment,
  showRoute,
  showShipment,
  highlightRecovery,
  selected,
  reducedMotion,
  onSelect,
}: {
  shipment: ShipmentSimData;
  showRoute: boolean;
  showShipment: boolean;
  highlightRecovery: boolean;
  selected: boolean;
  reducedMotion: boolean;
  onSelect: (item: ProjectLabItem) => void;
}) {
  const markerGroupRef = useRef<THREE.Group>(null);
  const color = statusToColor(shipment.status);

  const { curve, lineGeo } = useMemo(() => {
    const pts = shipment.waypoints.map((w) => new THREE.Vector3(...w));
    const c = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.45);
    const sampled = c.getPoints(64);
    const g = new THREE.BufferGeometry().setFromPoints(sampled);
    return { curve: c, lineGeo: g };
  }, [shipment.waypoints]);

  useFrame((state) => {
    if (!markerGroupRef.current || !showShipment) return;
    const t = reducedMotion
      ? shipment.initialOffset
      : (state.clock.getElapsedTime() * shipment.speed + shipment.initialOffset) % 1.0;

    const pos = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    markerGroupRef.current.position.copy(pos);
    const lookTarget = pos.clone().add(tangent);
    markerGroupRef.current.lookAt(lookTarget);
  });

  const isHighlighted =
    selected || (highlightRecovery && shipment.status === 'recovery');

  return (
    <group>
      {/* 3D Route Curve Line */}
      {showRoute && (
        // @ts-expect-error R3F line primitive conflicts with SVG line in React JSX types
        <line geometry={lineGeo as unknown as THREE.BufferGeometry}>
          <lineBasicMaterial
            color={isHighlighted ? '#C5FF55' : color}
            transparent
            opacity={isHighlighted ? 0.95 : 0.42}
          />
        </line>
      )}

      {/* Moving Shipment Marker */}
      {showShipment && (
        <group ref={markerGroupRef}>
          <mesh
            onClick={(e) => {
              e.stopPropagation();
              onSelect(toProjectLabItem({ kind: 'shipment', data: shipment }));
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setSceneCursor('Track Shipment');
            }}
            onPointerOut={() => setSceneCursor(null)}
          >
            <boxGeometry args={[0.26, 0.18, 0.42]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={selected ? 1.1 : 0.65}
              metalness={0.6}
              roughness={0.2}
            />
          </mesh>

          <Html position={[0, 0.34, 0]} center distanceFactor={15} style={{ pointerEvents: 'none' }}>
            <div
              className={`border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider whitespace-nowrap ${
                selected
                  ? 'border-acid bg-acid text-ink font-semibold'
                  : shipment.status === 'warning'
                  ? 'border-[#FFB86B] bg-ink-2/95 text-[#FFB86B]'
                  : 'border-acid/70 bg-ink-2/95 text-acid'
              }`}
            >
              {shipment.code}
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

export function WarehouseScene({
  layers,
  reducedMotion,
  selectedItem,
  onSelectItem,
}: WarehouseSceneProps) {
  useEffect(() => {
    return () => setSceneCursor(null);
  }, []);

  return (
    <group>
      {/* Tactical Ground Grid */}
      <gridHelper
        args={[16, 32, '#282D27', '#141814']}
        position={[0, 0, 0]}
        raycast={() => null}
      />

      {/* Warehouse Architectural Wireframe Shell & Zone Boundaries */}
      {layers.structure && (
        <group raycast={() => null}>
          {/* Main Warehouse Footprint Perimeter */}
          <mesh position={[0, 1.25, -0.7]}>
            <boxGeometry args={[7.2, 2.5, 4.2]} />
            <meshBasicMaterial color="#282D27" wireframe transparent opacity={0.32} />
          </mesh>
          {/* Floor Slab */}
          <mesh position={[0, -0.01, -0.7]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[7.2, 4.2]} />
            <meshStandardMaterial color="#0C0F0C" roughness={0.9} metalness={0.1} />
          </mesh>
        </group>
      )}

      {/* Interactive Storage Racks & Inventory */}
      {layers.racks &&
        RACK_SIM_DATA.map((rack) => (
          <StorageRack
            key={rack.id}
            rack={rack}
            selected={selectedItem?.id === rack.id}
            onSelect={onSelectItem}
          />
        ))}

      {/* Supply Chain Network Nodes */}
      {layers.routes &&
        NETWORK_NODES_SIM.map((node) => (
          <SupplyNetworkNode
            key={node.id}
            node={node}
            selected={selectedItem?.id === node.id}
            reducedMotion={reducedMotion}
            onSelect={onSelectItem}
          />
        ))}

      {/* Supply Chain Route Curves & Moving Shipments */}
      {SHIPMENTS_SIM.map((shipment) => (
        <ShipmentRouteAndMarker
          key={shipment.id}
          shipment={shipment}
          showRoute={layers.routes}
          showShipment={layers.shipments}
          highlightRecovery={layers.recoveryHighlight}
          selected={selectedItem?.id === shipment.id}
          reducedMotion={reducedMotion}
          onSelect={onSelectItem}
        />
      ))}
    </group>
  );
}
