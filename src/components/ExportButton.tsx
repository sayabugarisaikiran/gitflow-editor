import { useCallback, useState } from 'react';
import { useReactFlow, getNodesBounds, getViewportForBounds } from '@xyflow/react';
import { toPng } from 'html-to-image';

export default function ExportButton() {
    const { getNodes } = useReactFlow();
    const [isExporting, setIsExporting] = useState(false);

    const onClick = useCallback(async () => {
        setIsExporting(true);
        // We select the viewport element of React Flow to capture the rendered graph
        const element = document.querySelector('.react-flow__viewport') as HTMLElement;
        if (!element) {
            setIsExporting(false);
            return;
        }

        try {
            const nodesBounds = getNodesBounds(getNodes());
            const imageWidth = nodesBounds.width + 200; // Add padding
            const imageHeight = nodesBounds.height + 200;

            const viewport = getViewportForBounds(
                nodesBounds,
                imageWidth,
                imageHeight,
                0.5,
                2,
                0 // Padding
            );

            const dataUrl = await toPng(element, {
                backgroundColor: '#0f1623', // Match our dark theme background for the graph
                width: imageWidth,
                height: imageHeight,
                style: {
                    width: `${imageWidth}px`,
                    height: `${imageHeight}px`,
                    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                },
            });

            const link = document.createElement('a');
            link.download = 'git-graph.png';
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Failed to export graph:', error);
        } finally {
            setIsExporting(false);
        }
    }, [getNodes]);

    return (
        <button
            onClick={onClick}
            disabled={isExporting}
            className="absolute bottom-4 right-4 z-10 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow-lg shadow-indigo-500/20 transition-all border border-indigo-400/50 flex items-center justify-center cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export Graph to Image"
        >
            {isExporting ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
            )}
        </button>
    );
}
