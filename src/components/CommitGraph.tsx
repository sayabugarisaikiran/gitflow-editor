import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    type Edge,
    type Node,
    BackgroundVariant,
    MarkerType,
    useReactFlow,
    ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useGitStore } from '../store/useGitStore';
import { getLayoutedElements } from '../utils/layout-helper';
import CustomCommitNode, { type CommitNodeData } from './CustomCommitNode';
import NodeContextMenu, { type ContextMenuState } from './NodeContextMenu';

// ─── Node types registry ────────────────────────────────────────────────────

const nodeTypes = { commit: CustomCommitNode };

// ─── Edge style presets ─────────────────────────────────────────────────────

const EDGE_STYLES = {
    normal: {
        stroke: '#6366f1',
        strokeWidth: 2,
    },
    merge: {
        stroke: '#c084fc',
        strokeWidth: 2,
        strokeDasharray: '6 3',
    },
};

// ─── Inner Graph Component (needs ReactFlowProvider) ────────────────────────

function CommitGraphInner() {
    const { commits, branches, tags, HEAD, currentBranch, checkout, selectCommit } = useGitStore();
    const { fitView } = useReactFlow();
    const prevCommitCountRef = useRef(commits.length);
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

    // Build React Flow nodes + edges from Zustand state
    const { nodes, edges } = useMemo(() => {
        const branchTips: Record<string, string[]> = {};
        
        // Add local branches
        Object.entries(branches).forEach(([branchName, hash]) => {
            if (!branchTips[hash]) branchTips[hash] = [];
            branchTips[hash].push(branchName);
        });

        // Add remote branches
        Object.entries(useGitStore.getState().remoteBranches).forEach(([remoteName, hash]) => {
            if (!branchTips[hash]) branchTips[hash] = [];
            branchTips[hash].push(remoteName);
        });

        // ── Build tag lookup ──
        const tagTips: Record<string, string[]> = {};
        Object.entries(tags).forEach(([tagName, hash]) => {
            if (!tagTips[hash]) tagTips[hash] = [];
            tagTips[hash].push(tagName);
        });

        // ── Create nodes ──
        const rawNodes: Node[] = commits.map((commit) => ({
            id: commit.hash,
            type: 'commit',
            position: { x: 0, y: 0 }, // Will be calculated by dagre
            data: {
                hash: commit.hash,
                message: commit.message,
                isHead: commit.hash === HEAD,
                branches: branchTips[commit.hash] || [],
                tags: tagTips[commit.hash] || [],
                timestamp: commit.timestamp,
                isMerge: commit.parentHashes.length > 1,
            } satisfies CommitNodeData,
        }));

        // ── Create edges ──
        const rawEdges: Edge[] = [];
        commits.forEach((commit) => {
            commit.parentHashes.forEach((parentHash, idx) => {
                const isMergeEdge = idx > 0; // Second+ parent = merge edge
                rawEdges.push({
                    id: `e-${parentHash}-${commit.hash}-${idx}`,
                    source: parentHash,
                    target: commit.hash,
                    type: 'smoothstep',
                    animated: commit.hash === HEAD, // Animate edges leading to HEAD
                    style: isMergeEdge ? EDGE_STYLES.merge : EDGE_STYLES.normal,
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 12,
                        height: 12,
                        color: isMergeEdge ? '#c084fc' : '#6366f1',
                    },
                });
            });
        });

        // ── Run dagre layout (left-to-right) ──
        return getLayoutedElements(rawNodes, rawEdges, {
            direction: 'LR',
            nodeWidth: 180,
            nodeHeight: 100,
            rankSep: 80,
            nodeSep: 60,
        });
    }, [commits, branches, HEAD]);

    // Auto-fit when commits change
    useEffect(() => {
        if (commits.length !== prevCommitCountRef.current) {
            prevCommitCountRef.current = commits.length;
            // Small delay so React Flow has time to update nodes
            const timer = setTimeout(() => {
                fitView({ padding: 0.3, duration: 400 });
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [commits.length, fitView]);

    // Also re-fit when branches change (e.g., after creating/deleting a branch the labels change)
    const branchCount = Object.keys(branches).length;
    useEffect(() => {
        const timer = setTimeout(() => {
            fitView({ padding: 0.3, duration: 300 });
        }, 50);
        return () => clearTimeout(timer);
    }, [branchCount, fitView]);

    // Handle checkout on click
    const onNodeClick = useCallback(
        (_: React.MouseEvent, node: Node) => {
            const data = node.data as unknown as CommitNodeData;

            // If the node has branch labels, checkout the first branch
            if (data.branches.length > 0) {
                const targetBranch = data.branches[0];
                if (targetBranch !== currentBranch) {
                    checkout(targetBranch);
                }
            } else {
                // Otherwise, detached HEAD checkout to the hash
                if (data.hash !== HEAD) {
                    checkout(data.hash);
                }
            }
        },
        [checkout, currentBranch, HEAD]
    );

    // Handle double-click → open Commit Inspector
    const onNodeDoubleClick = useCallback(
        (_: React.MouseEvent, node: Node) => {
            const data = node.data as unknown as CommitNodeData;
            selectCommit(data.hash);
        },
        [selectCommit]
    );

    // Handle right-click on node → show context menu
    const onNodeContextMenu = useCallback(
        (event: React.MouseEvent, node: Node) => {
            event.preventDefault();
            event.stopPropagation();

            const data = node.data as unknown as CommitNodeData;

            // Position menu at mouse, clamping to viewport
            const x = Math.min(event.clientX, window.innerWidth - 250);
            const y = Math.min(event.clientY, window.innerHeight - 300);

            setContextMenu({
                x,
                y,
                commitHash: data.hash,
                commitMessage: data.message,
                branches: data.branches,
                isHead: data.isHead,
            });
        },
        []
    );

    // Close context menu on pane interaction
    const onPaneClick = useCallback(() => {
        setContextMenu(null);
    }, []);

    const onMoveStart = useCallback(() => {
        setContextMenu(null);
    }, []);

    return (
        <div className="h-full flex flex-col bg-[#0f1623]">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-800/60 bg-[#0d1117]/80 backdrop-blur-sm flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Commit Graph
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded ml-1">
                        DAG
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {/* Legend */}
                    <div className="flex items-center gap-3 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 inline-block" />
                            HEAD
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 border border-slate-500/40 inline-block" />
                            Commit
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 inline-block" />
                            Merge
                        </span>
                    </div>
                    <span className="text-[10px] text-slate-600">
                        {commits.length} commit{commits.length !== 1 ? 's' : ''} • Right-click for options
                    </span>
                </div>
            </div>

            {/* React Flow Canvas */}
            <div className="flex-1">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodeClick={onNodeClick}
                    onNodeDoubleClick={onNodeDoubleClick}
                    onNodeContextMenu={onNodeContextMenu}
                    onPaneClick={onPaneClick}
                    onMoveStart={onMoveStart}
                    fitView
                    fitViewOptions={{ padding: 0.3 }}
                    proOptions={{ hideAttribution: true }}
                    minZoom={0.2}
                    maxZoom={3}
                    nodesDraggable={true}
                    nodesConnectable={false}
                    elementsSelectable={true}
                    panOnScroll={true}
                    zoomOnScroll={true}
                    defaultEdgeOptions={{
                        type: 'smoothstep',
                    }}
                >
                    <Background
                        variant={BackgroundVariant.Dots}
                        color="#1e293b"
                        gap={20}
                        size={1}
                    />
                    <Controls
                        showInteractive={false}
                        className="!bg-slate-800/80 !border-slate-700 !rounded-lg !shadow-xl"
                    />
                </ReactFlow>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <NodeContextMenu
                    menu={contextMenu}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    );
}

// ─── Wrapper with Provider ──────────────────────────────────────────────────

export default function CommitGraph() {
    return (
        <ReactFlowProvider>
            <CommitGraphInner />
        </ReactFlowProvider>
    );
}
