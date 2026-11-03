import React, { useEffect, useRef, useState } from 'react';
import * as $3Dmol from '3dmol';
import SmilesDrawer from 'smiles-drawer';
import { 
  RotateCw, 
  Maximize2, 
  Sun, 
  Moon, 
  Sparkles, 
  Info,
  AlertCircle
} from 'lucide-react';

interface MolecularVisualizerProps {
  // Mode: 'macromolecule' (AlphaFold / PDB CIF) or 'small_molecule' (PubChem SDF / SMILES)
  mode: 'macromolecule' | 'small_molecule';
  // Data sources
  cifData?: string | null;
  sdfData?: string | null;
  smiles?: string | null;
  title?: string;
  sourceType?: 'AlphaFold DB' | 'RCSB PDB' | 'PubChem 3D Conformer' | '2D Structure';
  plddtAvailable?: boolean;
}

export const MolecularVisualizer: React.FC<MolecularVisualizerProps> = ({
  mode,
  cifData,
  sdfData,
  smiles,
  title = "Molecular Structure",
  sourceType = "AlphaFold DB",
  plddtAvailable = false
}) => {
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerInstanceRef = useRef<any>(null);

  const [activeRenderStyle, setActiveRenderStyle] = useState<'cartoon' | 'stick' | 'sphere' | 'surface'>('cartoon');
  const [isSpinning, setIsSpinning] = useState<boolean>(true);
  const [darkBackground, setDarkBackground] = useState<boolean>(true);
  const [hasError, setHasError] = useState<string | null>(null);
  const [viewMode2D, setViewMode2D] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Initialize and update 3Dmol viewer
  useEffect(() => {
    if (viewMode2D || !viewerContainerRef.current) return;

    setLoading(true);
    setHasError(null);

    try {
      // Create or re-create viewer instance
      const container = viewerContainerRef.current;
      container.innerHTML = ''; // Clear container

      const createViewerFn = ($3Dmol as any).createViewer || ($3Dmol as any).default?.createViewer;
      if (typeof createViewerFn !== 'function') {
        throw new Error("3Dmol WebGL library failed to initialize");
      }

      const bgColor = darkBackground ? '#0b1329' : '#f8fafc';
      const viewer = createViewerFn(container, {
        backgroundColor: bgColor,
        defaultcolors: ($3Dmol as any).rasmolElementColors || ($3Dmol as any).default?.rasmolElementColors
      });

      viewerInstanceRef.current = viewer;

      if (mode === 'macromolecule' && cifData) {
        viewer.addModel(cifData, 'cif');
        applyMacromoleculeStyle(viewer, activeRenderStyle, plddtAvailable);
        viewer.zoomTo();
        if (isSpinning) {
          viewer.spin('y', 0.8);
        }
        viewer.render();
      } else if (mode === 'small_molecule' && sdfData) {
        viewer.addModel(sdfData, 'sdf');
        applySmallMoleculeStyle(viewer, activeRenderStyle);
        viewer.zoomTo();
        if (isSpinning) {
          viewer.spin('y', 0.8);
        }
        viewer.render();
      } else {
        // Fallback: If 3D data is not available yet, switch to 2D view if SMILES exists
        if (smiles) {
          setViewMode2D(true);
        } else {
          setHasError("3D coordinate data currently unavailable for this compound.");
        }
      }
    } catch (err: any) {
      console.error("Error creating 3Dmol viewer:", err);
      setHasError(err.message || "Failed to render 3D WebGL model.");
    } finally {
      setLoading(false);
    }

    return () => {
      if (viewerInstanceRef.current) {
        try {
          viewerInstanceRef.current.spin(false);
        } catch {
          // ignore
        }
      }
    };
  }, [cifData, sdfData, mode, darkBackground, viewMode2D]);

  // Handle render style changes
  useEffect(() => {
    const viewer = viewerInstanceRef.current;
    if (!viewer || viewMode2D) return;

    try {
      if (mode === 'macromolecule') {
        applyMacromoleculeStyle(viewer, activeRenderStyle, plddtAvailable);
      } else {
        applySmallMoleculeStyle(viewer, activeRenderStyle);
      }
      viewer.render();
    } catch (err) {
      console.warn("Style update warning:", err);
    }
  }, [activeRenderStyle, plddtAvailable, mode, viewMode2D]);

  // Handle spin state toggle
  useEffect(() => {
    const viewer = viewerInstanceRef.current;
    if (!viewer || viewMode2D) return;

    try {
      if (isSpinning) {
        viewer.spin('y', 0.8);
      } else {
        viewer.spin(false);
      }
    } catch (err) {
      console.warn("Spin update warning:", err);
    }
  }, [isSpinning, viewMode2D]);

  // 2D SMILES rendering using SmilesDrawer
  useEffect(() => {
    if (!viewMode2D || !canvasRef.current || !smiles) return;

    try {
      const canvas = canvasRef.current;
      const DrawerClass = SmilesDrawer.Drawer || (SmilesDrawer as any).default?.Drawer || SmilesDrawer;
      const parseFn = SmilesDrawer.parse || (SmilesDrawer as any).default?.parse;

      const themeOptions = {
        width: 440,
        height: 320,
        bondThickness: 2.0,
        bondLength: 20,
        themes: {
          dark: {
            C: '#f1f5f9',
            O: '#ef4444',
            N: '#3b82f6',
            S: '#eab308',
            P: '#f97316',
            Cl: '#22c55e',
            F: '#10b981',
            Br: '#a855f7',
            Na: '#a855f7',
            BACKGROUND: 'transparent'
          },
          light: {
            C: '#0f172a',
            O: '#dc2626',
            N: '#2563eb',
            S: '#ca8a04',
            P: '#ea580c',
            Cl: '#16a34a',
            F: '#059669',
            Br: '#9333ea',
            Na: '#9333ea',
            BACKGROUND: 'transparent'
          }
        }
      };

      const drawer = new DrawerClass(themeOptions);
      parseFn(
        smiles,
        (tree: any) => {
          drawer.draw(tree, canvas, darkBackground ? 'dark' : 'light', false);
        },
        (err: any) => {
          console.warn("SmilesDrawer parse error:", err);
        }
      );
    } catch (e) {
      console.warn("SmilesDrawer render failed:", e);
    }
  }, [viewMode2D, smiles, darkBackground]);

  // Helpers for 3Dmol styling
  function applyMacromoleculeStyle(viewer: any, style: string, useAlphaFoldPlddt: boolean) {
    viewer.setStyle({}, {}); // Clear style

    if (style === 'cartoon') {
      if (useAlphaFoldPlddt) {
        // Canonical AlphaFold pLDDT 4-tier coloring
        const colorFunc = (atom: any) => {
          const b = atom.b;
          if (b > 90) return '#0053D6'; // Very high (>90) Dark Blue
          if (b > 70) return '#65CBF3'; // Confident (70-90) Light Blue
          if (b > 50) return '#FFDB13'; // Low (50-70) Yellow
          return '#FF7D45';             // Very low (<50) Orange
        };
        viewer.setStyle({}, { cartoon: { colorfunc: colorFunc } });
      } else {
        viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
      }
    } else if (style === 'stick') {
      viewer.setStyle({}, { stick: { colorscheme: 'Jmol', radius: 0.22 } });
    } else if (style === 'sphere') {
      viewer.setStyle({}, { sphere: { scale: 0.35, colorscheme: 'Jmol' } });
    } else if (style === 'surface') {
      viewer.setStyle({}, { cartoon: { color: 'spectrum', opacity: 0.6 } });
      try {
        viewer.addSurface((($3Dmol as any).SurfaceType?.VDW ?? 1), { opacity: 0.7, color: 'white' });
      } catch {
        // surface optional
      }
    }

    // Highlight heteroatoms (ions, cofactors)
    viewer.setStyle({ hetflag: true, resn: ['HOH', 'WAT'], invert: true }, {
      stick: { radius: 0.3, colorscheme: 'Jmol' },
      sphere: { scale: 0.45, colorscheme: 'Jmol' }
    });
  }

  function applySmallMoleculeStyle(viewer: any, style: string) {
    viewer.setStyle({}, {});
    if (style === 'stick' || style === 'cartoon') {
      viewer.setStyle({}, {
        stick: { radius: 0.22, colorscheme: 'Jmol' },
        sphere: { scale: 0.3, colorscheme: 'Jmol' }
      });
    } else if (style === 'sphere') {
      viewer.setStyle({}, { sphere: { scale: 0.8, colorscheme: 'Jmol' } });
    } else if (style === 'surface') {
      viewer.setStyle({}, { stick: { radius: 0.2, colorscheme: 'Jmol' } });
      try {
        viewer.addSurface((($3Dmol as any).SurfaceType?.VDW ?? 1), { opacity: 0.6, colorscheme: 'Jmol' });
      } catch {
        // surface optional
      }
    }
  }

  const handleResetCamera = () => {
    if (viewerInstanceRef.current) {
      viewerInstanceRef.current.zoomTo();
      viewerInstanceRef.current.render();
    }
  };

  return (
    <div className={`relative flex flex-col rounded-2xl border transition-all overflow-hidden ${
      darkBackground ? 'bg-[#0a0f1d] border-slate-800' : 'bg-white border-slate-200'
    }`}>
      {/* Top Controls Bar */}
      <div className={`flex items-center justify-between px-3.5 py-2.5 border-b select-none text-xs ${
        darkBackground ? 'bg-[#0f172a]/90 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
      }`}>
        <div className="flex items-center gap-2">
          <span className="font-bold flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-[320px]">
            <Sparkles size={14} className="text-cyan-400 shrink-0" />
            <span className="truncate">{title}</span>
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 whitespace-nowrap">
            {sourceType}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* 2D / 3D Toggle */}
          {smiles && (
            <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60">
              <button
                type="button"
                onClick={() => setViewMode2D(false)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  !viewMode2D ? 'bg-cyan-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                3D WebGL
              </button>
              <button
                type="button"
                onClick={() => setViewMode2D(true)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  viewMode2D ? 'bg-cyan-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                2D Canvas
              </button>
            </div>
          )}

          {/* Background Theme Toggle */}
          <button
            type="button"
            onClick={() => setDarkBackground(!darkBackground)}
            title="Toggle Viewport Contrast"
            className="p-1.5 rounded-lg border border-slate-700/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            {darkBackground ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="relative w-full h-[360px] sm:h-[420px] flex items-center justify-center overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-xs">
            <RotateCw size={24} className="text-cyan-400 animate-spin mb-2" />
            <span className="text-xs text-slate-300 font-mono">Rendering Macromolecular Coordinates...</span>
          </div>
        )}

        {hasError && !viewMode2D && (
          <div className="p-4 text-center max-w-md">
            <AlertCircle size={32} className="mx-auto mb-2 text-amber-400" />
            <p className="text-xs text-slate-300 font-medium mb-2">{hasError}</p>
            {smiles && (
              <button
                type="button"
                onClick={() => setViewMode2D(true)}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all"
              >
                Switch to 2D SMILES Structure
              </button>
            )}
          </div>
        )}

        {/* 3D WebGL Container */}
        <div
          ref={viewerContainerRef}
          className={`w-full h-full cursor-grab active:cursor-grabbing ${
            viewMode2D || hasError ? 'hidden' : 'block'
          }`}
          style={{ width: '100%', height: '100%' }}
        />

        {/* 2D Canvas Container */}
        {viewMode2D && (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
            {smiles && (
              <div className="mt-3 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-cyan-300 max-w-full truncate text-center select-all">
                {smiles}
              </div>
            )}
          </div>
        )}

        {/* 3D Overlay Controls */}
        {!viewMode2D && !hasError && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            {/* Style Selector */}
            <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 pointer-events-auto shadow-lg text-[10px]">
              {(mode === 'macromolecule' 
                ? (['cartoon', 'stick', 'sphere', 'surface'] as const)
                : (['stick', 'sphere', 'surface'] as const)
              ).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setActiveRenderStyle(style)}
                  className={`px-2 py-1 rounded-lg font-bold capitalize transition-all ${
                    activeRenderStyle === style
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>

            {/* Interaction Buttons */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 pointer-events-auto shadow-lg">
              <button
                type="button"
                onClick={() => setIsSpinning(!isSpinning)}
                title={isSpinning ? "Pause Auto-Rotation" : "Start Auto-Rotation"}
                className={`p-1.5 rounded-lg transition-all ${
                  isSpinning ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-white'
                }`}
              >
                <RotateCw size={13} className={isSpinning ? 'animate-spin' : ''} />
              </button>
              <button
                type="button"
                onClick={handleResetCamera}
                title="Reset Camera & Recenter"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <Maximize2 size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AlphaFold Canonical pLDDT 4-Tier Legend */}
      {mode === 'macromolecule' && plddtAvailable && !viewMode2D && (
        <div className={`px-3.5 py-2 border-t flex flex-wrap items-center justify-between gap-2 text-[10px] select-none ${
          darkBackground ? 'bg-[#0f172a] border-slate-800/80 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <span className="font-semibold flex items-center gap-1 text-slate-300">
            <Info size={12} className="text-cyan-400" /> AlphaFold pLDDT Confidence:
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0053D6]" />
              <span className="font-mono font-medium">Very High (&gt;90)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#65CBF3]" />
              <span className="font-mono font-medium">Confident (70-90)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#FFDB13]" />
              <span className="font-mono font-medium">Low (50-70)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#FF7D45]" />
              <span className="font-mono font-medium">Very Low (&lt;50)</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
