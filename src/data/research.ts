export type ResearchStatus = 'studying' | 'in-progress' | 'completed';

export interface ResearchEntry {
  id: string;
  title: string;
  shortTitle: string;
  authors: string;
  /** Only verified publication details. */
  publication: string;
  reference: { label: string; href: string } | null;
  status: ResearchStatus;
  objective: string;
  problem: string;
  coreIdea: string;
  methodology: string[];
  architecture: string[];
  /** Personal notes. Keep honest — observations, not unverified results. */
  observations: string[];
  /** Optional formula rendered in mono. */
  formula?: string;
}

export const statusMeta: Record<ResearchStatus, { label: string; tone: string; description: string }> = {
  studying: { label: 'Studying', tone: 'text-bone border-bone/40', description: 'Reading the paper and working through the maths.' },
  'in-progress': { label: 'In progress', tone: 'text-acid border-acid/60', description: 'Implementation is being written.' },
  completed: { label: 'Completed', tone: 'text-ink bg-acid border-acid', description: 'Implementation finished and documented.' },
};

export const research: ResearchEntry[] = [
  {
    id: 'resnet',
    title: 'Deep Residual Learning for Image Recognition',
    shortTitle: 'ResNet',
    authors: 'Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun',
    publication: 'CVPR 2016 · arXiv:1512.03385 (2015)',
    reference: { label: 'arXiv:1512.03385', href: 'https://arxiv.org/abs/1512.03385' },
    // EDIT: move to 'in-progress' or 'completed' only when that is true.
    status: 'studying',
    objective:
      'Understand why very deep networks become harder to train and reproduce the residual learning framework that made networks with 100+ layers practical.',
    problem:
      'Stacking more layers should not make a network worse — yet plain deep networks show a degradation problem: training accuracy saturates and then drops as depth increases. This is not caused by overfitting.',
    coreIdea:
      'Instead of asking a stack of layers to learn a mapping H(x) directly, let it learn the residual F(x) = H(x) − x and add the input back through an identity shortcut. If the identity is optimal, pushing F(x) toward zero is easier than learning an identity through non-linear layers.',
    formula: 'y = F(x, {Wᵢ}) + x',
    methodology: [
      'Read the paper end-to-end, then re-derive the residual block formulation.',
      'Rebuild the basic block (two 3×3 convolutions) and the bottleneck block (1×1 → 3×3 → 1×1).',
      'Handle dimension changes with projection shortcuts (1×1 convolution, stride 2).',
      'Compare plain vs residual variants of the same depth.',
    ],
    architecture: [
      '7×7 conv, 64, stride 2 → 3×3 max-pool',
      'Stage conv2_x → conv5_x, channels 64 → 128 → 256 → 512',
      'Batch normalisation after each convolution, ReLU after the addition',
      'Global average pooling → fully connected classifier',
    ],
    observations: [
      'The identity shortcut adds no extra parameters — the elegance is in what it does not add.',
      'Residual connections reshape the optimisation landscape rather than the model capacity.',
      'Notes on implementation results will be added here only once experiments are actually run.',
    ],
  },
];

/** Engineering notebook: concepts, maths and experiments. Editable. */
export interface NotebookNote {
  id: string;
  kind: 'concept' | 'math' | 'architecture' | 'engineering';
  title: string;
  body: string;
  snippet?: string;
}

export const notebook: NotebookNote[] = [
  {
    id: 'grad-flow',
    kind: 'math',
    title: 'Why shortcuts help gradients',
    body: 'With y = F(x) + x, the gradient ∂y/∂x = ∂F/∂x + 1. The constant term gives the gradient a direct path backwards through the network, so it does not vanish across many layers.',
    snippet: '∂L/∂x = ∂L/∂y · (1 + ∂F/∂x)',
  },
  {
    id: 'bottleneck',
    kind: 'architecture',
    title: 'Bottleneck blocks',
    body: 'Deeper ResNets (50/101/152) replace two 3×3 convs with 1×1 → 3×3 → 1×1. The 1×1 layers reduce and then restore channels, keeping computation manageable.',
    snippet: '256-d → 1×1, 64 → 3×3, 64 → 1×1, 256 → (+x)',
  },
  {
    id: 'agents',
    kind: 'concept',
    title: 'Agentic systems',
    body: 'An agent loops: observe → plan → act with tools → observe again. ChainHandler explores applying this loop to supply chain disruptions.',
  },
  {
    id: 'reproduce',
    kind: 'engineering',
    title: 'Reproducing papers',
    body: 'Start from the smallest configuration that exercises the idea. Match the paper\'s data pipeline before blaming the model. Log everything.',
  },
];
