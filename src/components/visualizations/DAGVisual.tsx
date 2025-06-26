import React, { useRef, useState } from 'react';
import { DAGData } from '../../types';
import { VisualCard } from './VisualCard';
import { GitBranch, Info } from 'lucide-react';

// Example group and explanation definitions (customize as needed)
const NODE_GROUPS: Record<string, string[]> = {
  Input: ['deviation', 'speed', 'timing'],
  Output: ['intent'],
  Communication: ['communication'],
  Geography: ['geography']
};
const NODE_EXPLANATIONS: Record<string, string> = {
  deviation: 'Deviation from planned course indicates abnormal behavior.',
  speed: 'Increase in speed may signal urgency or intent.',
  timing: 'Timing analysis correlates events with known patterns.',
  intent: 'Intent assessment is the final inference node.',
  communication: 'Loss of communication may indicate jamming or intent.',
  geography: 'Geographic approach vector with tactical significance.'
  // Add as needed
};

// Utility: Approximate text width in px for a given label and font settings
function measureTextWidth(text: string, font = '500 14px Inter, sans-serif') {
  if (typeof window === "undefined") return 80 + text.length * 8;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return 80 + text.length * 8;
  ctx.font = font;
  return ctx.measureText(text).width;
}

interface DAGVisualProps {
  dagData?: DAGData;
  onVisualizationHover?: (elementId: string, visualizationType: string) => () => void;
  onVisualizationClick?: (elementId: string, visualizationType: string) => void;
}

export const DAGVisual: React.FC<DAGVisualProps> = ({
  dagData,
  onVisualizationHover,
  onVisualizationClick
}) => {
  const cleanupFunctions = useRef<Record<string, (() => void) | null>>({});
  const [tooltipNode, setTooltipNode] = useState<string | null>(null);

  if (!dagData || !dagData.nodes || !dagData.edges) return null;

  // Calculate node widths based on label, add icon space and padding
  const nodeWidths = dagData.nodes.map(node =>
    Math.ceil(measureTextWidth(node.label) + 24 + 40) // icon + padding
  );
  const nodeHeight = 48;
  const gap = 32; // horizontal gap between nodes
  const totalWidth = nodeWidths.reduce((a, b) => a + b, 0) + gap * (dagData.nodes.length - 1);
  const canvasWidth = Math.max(520, totalWidth + 32);
  const canvasHeight = 180;

  // Calculate x/y positions for each node to avoid overlap
  let x = 16;
  const nodePositions: Record<string, { x: number, y: number, width: number }> = {};
  dagData.nodes.forEach((node, i) => {
    nodePositions[node.id] = { x: x + nodeWidths[i] / 2, y: canvasHeight / 2, width: nodeWidths[i] };
    x += nodeWidths[i] + gap;
  });

  // Helper: find group for a node
  const getNodeGroup = (nodeId: string) =>
    Object.entries(NODE_GROUPS).find(([, ids]) => ids.includes(nodeId))?.[0];

  const handleMouseEnterNode = (nodeId: string) => {
    setTooltipNode(nodeId);
    const cleanup = onVisualizationHover?.(nodeId, 'dag_node');
    if (cleanup) cleanupFunctions.current[nodeId] = cleanup;
  };

  const handleMouseLeaveNode = (nodeId: string) => {
    setTooltipNode(null);
    const cleanup = cleanupFunctions.current[nodeId];
    if (cleanup) {
      cleanup();
      cleanupFunctions.current[nodeId] = null;
    }
  };

  const handleNodeClick = (nodeId: string) => {
    onVisualizationClick?.(nodeId, 'dag_node');
  };

  // Group header rendering (above first node of each group)
  const groupHeaders: { [nodeIndex: number]: string } = {};
  Object.entries(NODE_GROUPS).forEach(([group, ids]) => {
    const idx = dagData.nodes.findIndex(n => ids.includes(n.id));
    if (idx !== -1) groupHeaders[idx] = group;
  });

  return (
    <VisualCard>
      <div className="flex items-center mb-6">
        <GitBranch className="w-6 h-6 text-yellow-400 mr-3" />
        <h3 className="text-lg font-semibold text-yellow-300">
          Causal Decision Graph
        </h3>
      </div>
      <div className="relative w-full overflow-x-auto" style={{ minHeight: canvasHeight + 24 }}>
        <svg width={canvasWidth} height={canvasHeight} className="block">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#64748b"
                className="transition-colors duration-300"
              />
            </marker>
          </defs>
          {/* Edges */}
          {dagData.edges
            .filter(edge => nodePositions[edge.from] && nodePositions[edge.to])
            .map((edge, i) => {
              const from = nodePositions[edge.from];
              const to = nodePositions[edge.to];
              return (
                <line
                  key={i}
                  x1={from.x}
                  y1={from.y + nodeHeight / 2}
                  x2={to.x}
                  y2={to.y - nodeHeight / 2}
                  stroke="#64748b"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                  className="transition-colors duration-300 hover:stroke-blue-400"
                />
              );
            })}
          {/* Nodes & group headers */}
          {dagData.nodes.map((node, i) => {
            const pos = nodePositions[node.id];
            const group = getNodeGroup(node.id);
            return (
              <g
                key={node.id}
                transform={`translate(${pos.x - pos.width / 2},${pos.y - nodeHeight / 2})`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => handleMouseEnterNode(node.id)}
                onMouseLeave={() => handleMouseLeaveNode(node.id)}
                onClick={() => handleNodeClick(node.id)}
              >
                {groupHeaders[i] && (
                  <text
                    x={pos.width / 2}
                    y={-15}
                    textAnchor="middle"
                    fontSize={11}
                    fill="#a3a3a3"
                    fontWeight={600}
                    opacity={0.8}
                  >
                    {groupHeaders[i]}
                  </text>
                )}
                <rect
                  width={pos.width}
                  height={nodeHeight}
                  rx={14}
                  fill="#334155"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  className="group-hover:stroke-blue-400 transition-all duration-300 shadow-lg"
                />
                <g transform={`translate(20,${nodeHeight / 2})`}>
                  <GitBranch className="w-4 h-4 text-blue-400" style={{ display: "inline", verticalAlign: "middle" }} />
                </g>
                <text
                  x={44}
                  y={nodeHeight / 2 + 6}
                  fill="#fff"
                  fontSize="15"
                  fontWeight={500}
                  fontFamily="Inter, sans-serif"
                  textAnchor="start"
                  alignmentBaseline="middle"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >{node.label}</text>
                {/* Tooltip */}
                {tooltipNode === node.id && (
                  <foreignObject x={pos.width + 8} y={-6} width={180} height={54}>
                    <div className="bg-black bg-opacity-90 text-white text-xs p-2 rounded shadow-lg pointer-events-none" style={{ minWidth: 120 }}>
                      <div className="flex items-center mb-1">
                        <Info className="w-3 h-3 mr-1 text-blue-400" />
                        <span className="font-bold capitalize">{node.label}</span>
                      </div>
                      {NODE_EXPLANATIONS[node.id] || "No explanation available."}
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </VisualCard>
  );
};
