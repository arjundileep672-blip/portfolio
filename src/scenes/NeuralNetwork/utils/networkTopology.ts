import * as THREE from 'three';

export interface LayerSpec {
  index: number;
  shortCode: string;
  name: string;
  x: number;
  cols: number;
  rows: number;
  spacingY: number;
  spacingZ: number;
  color: string;
  isResidualAdd?: boolean;
  role: string;
}

export interface NeuronNode {
  id: string;
  layerIndex: number;
  layerName: string;
  neuronIndex: number;
  position: THREE.Vector3;
  color: string;
  baseBias: number;
  role: string;
}

export interface SynapseEdge {
  from: THREE.Vector3;
  to: THREE.Vector3;
  fromLayer: number;
  toLayer: number;
  fromNeuron: number;
  toNeuron: number;
}

export interface SkipArc {
  id: string;
  label: string;
  fromLayer: number;
  toLayer: number;
  curve: THREE.CatmullRomCurve3;
  points: THREE.Vector3[];
}

export const LAYER_SPECS: LayerSpec[] = [
  {
    index: 0,
    shortCode: 'L0 · STEM',
    name: 'Input Stem (7×7 Conv)',
    x: -5.4,
    cols: 3,
    rows: 3,
    spacingY: 0.72,
    spacingZ: 0.72,
    color: '#F2F2EA',
    role: 'Initial spatial feature extraction from raw input tensor x.',
  },
  {
    index: 1,
    shortCode: 'L1 · CONV1',
    name: 'ResBlock 1 · 3×3 Conv A',
    x: -3.5,
    cols: 2,
    rows: 4,
    spacingY: 0.65,
    spacingZ: 0.85,
    color: '#9FD4FF',
    role: 'Learns intermediate residual mapping F₁(x) with BatchNorm + ReLU.',
  },
  {
    index: 2,
    shortCode: 'L2 · (+x) ADD',
    name: 'ResBlock 1 · F(x) + x',
    x: -1.6,
    cols: 2,
    rows: 4,
    spacingY: 0.65,
    spacingZ: 0.85,
    color: '#C5FF55',
    isResidualAdd: true,
    role: 'Element-wise addition combining learned residual F₁(x) with identity shortcut x from L0.',
  },
  {
    index: 3,
    shortCode: 'L3 · CONV2',
    name: 'ResBlock 2 · 3×3 Conv A',
    x: 0.3,
    cols: 2,
    rows: 5,
    spacingY: 0.56,
    spacingZ: 0.9,
    color: '#9FD4FF',
    role: 'Deeper residual transformation F₂(x) extracting higher-level representations.',
  },
  {
    index: 4,
    shortCode: 'L4 · (+x) ADD',
    name: 'ResBlock 2 · F(x) + x',
    x: 2.2,
    cols: 2,
    rows: 5,
    spacingY: 0.56,
    spacingZ: 0.9,
    color: '#C5FF55',
    isResidualAdd: true,
    role: 'Second residual addition node receiving identity skip connection from L2.',
  },
  {
    index: 5,
    shortCode: 'L5 · POOL',
    name: 'Global Average Pooling',
    x: 4.0,
    cols: 2,
    rows: 3,
    spacingY: 0.72,
    spacingZ: 0.75,
    color: '#B79CFF',
    role: 'Aggregates spatial feature maps into a compact representation vector.',
  },
  {
    index: 6,
    shortCode: 'L6 · LOGITS',
    name: 'Classifier Output Layer',
    x: 5.6,
    cols: 1,
    rows: 4,
    spacingY: 0.72,
    spacingZ: 0.0,
    color: '#C5FF55',
    role: 'Fully connected output units producing class score logits.',
  },
];

export function buildResNetTopology(): {
  layers: LayerSpec[];
  neurons: NeuronNode[];
  synapses: SynapseEdge[];
  skipArcs: SkipArc[];
} {
  const neurons: NeuronNode[] = [];
  const layerBuckets: NeuronNode[][] = [];

  LAYER_SPECS.forEach((spec) => {
    const bucket: NeuronNode[] = [];
    let nIdx = 0;
    for (let r = 0; r < spec.rows; r++) {
      for (let c = 0; c < spec.cols; c++) {
        const y = (r - (spec.rows - 1) / 2) * spec.spacingY;
        const z = (c - (spec.cols - 1) / 2) * spec.spacingZ;
        const node: NeuronNode = {
          id: `l${spec.index}-n${nIdx}`,
          layerIndex: spec.index,
          layerName: spec.name,
          neuronIndex: nIdx,
          position: new THREE.Vector3(spec.x, y, z),
          color: spec.color,
          baseBias: 0.25 + ((spec.index * 7 + nIdx * 13) % 10) * 0.06,
          role: spec.role,
        };
        neurons.push(node);
        bucket.push(node);
        nIdx++;
      }
    }
    layerBuckets.push(bucket);
  });

  // Connect adjacent layers with feed-forward synapses
  const synapses: SynapseEdge[] = [];
  for (let l = 0; l < layerBuckets.length - 1; l++) {
    const currentLayer = layerBuckets[l];
    const nextLayer = layerBuckets[l + 1];
    currentLayer.forEach((src) => {
      nextLayer.forEach((dst) => {
        // Connect structured subset to keep visual clarity & high FPS
        if ((src.neuronIndex + dst.neuronIndex) % 2 === 0 || nextLayer.length <= 4) {
          synapses.push({
            from: src.position,
            to: dst.position,
            fromLayer: l,
            toLayer: l + 1,
            fromNeuron: src.neuronIndex,
            toNeuron: dst.neuronIndex,
          });
        }
      });
    });
  }

  // Build Residual Identity Skip Connection Arcs (L0 -> L2 and L2 -> L4)
  const skipPairs: { id: string; label: string; from: number; to: number }[] = [
    { id: 'skip-1', label: 'Identity Shortcut x₁ (L0 → L2)', from: 0, to: 2 },
    { id: 'skip-2', label: 'Identity Shortcut x₂ (L2 → L4)', from: 2, to: 4 },
  ];

  const skipArcs: SkipArc[] = [];
  skipPairs.forEach((pair) => {
    const xStart = LAYER_SPECS[pair.from].x;
    const xEnd = LAYER_SPECS[pair.to].x;
    const xMid = (xStart + xEnd) * 0.5;

    // Create 3 parallel arched skip conduits per residual block (top, front-upper, back-upper)
    [-0.55, 0.0, 0.55].forEach((zOffset, arcIdx) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(xStart, 1.05, zOffset),
        new THREE.Vector3(xMid, 2.15 + (arcIdx === 1 ? 0.22 : 0), zOffset * 1.2),
        new THREE.Vector3(xEnd, 1.05, zOffset),
      ]);
      skipArcs.push({
        id: `${pair.id}-${arcIdx}`,
        label: pair.label,
        fromLayer: pair.from,
        toLayer: pair.to,
        curve,
        points: curve.getPoints(44),
      });
    });
  });

  return {
    layers: LAYER_SPECS,
    neurons,
    synapses,
    skipArcs,
  };
}
