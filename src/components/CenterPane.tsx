import { useMemo } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    type Node,
    type Edge,
    BackgroundVariant,
    Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useGitStore } from '../store/useGitStore';

// Custom commit node component
function CommitNode({ data }: { data: Record<string, unknown> }) {
    const isHead = data.isHead as boolean;
    const branchLabel = data.branchLabel as string | undefined;

    return (
        <div className="relative flex items-center gap-2">
            {/* Branch label */}
            {branchLabel && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {branchLabel}
                    </span>
                </div>
            )}

            {/* Commit circle */}
            <div
                className={`
          w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-mono font-bold
          transition-all duration-300
          ${isHead
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 animate-pulse-glow'
                        : 'bg-slate-700 text-slate-300 border border-slate-600 hover:border-indigo-500/50'
                    }
        `}
            >
                {(data.hash as string).slice(0, 4)}
            </div>

            {/* Commit message */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="text-[10px] text-slate-500 max-w-[100px] truncate block text-center">
                    {data.message as string}
                </span>
            </div>
        </div>
    );
}

const nodeTypes = { commit: CommitNode };

export default function CenterPane() {
    const { commits, branches, HEAD } = useGitStore();

    // Build nodes and edges from commits
    const { nodes, edges } = useMemo(() => {
        const commitNodes: Node[] = [];
        const commitEdges: Edge[] = [];

        // Create a map of branch tips for labeling
        const branchTips: Record<string, string[]> = {};
        Object.entries(branches).forEach(([branchName, hash]) => {
            if (!branchTips[hash]) branchTips[hash] = [];
            branchTips[hash].push(branchName);
        });

        commits.forEach((commit, index) => {
            const branchLabels = branchTips[commit.hash];

            commitNodes.push({
                id: commit.hash,
                type: 'commit',
                position: { x: index * 140 + 60, y: 200 },
                data: {
                    hash: commit.hash,
                    message: commit.message,
                    isHead: commit.hash === HEAD,
                    branchLabel: branchLabels ? branchLabels.join(', ') : undefined,
                },
                sourcePosition: Position.Right,
                targetPosition: Position.Left,
            });

            // Edges from parent to this commit
            commit.parentHashes.forEach((parentHash) => {
                commitEdges.push({
                    id: `${parentHash}-${commit.hash}`,
                    source: parentHash,
                    target: commit.hash,
                    animated: true,
                    style: {
                        stroke: '#6366f1',
                        strokeWidth: 2,
                    },
                });
            });
        });

        return { nodes: commitNodes, edges: commitEdges };
    }, [commits, branches, HEAD]);

    return (
        <div className="h-full flex flex-col bg-[#0f1623]">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-800/60 bg-[#0d1117]/80 backdrop-blur-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Commit Graph
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded ml-1">
                        DAG
                    </span>
                </div>
                <span className="text-[10px] text-slate-600">
                    {commits.length} commit{commits.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* React Flow Canvas */}
            <div className="flex-1">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.4 }}
                    proOptions={{ hideAttribution: true }}
                    minZoom={0.3}
                    maxZoom={2}
                    nodesDraggable={false}
                    nodesConnectable={false}
                >
                    <Background variant={BackgroundVariant.Dots} color="#1e293b" gap={20} size={1} />
                    <Controls
                        showInteractive={false}
                        className="!bg-slate-800/80 !border-slate-700 !rounded-lg !shadow-xl"
                    />
                </ReactFlow>
            </div>
        </div>
    );
}
