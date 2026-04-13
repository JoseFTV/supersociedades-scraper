'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Maximize2, Minimize2 } from 'lucide-react';

interface GraphNode {
    id: string;
    name: string;
    year?: number;
    role?: string;
    score?: number;
    isExternal?: boolean;
    summary?: string;
    x?: number;
    y?: number;
}

interface GraphLink {
    source: string;
    target: string;
}

interface CitationGraphProps {
    data: {
        nodes: GraphNode[];
        links: GraphLink[];
    };
}

export default function CitationGraph({ data }: CitationGraphProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fgRef = useRef<any>(undefined);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);

    // Auto-resize graph to fit container
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: isFullscreen ? window.innerHeight : 600
                });
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Initial
        return () => window.removeEventListener('resize', handleResize);
    }, [isFullscreen]);

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    // Node coloring and sizing
    const getNodeColor = (node: GraphNode) => {
        if (node.isExternal) return '#94a3b8'; // gray
        if (node.role === 'FUNDADORA') return '#ef4444'; // red
        if (node.role === 'HITO') return '#f59e0b'; // amber
        if (node.role === 'CONFIRMADORA') return '#3b82f6'; // blue
        return '#94a3b8'; // PERIFÉRICA - gray
    };

    const getNodeVal = (node: GraphNode) => {
        if (node.isExternal) return 4;
        return (node.score ?? 0) > 0 ? Math.min((node.score ?? 0) * 2 + 4, 20) : 3;
    };

    const handleNodeClick = useCallback((node: GraphNode) => {
        if (fgRef.current) {
            fgRef.current.centerAt(node.x ?? 0, node.y ?? 0, 1000);
            fgRef.current.zoom(8, 2000);
        }
    }, [fgRef]);

    return (
        <div
            ref={containerRef}
            className={`relative w-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : 'h-[600px]'
                }`}
        >
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button
                    onClick={() => {
                        if (fgRef.current) {
                            fgRef.current.zoomToFit(400);
                        }
                    }}
                    className="bg-white/90 p-2 rounded shadow text-sm font-bold text-slate-700 hover:bg-slate-100"
                >
                    Centrar Grafo
                </button>
                <button
                    onClick={toggleFullscreen}
                    className="bg-white/90 p-2 rounded shadow text-slate-700 hover:bg-slate-100"
                >
                    {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
            </div>

            {hoverNode && (
                <div className="absolute top-4 left-4 z-10 bg-white/95 p-4 rounded-xl shadow-lg border border-slate-200 max-w-sm pointer-events-none">
                    <p className="font-bold text-lexia-black text-sm mb-1">{hoverNode.name}</p>
                    <div className="flex items-center gap-2 mb-2">
                        {!hoverNode.isExternal && <span className="text-xs bg-slate-100 px-2 py-0.5 rounded font-medium">{hoverNode.year}</span>}
                        <span
                            className={`text-xs px-2 py-0.5 rounded-full font-bold
                 ${hoverNode.role === 'FUNDADORA' ? 'bg-red-100 text-red-700' :
                                    hoverNode.role === 'HITO' ? 'bg-amber-100 text-amber-700' :
                                        hoverNode.role === 'CONFIRMADORA' ? 'bg-blue-100 text-blue-700' :
                                            'bg-slate-200 text-slate-700'}`}
                        >
                            {hoverNode.role}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">Citas: {hoverNode.score}</span>
                    </div>
                    {hoverNode.summary && (
                        <p className="text-xs text-slate-600 line-clamp-4 leading-relaxed border-t pt-2 border-slate-100">
                            {hoverNode.summary}
                        </p>
                    )}
                </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 z-10 bg-white/90 p-3 rounded shadow text-xs pointer-events-none flex gap-4">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div>Fundadora</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div>Hito</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div>Confirmadora</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-400"></div>Periférica / Externa</div>
            </div>

            <ForceGraph2D
                ref={fgRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={data}
                nodeLabel="" // We use custom hover overlay above
                nodeColor={getNodeColor}
                nodeVal={getNodeVal}
                onNodeHover={(node) => setHoverNode(node)}
                onNodeClick={handleNodeClick}
                linkColor={() => 'rgba(148, 163, 184, 0.4)'}
                linkWidth={1.5}
                linkDirectionalArrowLength={3.5}
                linkDirectionalArrowRelPos={1}
                cooldownTicks={100}
                d3VelocityDecay={0.3}
            />
        </div>
    );
}
