import * as THREE from 'three';
import type { Skill, SkillCategory, SkillCategoryId } from '@/data/skills';

export interface SkillNodeData {
  skill: Skill;
  category: SkillCategory;
  position: THREE.Vector3;
}

export interface CategoryCluster {
  id: SkillCategoryId;
  label: string;
  color: string;
  center: THREE.Vector3;
}

export interface ConnectionLine {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePos: THREE.Vector3;
  targetPos: THREE.Vector3;
  color: string;
  isRelated: boolean;
}

// Fixed 3D centers for each category cluster
export const CATEGORY_CENTERS: Record<SkillCategoryId, [number, number, number]> = {
  programming: [-2.6, 1.4, 0.4],
  frontend: [-1.4, -1.6, 1.6],
  backend: [1.5, -1.4, 1.4],
  database: [2.8, -0.6, -0.6],
  ai: [0.0, 2.4, -1.0],
  tools: [-1.8, -0.8, -2.2],
};

export function computeUniverseLayout(categories: SkillCategory[]): {
  nodes: SkillNodeData[];
  categoryClusters: CategoryCluster[];
  connections: ConnectionLine[];
  nodeMap: Map<string, SkillNodeData>;
} {
  const nodes: SkillNodeData[] = [];
  const categoryClusters: CategoryCluster[] = [];
  const nodeMap = new Map<string, SkillNodeData>();

  // 1. Position clusters and their skills
  categories.forEach((cat) => {
    const centerCoords = CATEGORY_CENTERS[cat.id] || [0, 0, 0];
    const center = new THREE.Vector3(...centerCoords);

    categoryClusters.push({
      id: cat.id,
      label: cat.label,
      color: cat.color,
      center,
    });

    const count = cat.skills.length;
    cat.skills.forEach((skill, idx) => {
      // Golden angle distribution around cluster center
      const phi = Math.acos(1 - (2 * (idx + 0.5)) / Math.max(count, 1));
      const theta = Math.PI * (1 + Math.sqrt(5)) * idx;
      const radius = 0.9 + (idx % 3) * 0.22;

      const offset = new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta) * 0.8,
        radius * Math.cos(phi)
      );

      const pos = center.clone().add(offset);
      const nodeData: SkillNodeData = {
        skill,
        category: cat,
        position: pos,
      };

      nodes.push(nodeData);
      nodeMap.set(skill.id, nodeData);
    });
  });

  // 2. Compute connections
  const connections: ConnectionLine[] = [];
  const lineSet = new Set<string>();

  // A. Intra-cluster connections (connect successive skills in the same category)
  categories.forEach((cat) => {
    const catSkills = cat.skills;
    for (let i = 0; i < catSkills.length; i++) {
      const s1 = catSkills[i];
      const s2 = catSkills[(i + 1) % catSkills.length];
      const pairKey = [s1.id, s2.id].sort().join('--');
      if (!lineSet.has(pairKey)) {
        lineSet.add(pairKey);
        const node1 = nodeMap.get(s1.id);
        const node2 = nodeMap.get(s2.id);
        if (node1 && node2) {
          connections.push({
            id: pairKey,
            sourceId: s1.id,
            targetId: s2.id,
            sourcePos: node1.position,
            targetPos: node2.position,
            color: cat.color,
            isRelated: false,
          });
        }
      }
    }
  });

  // B. Cross-cluster connections based on skill.related
  categories.forEach((cat) => {
    cat.skills.forEach((skill) => {
      if (skill.related) {
        skill.related.forEach((relId) => {
          const pairKey = [skill.id, relId].sort().join('--');
          if (!lineSet.has(pairKey)) {
            lineSet.add(pairKey);
            const node1 = nodeMap.get(skill.id);
            const node2 = nodeMap.get(relId);
            if (node1 && node2) {
              connections.push({
                id: pairKey,
                sourceId: skill.id,
                targetId: relId,
                sourcePos: node1.position,
                targetPos: node2.position,
                color: '#C5FF55', // Acid green for cross-discipline relations
                isRelated: true,
              });
            }
          }
        });
      }
    });
  });

  return { nodes, categoryClusters, connections, nodeMap };
}
