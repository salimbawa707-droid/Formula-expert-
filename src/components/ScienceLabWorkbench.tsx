import React, { lazy, Suspense, useState, useEffect } from 'react';
import { 
  Atom, 
  FlaskConical, 
  Dna, 
  Search, 
  Sparkles, 
  ShieldAlert, 
  ExternalLink, 
  BookOpen, 
  Activity, 
  Layers, 
  RefreshCw, 
  Copy, 
  Check, 
  Download, 
  Compass, 
  Beaker,
  AlertTriangle
} from 'lucide-react';

import { 
  CURATED_SCIENCE_CATALOG, 
  CuratedChemicalTarget,
  PubChemCompoundProperties,
  PubChemSafetyHazard,
  AlphaFoldModelDescriptor,
  ScientificArticle,
  resolvePubChemCid,
  getPubChemProperties,
  getPubChem3DConformerSDF,
  getPubChemSafetyData,
  getPubChemSimilarCompounds,
  getAlphaFoldPrediction,
  getRcsbStructureCif,
  searchPubMedArticles,
  searchEuropePmcArticles
} from '../services/scienceService';

const MolecularVisualizer = lazy(() => import('./scientific/MolecularVisualizer').then((module) => ({ default: module.MolecularVisualizer })));

interface ScienceLabWorkbenchProps {
  initialChemicalQuery?: string;
}

export const ScienceLabWorkbench: React.FC<ScienceLabWorkbenchProps> = ({
  initialChemicalQuery
}) => {
  // Currently selected item or active search
  const [selectedTarget, setSelectedTarget] = useState<CuratedChemicalTarget>(CURATED_SCIENCE_CATALOG[0]);
  const [searchInput, setSearchInput] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'properties' | 'safety' | 'analogs' | 'literature'>('properties');

  // Resolved dynamic data
  const [compoundProps, setCompoundProps] = useState<PubChemCompoundProperties | null>(null);
  const [sdfData, setSdfData] = useState<string | null>(null);
  const [cifData, setCifData] = useState<string | null>(null);
  const [safetyData, setSafetyData] = useState<PubChemSafetyHazard | null>(null);
  const [alphaFoldModel, setAlphaFoldModel] = useState<AlphaFoldModelDescriptor | null>(null);
  const [similarCids, setSimilarCids] = useState<number[]>([]);
  const [articles, setArticles] = useState<ScientificArticle[]>([]);
  const [copiedSmiles, setCopiedSmiles] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load target details when selectedTarget changes
  useEffect(() => {
    loadTargetDetails(selectedTarget);
  }, [selectedTarget]);

  // Handle external query if provided
  useEffect(() => {
    if (initialChemicalQuery) {
      handleCustomSearch(initialChemicalQuery);
    }
  }, [initialChemicalQuery]);

  const loadTargetDetails = async (target: CuratedChemicalTarget) => {
    setIsSearching(true);
    setErrorMsg(null);
    setCompoundProps(null);
    setSdfData(null);
    setCifData(null);
    setSafetyData(null);
    setAlphaFoldModel(null);
    setSimilarCids([]);
    setArticles([]);

    try {
      // 1. If it's a Protein / Enzyme
      if (target.uniprotId || target.pdbId) {
        if (target.uniprotId) {
          const afPred = await getAlphaFoldPrediction(target.uniprotId);
          if (afPred) {
            setAlphaFoldModel(afPred);
            // Fetch CIF from dynamic URL
            try {
              const res = await fetch(afPred.cifUrl);
              if (res.ok) {
                const text = await res.text();
                setCifData(text);
              }
            } catch (cifErr) {
              console.warn("AlphaFold CIF fetch error:", cifErr);
            }
          }
        } else if (target.pdbId) {
          const cif = await getRcsbStructureCif(target.pdbId);
          setCifData(cif);
        }

        // Fetch literature for the enzyme
        const enzymeQuery = `${target.name} detergent laundry stability`;
        searchPubMedArticles(enzymeQuery, 5).then((docs) => setArticles(docs));
      }

      // 2. If it's a Small Molecule / Surfactant / Chelator
      let cid = target.cid;
      if (!cid && target.name) {
        cid = (await resolvePubChemCid(target.name)) ?? undefined;
      }

      if (cid) {
        // Fetch PubChem properties & 3D conformer SDF
        const [props, sdf, safety, analogs] = await Promise.all([
          getPubChemProperties(cid),
          getPubChem3DConformerSDF(cid),
          getPubChemSafetyData(cid),
          getPubChemSimilarCompounds(cid, 85, 6)
        ]);

        setCompoundProps(props);
        setSdfData(sdf);
        setSafetyData(safety);
        setSimilarCids(analogs);

        // Fetch literature
        const litQuery = `${target.name} detergent surfactant micelle`;
        searchPubMedArticles(litQuery, 5).then((docs) => {
          if (docs.length > 0) {
            setArticles(docs);
          } else {
            searchEuropePmcArticles(`${target.name} cleaning`, 5).then(setArticles);
          }
        });
      }
    } catch (err: any) {
      console.error("Failed to load science target details:", err);
      setErrorMsg("Failed to retrieve complete scientific record. Please verify network connection or try another compound.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleCustomSearch = async (queryText?: string) => {
    const query = (queryText || searchInput).trim();
    if (!query) return;

    setIsSearching(true);
    setErrorMsg(null);

    try {
      // Check if it looks like a UniProt ID (e.g. P00780, P04637, Q9...)
      if (/^[OPQ][0-9][A-Z0-9]{3}[0-9]$/i.test(query)) {
        const afPred = await getAlphaFoldPrediction(query);
        if (afPred) {
          const customTarget: CuratedChemicalTarget = {
            name: afPred.gene || afPred.uniprotDescription || `UniProt ${query}`,
            category: "Enzyme",
            role: afPred.uniprotDescription || "Macromolecular Protein",
            uniprotId: query.toUpperCase(),
            description: `AlphaFold DB predicted model for ${afPred.uniprotDescription || query} (${afPred.organismScientificName || 'Biological Source'}).`
          };
          setSelectedTarget(customTarget);
          return;
        }
      }

      // Otherwise search PubChem by name or CAS or CID
      const cid = await resolvePubChemCid(query);
      if (cid) {
        const props = await getPubChemProperties(cid);
        const customTarget: CuratedChemicalTarget = {
          name: props?.Title || query,
          category: "Surfactant",
          role: "Chemical Raw Material",
          cid,
          smiles: props?.CanonicalSMILES,
          formula: props?.MolecularFormula,
          description: `PubChem CID ${cid}: ${props?.IUPACName || props?.Title || query}`
        };
        setSelectedTarget(customTarget);
      } else {
        setErrorMsg(`No chemical or macromolecule found for "${query}". Try searching with a standard chemical name (e.g., "Sodium dodecyl sulfate") or CAS.`);
      }
    } catch (err: any) {
      setErrorMsg(`Lookup failed: ${err.message || 'Network error'}`);
    } finally {
      setIsSearching(false);
    }
  };

  const copySmilesToClipboard = () => {
    const smiles = compoundProps?.CanonicalSMILES || selectedTarget.smiles;
    if (smiles) {
      navigator.clipboard.writeText(smiles);
      setCopiedSmiles(true);
      setTimeout(() => setCopiedSmiles(false), 2000);
    }
  };

  const isEnzyme = Boolean(selectedTarget.uniprotId || selectedTarget.pdbId);

  return (
    <div className="w-full space-y-5 animate-fade-in text-slate-100">
      
      {/* Workbench Header & Overview */}
      <div className="bg-gradient-to-r from-[#0c142b] via-[#101b38] to-[#0c142b] border border-cyan-500/30 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Atom size={20} className="animate-spin-slow" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Science Lab & Molecular Workbench
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-400/40 uppercase">
                DeepMind Science Skills
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Interactive 3D WebGL macromolecular visualization (3Dmol.js), 2D SMILES rendering (SmilesDrawer), 
              PubChem PUG REST computed properties, GHS safety profiling, AlphaFold DB pLDDT confidence scoring, and live peer-reviewed cleaning chemistry literature.
            </p>
          </div>

          {/* Quick Stats / Provenance Pills */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-700/80 text-cyan-300 flex items-center gap-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              PubChem PUG REST
            </span>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-700/80 text-blue-300 flex items-center gap-1.5 shadow-xs">
              <Dna size={12} className="text-blue-400" />
              AlphaFold DB v6
            </span>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-700/80 text-purple-300 flex items-center gap-1.5 shadow-xs">
              <BookOpen size={12} className="text-purple-400" />
              PubMed & E-Utils
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomSearch()}
              placeholder="Search any chemical name, CAS, PubChem CID (e.g. 24263), SMILES, or UniProt ID (P00780)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none transition-all font-mono"
            />
          </div>
          <button
            type="button"
            onClick={() => handleCustomSearch()}
            disabled={isSearching}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSearching ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>Analyze Compound</span>
          </button>
        </div>

        {/* Error message if any */}
        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Top Quick-Try Example Pill Bar (Mandatory Science Skill Component) */}
      <div className="bg-[#0b1224] border border-slate-800/80 rounded-2xl p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Compass size={14} className="text-cyan-400" /> Curated Detergent Molecules & Enzymes:
          </span>
          <span className="text-[10px] text-slate-500 font-mono">1-Click Authoritative Scientific Records</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {CURATED_SCIENCE_CATALOG.map((catItem) => {
            const isSelected = selectedTarget.name === catItem.name;
            const isTargetEnzyme = catItem.category === 'Enzyme';

            return (
              <button
                key={catItem.name}
                type="button"
                onClick={() => setSelectedTarget(catItem)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border select-none cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400/40'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                {isTargetEnzyme ? (
                  <Dna size={13} className={isSelected ? 'text-cyan-300' : 'text-purple-400'} />
                ) : (
                  <FlaskConical size={13} className={isSelected ? 'text-cyan-300' : 'text-teal-400'} />
                )}
                <span className="truncate max-w-[140px] sm:max-w-none">{catItem.name}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                  isTargetEnzyme ? 'bg-purple-950/80 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-400'
                }`}>
                  {catItem.category.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* DUAL-PANE SCIENTIFIC WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT PANE: Interactive 3D WebGL & 2D Canvas Molecular Visualizer (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Suspense fallback={<div className="min-h-72 rounded-2xl border border-slate-800 bg-slate-950/50 flex items-center justify-center text-sm text-slate-400" role="status">Loading molecular viewer…</div>}>
            <MolecularVisualizer
              mode={isEnzyme ? 'macromolecule' : 'small_molecule'}
              cifData={cifData}
              sdfData={sdfData}
              smiles={compoundProps?.CanonicalSMILES || selectedTarget.smiles}
              title={selectedTarget.name}
              sourceType={
                isEnzyme
                  ? (alphaFoldModel ? 'AlphaFold DB' : 'RCSB PDB')
                  : (sdfData ? 'PubChem 3D Conformer' : '2D Structure')
              }
              plddtAvailable={isEnzyme && Boolean(alphaFoldModel)}
            />
          </Suspense>

          {/* Compound Bio-Description & Chemical Role Card */}
          <div className="bg-[#0b1224] border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-cyan-500/20 text-cyan-400">
                  <Beaker size={15} />
                </span>
                <h3 className="font-bold text-sm text-white">{selectedTarget.name}</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {selectedTarget.role}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              {selectedTarget.description}
            </p>

            {/* InChIKey & SMILES Bar */}
            {(compoundProps?.CanonicalSMILES || selectedTarget.smiles) && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-slate-500 font-bold shrink-0">SMILES:</span>
                  <span className="text-cyan-300 truncate select-all">
                    {compoundProps?.CanonicalSMILES || selectedTarget.smiles}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copySmilesToClipboard}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-all border border-slate-700"
                >
                  {copiedSmiles ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedSmiles ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: Tabbed Scientific Data Inspector (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Inspector Tab Selector */}
          <div className="bg-[#0b1224] border border-slate-800 p-1 rounded-2xl flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('properties')}
              className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'properties'
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity size={13} />
              <span>Properties</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('safety')}
              className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'safety'
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert size={13} />
              <span>GHS Safety</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analogs')}
              className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'analogs'
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers size={13} />
              <span>Analogs</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('literature')}
              className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'literature'
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen size={13} />
              <span>Literature</span>
            </button>
          </div>

          {/* TAB 1: Physicochemical Properties */}
          {activeTab === 'properties' && (
            <div className="bg-[#0b1224] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Activity size={16} className="text-cyan-400" />
                  Computed Molecular Metrics
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                  {isEnzyme ? 'UniProt / AlphaFold' : `PubChem CID ${compoundProps?.CID || selectedTarget.cid || 'N/A'}`}
                </span>
              </div>

              {isEnzyme ? (
                /* Enzyme Specific Metadata */
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Catalytic Domain & Organism</span>
                    <p className="text-xs font-semibold text-slate-200">
                      {alphaFoldModel?.organismScientificName || 'Bacillus species / Microbial Fermentation'}
                    </p>
                    <p className="text-xs text-slate-400">
                      UniProt Accession: <span className="font-mono text-cyan-300">{selectedTarget.uniprotId || 'P00780'}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Residue Span</span>
                      <span className="font-mono font-bold text-white">
                        {alphaFoldModel ? `${alphaFoldModel.uniprotStart} - ${alphaFoldModel.uniprotEnd} aa` : '275 aa'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Optimal pH Window</span>
                      <span className="font-mono font-bold text-emerald-400">8.5 - 10.5 (Alkaline)</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Optimal Wash Temp</span>
                      <span className="font-mono font-bold text-amber-400">30°C - 60°C</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Stabilizer Required</span>
                      <span className="font-mono font-bold text-cyan-300">Borax / Propylene Glycol</span>
                    </div>
                  </div>

                  {alphaFoldModel?.pdbUrl && (
                    <a
                      href={alphaFoldModel.pdbUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-cyan-500 text-xs font-semibold text-cyan-300 flex items-center justify-center gap-2 transition-all"
                    >
                      <Download size={13} />
                      <span>Download AlphaFold PDB Model</span>
                    </a>
                  )}
                </div>
              ) : (
                /* Small Molecule Properties Grid */
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Molecular Weight</span>
                      <span className="font-mono font-bold text-white">
                        {compoundProps?.MolecularWeight ? `${compoundProps.MolecularWeight} g/mol` : '—'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Formula</span>
                      <span className="font-mono font-bold text-cyan-300">
                        {compoundProps?.MolecularFormula || selectedTarget.formula || '—'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">XLogP (Lipophilicity)</span>
                      <span className="font-mono font-bold text-amber-300">
                        {compoundProps?.XLogP !== undefined ? compoundProps.XLogP : '—'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">TPSA (Polar Surface)</span>
                      <span className="font-mono font-bold text-white">
                        {compoundProps?.TPSA !== undefined ? `${compoundProps.TPSA} Å²` : '—'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">H-Bond Donors</span>
                      <span className="font-mono font-bold text-white">
                        {compoundProps?.HBondDonorCount ?? '—'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">H-Bond Acceptors</span>
                      <span className="font-mono font-bold text-white">
                        {compoundProps?.HBondAcceptorCount ?? '—'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Rotatable Bonds</span>
                      <span className="font-mono font-bold text-white">
                        {compoundProps?.RotatableBondCount ?? '—'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Structural Complexity</span>
                      <span className="font-mono font-bold text-white">
                        {compoundProps?.Complexity ?? '—'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Formal Charge</span>
                      <span className="font-mono font-bold text-white">
                        {compoundProps?.Charge ?? '0'}
                      </span>
                    </div>
                  </div>

                  {compoundProps?.InChIKey && (
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono">
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">InChIKey:</span>
                      <span className="text-slate-300 break-all select-all">{compoundProps.InChIKey}</span>
                    </div>
                  )}

                  {compoundProps?.CID && (
                    <a
                      href={`https://pubchem.ncbi.nlm.nih.gov/compound/${compoundProps.CID}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-cyan-500 text-xs font-semibold text-cyan-300 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <ExternalLink size={13} />
                      <span>View Official PubChem Compound Record</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GHS Safety & Hazards */}
          {activeTab === 'safety' && (
            <div className="bg-[#0b1224] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="font-extrabold text-sm text-white flex items-center gap-2">
                  <ShieldAlert size={16} className="text-amber-400" />
                  GHS Hazard & Handling Profile
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300">
                  PUG-View Safety
                </span>
              </div>

              {safetyData?.hazardStatements && safetyData.hazardStatements.length > 0 ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                      <AlertTriangle size={12} className="text-amber-400" /> Hazard Statements (H-Codes)
                    </span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {safetyData.hazardStatements.slice(0, 6).map((statement, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-red-950/20 border border-red-500/30 text-[11px] text-red-200">
                          {statement}
                        </div>
                      ))}
                    </div>
                  </div>

                  {safetyData.precautionaryStatements && safetyData.precautionaryStatements.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Precautionary Statements (P-Codes)
                      </span>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {safetyData.precautionaryStatements.slice(0, 4).map((pCode, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono">
                            {pCode}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                  <ShieldAlert size={28} className="mx-auto text-emerald-400" />
                  <p className="text-xs font-semibold text-slate-200">Standard Detergent Raw Material Safety</p>
                  <p className="text-[11px] text-slate-400">
                    Always wear safety goggles, nitrile gloves, and an apron during formulation compounding. Maintain adequate ventilation when neutralizing acids with alkalis.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Structural Analogs & Greener Replacements */}
          {activeTab === 'analogs' && (
            <div className="bg-[#0b1224] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Layers size={16} className="text-cyan-400" />
                  2D Fast Structural Similarity
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                  Threshold &ge; 85%
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Explore chemically similar analogs from PubChem to find milder, bio-based, or cost-effective surfactant replacements:
              </p>

              {similarCids.length > 0 ? (
                <div className="space-y-2">
                  {similarCids.map((sCid) => (
                    <div
                      key={sCid}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between gap-2 transition-all"
                    >
                      <div>
                        <span className="text-xs font-bold text-white block">PubChem Compound</span>
                        <span className="text-[11px] font-mono text-cyan-300">CID: {sCid}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCustomSearch(String(sCid))}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all cursor-pointer"
                      >
                        Load Molecule
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
                  {isSearching ? 'Scanning PubChem similarity index...' : 'No synchronous 2D analogs found for this specific identifier.'}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Peer-Reviewed Scientific Literature */}
          {activeTab === 'literature' && (
            <div className="bg-[#0b1224] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="font-extrabold text-sm text-white flex items-center gap-2">
                  <BookOpen size={16} className="text-purple-400" />
                  Cleaning Chemistry Literature
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-300">
                  PubMed / Europe PMC
                </span>
              </div>

              {articles.length > 0 ? (
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {articles.map((art) => (
                    <a
                      key={art.id}
                      href={art.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/60 transition-all group"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold text-purple-400">{art.source}</span>
                        <span className="text-[10px] text-slate-500">{art.pubDate}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white group-hover:text-purple-300 line-clamp-2 transition-colors">
                        {art.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 italic truncate">
                        {art.journal} {art.authors.length > 0 ? `• ${art.authors.join(', ')}` : ''}
                      </p>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
                  {isSearching ? 'Querying PubMed Entrez API...' : 'No articles returned for current query.'}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
