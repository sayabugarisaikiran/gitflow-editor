import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';

// ─── Dagre Layout Helper ─────────────────────────────────────────────────────
// Calculates optimal node positions for the commit DAG using Dagre.
// Graph flows Left → Right (rankdir: 'LR') to represent the time axis.

interface LayoutOptions {
    direction?: 'LR' | 'TB';
    nodeWidth?: number;
    nodeHeight?: number;
    rankSep?: number;
    nodeSep?: number;
}

export function getLayoutedElements(
    nodes: Node[],
    edges: Edge[],
    options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } {
    const {
        direction = 'LR',
        nodeWidth = 180,
        nodeHeight = 80,
        rankSep = 80,
        nodeSep = 50,
    } = options;

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
        rankdir: direction,
        ranksep: rankSep,
        nodesep: nodeSep,
        marginx: 40,
        marginy: 40,
    });

    // Add nodes to dagre
    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, {
            width: nodeWidth,
            height: nodeHeight,
        });
    });

    // Add edges to dagre
    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    // Run the layout
    dagre.layout(dagreGraph);

    // Map positions back to React Flow nodes
    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);

        return {
            ...node,
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
}
