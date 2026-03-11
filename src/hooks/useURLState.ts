import { useEffect } from 'react';
import { useGitStore } from '../store/useGitStore';

// ─── Serialization Helpers ───────────────────────────────────────────────────

interface ShareableState {
    commits: {
        hash: string;
        message: string;
        parentHashes: string[];
        timestamp: number;
        branch: string;
    }[];
    branches: Record<string, string>;
    tags: Record<string, string>;
    HEAD: string;
    currentBranch: string;
    files: { name: string; status: string }[];
}

function encodeState(state: ShareableState): string {
    const json = JSON.stringify(state);
    // Use encodeURIComponent + btoa for URL-safe base64
    return btoa(encodeURIComponent(json));
}

function decodeState(encoded: string): ShareableState | null {
    try {
        const json = decodeURIComponent(atob(encoded));
        return JSON.parse(json) as ShareableState;
    } catch {
        console.warn('Failed to decode scenario from URL hash');
        return null;
    }
}

// ─── URL State Hook ──────────────────────────────────────────────────────────

export function useURLState() {
    // Load state from URL on mount
    useEffect(() => {
        loadStateFromURL();
    }, []);

    return {
        exportStateToURL,
        clearURLState,
    };
}

// ─── Exported Functions ──────────────────────────────────────────────────────

export function exportStateToURL(): string {
    const state = useGitStore.getState();

    const shareable: ShareableState = {
        commits: state.commits.map((c) => ({
            hash: c.hash,
            message: c.message,
            parentHashes: c.parentHashes,
            timestamp: c.timestamp,
            branch: c.branch,
        })),
        branches: { ...state.branches },
        tags: { ...state.tags },
        HEAD: state.HEAD,
        currentBranch: state.currentBranch,
        files: state.files.map((f) => ({
            name: f.name,
            status: f.status,
        })),
    };

    const encoded = encodeState(shareable);
    const url = `${window.location.origin}${window.location.pathname}#scenario=${encoded}`;
    window.history.replaceState(null, '', url);
    return url;
}

export function loadStateFromURL(): boolean {
    const hash = window.location.hash;
    if (!hash.startsWith('#scenario=')) return false;

    const encoded = hash.slice('#scenario='.length);
    const state = decodeState(encoded);
    if (!state) return false;

    // Load into git store
    useGitStore.getState().loadScenario({
        id: 'shared-scenario',
        name: 'Shared Scenario',
        commits: state.commits,
        branches: state.branches,
        tags: state.tags,
        HEAD: state.HEAD,
        currentBranch: state.currentBranch,
        files: state.files.map((f) => ({
            name: f.name,
            status: f.status as 'unmodified' | 'modified' | 'staged',
        })),
    });

    return true;
}

export function clearURLState(): void {
    window.history.replaceState(null, '', window.location.pathname);
}
