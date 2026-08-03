import React, { useState, useCallback, useEffect } from 'react';
import { 
  Bot, 
  BookOpen, 
  Library, 
  TestTube, 
  Sliders, 
  Calculator, 
  ClipboardCheck, 
  Package, 
  FileText, 
  PenTool, 
  Binary, 
  Search, 
  Mic, 
  MicOff, 
  Camera, 
  Globe, 
  Menu, 
  X, 
  Sparkles, 
  FlaskConical, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Play, 
  CheckCircle, 
  ChevronRight,
  Info,
  Beaker,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Scale,
  Zap,
  Check,
  Activity,
  Gauge
} from 'lucide-react';

import AIFormulator from './components/AIFormulator';
import ChemicalEncyclopedia from './components/ChemicalEncyclopedia';
import FormulationLibrary from './components/FormulationLibrary';
import RCCalculators from './components/RCCalculators';
import QCOperations from './components/QCOperations';
import InventoryProduction from './components/InventoryProduction';
import DocsLibrary from './components/DocsLibrary';
import LabNotebook from './components/LabNotebook';
import SmartFormulaAnalyzerPro from './components/SmartFormulaAnalyzerPro';
import MathTestSuite from './components/MathTestSuite';

import { IngredientInput, PHAdvancedResult, PHSimpleResult, FormulationIngredient, ActiveFormulaState } from './types';
import { INGREDIENT_DATABASE, calculatePHAdvanced, calculatePHSimple } from './utils/pHEngine';

const AVAILABLE_INGREDIENTS = Object.keys(INGREDIENT_DATABASE).sort();

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    appTitle: "Detergent R&D Expert",
    appSubtitle: "Professional Detergent R&D Laboratory",
    aiFormulator: "AI Formulation Expert",
    aiFormulatorDesc: "Gemini-powered detergent expert laboratory",
    encyclopedia: "Chemical Encyclopedia",
    chemDbStats: "Interactive Knowledge base of essential detergent raw materials",
    formulaLib: "Formula Library",
    formulaLibDesc: "Verified standard manufacturing recipes & batch scaling",
    phEngine: "Advanced pH Engine",
    phEngineDesc: "Newton-Raphson charge balance & buffer capacity solver",
    analyzer: "Smart Formula Analyzer Pro",
    analyzerDesc: "Deep compatibility, cost, performance & HLB audit",
    calculators: "R&D Calculators",
    calculatorsDesc: "Detergent chemistry, stoichiometry, and physical calculators",
    qcPanel: "Quality Control & SOPs",
    qcPanelDesc: "Laboratory quality checks, titration procedures, and active matter logging",
    inventory: "Inventory & Production",
    inventoryDesc: "Laboratory stock ledger, replenishment tracking, and production batching log",
    docs: "Documents & SDS",
    docsDesc: "Safety data sheets, regulatory standards & chemical guidelines",
    notebook: "Lab Notebook",
    notebookDesc: "Digital experiment logs, batch notes & observation records",
    mathTests: "Math & Science Test Suite",
    mathTestsDesc: "22-point mathematical and chemical assertion suite",
    searchPlaceholder: "Search raw materials, formulas, CAS numbers, or calculators...",
    lblFormula: "Batch Name",
    voiceSearch: "Voice Search",
    scanLabel: "Scan Label / Camera",
    langName: "English"
  },
  hi: {
    appTitle: "डिटर्जेंट R&D विशेषज्ञ",
    appSubtitle: "औद्योगिक फॉर्मूलेशन और R&D प्लेटफॉर्म",
    aiFormulator: "AI फॉर्मूलेशन विशेषज्ञ",
    aiFormulatorDesc: "जेमिनी संचालित डिटर्जेंट प्रयोगशाला",
    encyclopedia: "रासायनिक ज्ञानकोश",
    chemDbStats: "आवश्यक डिटर्जेंट कच्चे माल का ज्ञानकोश",
    formulaLib: "फॉर्मूला लाइब्रेरी",
    formulaLibDesc: "सत्यापित मानक निर्माण व्यंजन और बैच स्केलिंग",
    phEngine: "उन्नत pH इंजन",
    phEngineDesc: "न्यूटन-राफसन चार्ज संतुलन और बफर क्षमता हलकर्ता",
    analyzer: "स्मार्ट फॉर्मूला एनालाइज़र प्रो",
    analyzerDesc: "गहन संगतता, लागत, प्रदर्शन और HLB ऑडिट",
    calculators: "R&D कैलकुलेटर",
    calculatorsDesc: "डिटर्जेंट रसायन विज्ञान और भौतिक कैलकुलेटर",
    qcPanel: "गुणवत्ता नियंत्रण और SOPs",
    qcPanelDesc: "प्रयोगशाला गुणवत्ता जांच और अनुमापन प्रक्रियाएं",
    inventory: "सूची और उत्पादन",
    inventoryDesc: "प्रयोगशाला स्टॉक बहीखाता और बैचिंग लॉग",
    docs: "दस्तावेज़ और SDS",
    docsDesc: "सुरक्षा डेटा शीट और नियामक मानक",
    notebook: "लैब नोटबुक",
    notebookDesc: "डिजिटल प्रयोग लॉग और अवलोकन रिकॉर्ड",
    mathTests: "गणित और विज्ञान परीक्षण सुइट",
    mathTestsDesc: "22-बिंदु गणितीय परीक्षण सुइट",
    searchPlaceholder: "कच्चा माल, फॉर्मूला, CAS नंबर खोजें...",
    lblFormula: "बैच का नाम",
    voiceSearch: "आवाज खोज",
    scanLabel: "स्कैन करें / कैमरा",
    langName: "हिन्दी"
  },
  mr: {
    appTitle: "डिटर्जंट R&D तज्ञ",
    appSubtitle: "औद्योगिक फॉर्म्युलेशन आणि R&D प्लॅटफॉर्म",
    aiFormulator: "AI फॉर्म्युलेशन तज्ञ",
    aiFormulatorDesc: "जेमिनी संचलित डिटर्जंट प्रयोगशाळा",
    encyclopedia: "रासायनिक ज्ञानकोश",
    chemDbStats: "आवश्यक डिटर्जंट कच्च्या मालाचा ज्ञानकोश",
    formulaLib: "फॉर्म्युला लायब्ररी",
    formulaLibDesc: "प्रमाणित उत्पादन पाककृती आणि बॅच स्केलिंग",
    phEngine: "प्रगत pH इंजिन",
    phEngineDesc: "न्यूटन-राफसन चार्ज संतुलन आणि बफर क्षमता सॉल्व्हर",
    analyzer: "स्मार्ट फॉर्म्युला अॅनालायझर प्रो",
    analyzerDesc: "सुसंगतता, खर्च, कार्यक्षमता आणि HLB ऑडिट",
    calculators: "R&D कॅल्क्युलेटर",
    calculatorsDesc: "डिटर्जंट रसायनशास्त्र आणि भौतिक कॅल्क्युलेटर",
    qcPanel: "गुणवत्ता नियंत्रण आणि SOPs",
    qcPanelDesc: "प्रयोगशाळा गुणवत्ता तपासणी आणि टायट्रेशन",
    inventory: "साठा आणि उत्पादन",
    inventoryDesc: "प्रयोगशाळा स्टॉक नोंदवही आणि बॅचिंग लॉग",
    docs: "कागदपत्रे आणि SDS",
    docsDesc: "सुरक्षा डेटा शीट्स आणि नियम",
    notebook: "लॅब नोंदवही",
    notebookDesc: "डिजिटल प्रयोग नोंदी आणि निरीक्षणे",
    mathTests: "गणित आणि विज्ञान चाचणी सुइट",
    mathTestsDesc: "22-मुद्यांची गणितीय चाचणी",
    searchPlaceholder: "कच्चा माल, फॉर्म्युला, CAS शोधा...",
    lblFormula: "बॅचचे नाव",
    voiceSearch: "आवाज शोध",
    scanLabel: "स्कॅन करा / कॅमेरा",
    langName: "मराठी"
  },
  es: {
    appTitle: "Experto R&D Detergentes",
    appSubtitle: "Plataforma de Formulación e I+D Industrial",
    aiFormulator: "Formulador Experto IA",
    aiFormulatorDesc: "Laboratorio experto impulsado por Gemini",
    encyclopedia: "Enciclopedia Química",
    chemDbStats: "Base de datos interactiva de materias primas",
    formulaLib: "Biblioteca de Fórmulas",
    formulaLibDesc: "Recetas de fabricación estándar verificadas",
    phEngine: "Motor de pH Avanzado",
    phEngineDesc: "Solvador de balance de carga y capacidad búfer",
    analyzer: "Analizador Inteligente de Fórmulas Pro",
    analyzerDesc: "Auditoría de compatibilidad, costo y HLB",
    calculators: "Calculadoras de I+D",
    calculatorsDesc: "Calculadoras estequiométricas y físicas",
    qcPanel: "Control de Calidad y SOPs",
    qcPanelDesc: "Pruebas de laboratorio y registro de valoración",
    inventory: "Inventario y Producción",
    inventoryDesc: "Registro de existencias y lotes de producción",
    docs: "Documentos y FDS",
    docsDesc: "Hojas de datos de seguridad y normas",
    notebook: "Cuaderno de Laboratorio",
    notebookDesc: "Registros de experimentos y observaciones",
    mathTests: "Suite de Pruebas Matemáticas",
    mathTestsDesc: "Suite de validación matemática de 22 puntos",
    searchPlaceholder: "Buscar materias primas, fórmulas, CAS...",
    lblFormula: "Nombre del Lote",
    voiceSearch: "Búsqueda por Voz",
    scanLabel: "Escanear / Cámara",
    langName: "Español"
  },
  fr: {
    appTitle: "Expert R&D Détergents",
    appSubtitle: "Plateforme Industrielle de Formulation et R&D",
    aiFormulator: "Formulateur Expert IA",
    aiFormulatorDesc: "Laboratoire détergent propulsé par Gemini",
    encyclopedia: "Encyclopédie Chimique",
    chemDbStats: "Base de connaissances sur les matières premières",
    formulaLib: "Bibliothèque de Formules",
    formulaLibDesc: "Recettes de fabrication standard vérifiées",
    phEngine: "Moteur de pH Avancé",
    phEngineDesc: "Solveur d'équilibre de charge Newton-Raphson",
    analyzer: "Analyseur Intelligent de Formules Pro",
    analyzerDesc: "Audit de compatibilité, coût, performance et HLB",
    calculators: "Calculateurs R&D",
    calculatorsDesc: "Calculateurs de chimie des détergents et physique",
    qcPanel: "Contrôle Qualité et POS",
    qcPanelDesc: "Tests de laboratoire et suivi de titrage",
    inventory: "Inventaire et Production",
    inventoryDesc: "Gestion des stocks et suivi des lots",
    docs: "Documents et FDS",
    docsDesc: "Fiches de données de sécurité et normes",
    notebook: "Cahier de Laboratoire",
    notebookDesc: "Journal d'expériences et observations",
    mathTests: "Suite de Tests Mathématiques",
    mathTestsDesc: "Suite de validation mathématique en 22 points",
    searchPlaceholder: "Rechercher matières premières, formules, CAS...",
    lblFormula: "Nom du Lot",
    voiceSearch: "Recherche Vocale",
    scanLabel: "Scanner / Caméra",
    langName: "Français"
  },
  ar: {
    appTitle: "خبير البحث والتطوير للمنظفات",
    appSubtitle: "منصة التركيب والتطوير الصناعي",
    aiFormulator: "خبير التركيب بالذكاء الاصطناعي",
    aiFormulatorDesc: "مختبر المنظفات المتقدم المدعوم من Gemini",
    encyclopedia: "الموسوعة الكيميائية",
    chemDbStats: "قاعدة معرفية تفاعلية للمواد الخام",
    formulaLib: "مكتبة التركيبات",
    formulaLibDesc: "وصفات تصنيع قياسية معتمدة",
    phEngine: "محرك الرقم الهيدروجيني المتقدم",
    phEngineDesc: "حاسب توازن الشحنة وسعة المحلول المنظم",
    analyzer: "محلل التركيب الذكي برو",
    analyzerDesc: "تدقيق التوافق والتكلفة والأداء وHLB",
    calculators: "حاسبات البحث والتطوير",
    calculatorsDesc: "حاسبات كيمياء المنظفات والفيزياء",
    qcPanel: "ضبط الجودة إجراءات التشغيل",
    qcPanelDesc: "فحوصات الجودة والمعايرة والبروتين الفعال",
    inventory: "المخزون والإنتاج",
    inventoryDesc: "سجل المخبر والدفعات الإنتاجية",
    docs: "الوثائق وأوراق السلامة",
    docsDesc: "صحائف بيانات السلامة والمعايير التنظيمية",
    notebook: "دفتر الملاحظات المعملية",
    notebookDesc: "سجلات التجارب الرقمية والملاحظات",
    mathTests: "مجموعة الاختبارات الرياضية",
    mathTestsDesc: "مجموعة اختبار رياضية وكيميائية من 22 نقطة",
    searchPlaceholder: "ابحث عن المواد الخام، التركيبات، رقم CAS...",
    lblFormula: "اسم الدفعة",
    voiceSearch: "البحث الصوتي",
    scanLabel: "مسح الضوئي / الكاميرا",
    langName: "العربية"
  },
  zh: {
    appTitle: "洗涤剂 R&D 专家",
    appSubtitle: "工业配方与研发平台",
    aiFormulator: "AI 配方专家",
    aiFormulatorDesc: "Gemini 驱动的洗涤剂专家实验室",
    encyclopedia: "化学百科全书",
    chemDbStats: "洗涤剂原料互动知识库",
    formulaLib: "配方库",
    formulaLibDesc: "经验证的标准生产配方与批次缩放",
    phEngine: "高级 pH 引擎",
    phEngineDesc: "牛顿-拉夫逊电荷平衡与缓冲容量求解器",
    analyzer: "智能配方分析仪 Pro",
    analyzerDesc: "深度兼容性、成本、性能及 HLB 审计",
    calculators: "研发计算器",
    calculatorsDesc: "洗涤剂化学、化学计量与物理计算器",
    qcPanel: "质量控制与 SOP",
    qcPanelDesc: "实验室质量检测与滴定记录",
    inventory: "库存与生产",
    inventoryDesc: "实验室库存账本与生产批次日志",
    docs: "文档与 SDS",
    docsDesc: "安全数据表与法规标准",
    notebook: "实验室笔记本",
    notebookDesc: "数字实验日志与观察记录",
    mathTests: "数学与科学测试套件",
    mathTestsDesc: "22 点数学与化学断言套件",
    searchPlaceholder: "搜索原料、配方、CAS 号或计算器...",
    lblFormula: "批次名称",
    voiceSearch: "语音搜索",
    scanLabel: "扫描标签 / 摄像头",
    langName: "中文"
  }
};

type TabType = 
  | 'ai_formulator' 
  | 'encyclopedia' 
  | 'formulas' 
  | 'ph_engine' 
  | 'analyzer' 
  | 'calculators' 
  | 'qc' 
  | 'inventory' 
  | 'docs' 
  | 'notebook' 
  | 'math_tests';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('ai_formulator');
  const [lang, setLang] = useState<string>('en');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  // Cross-component selected IDs & Single Source of Truth Active Formula State
  const [selectedChemicalId, setSelectedChemicalId] = useState<string | null>(null);
  const [selectedFormulaId, setSelectedFormulaId] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [activeFormula, setActiveFormula] = useState<ActiveFormulaState | null>(null);

  // Current translation strings
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // Voice Search Handler
  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert("Voice search / speech recognition is not supported in this browser window.");
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : lang === 'es' ? 'es-ES' : lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-SA' : lang === 'zh' ? 'zh-CN' : 'en-US';
    
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // Grouped Workspace Navigation Structure
  const WORKSPACE_GROUPS = [
    {
      id: 'formulation_analysis',
      title: 'FORMULATION & ANALYSIS',
      items: [
        { id: 'ai_formulator', label: t.aiFormulator, icon: Bot, color: 'text-indigo-400', badge: 'AI' },
        { id: 'formulas', label: t.formulaLib, icon: Library, color: 'text-blue-400' },
        { id: 'analyzer', label: t.analyzer, icon: Sliders, color: 'text-purple-400' },
        { id: 'ph_engine', label: t.phEngine, icon: TestTube, color: 'text-emerald-400', badge: 'Core' },
      ]
    },
    {
      id: 'operations_qc',
      title: 'LAB OPERATIONS & QUALITY',
      items: [
        { id: 'qc', label: t.qcPanel, icon: ClipboardCheck, color: 'text-cyan-400' },
        { id: 'inventory', label: t.inventory, icon: Package, color: 'text-orange-400' },
        { id: 'notebook', label: t.notebook, icon: PenTool, color: 'text-pink-400' },
      ]
    },
    {
      id: 'calculators_suite',
      title: 'CALCULATORS & SUITE',
      items: [
        { id: 'calculators', label: t.calculators, icon: Calculator, color: 'text-amber-400' },
        { id: 'math_tests', label: t.mathTests, icon: Binary, color: 'text-emerald-300' },
      ]
    },
    {
      id: 'knowledge_reference',
      title: 'KNOWLEDGE & REFERENCE',
      items: [
        { id: 'encyclopedia', label: t.encyclopedia, icon: BookOpen, color: 'text-teal-400' },
        { id: 'docs', label: t.docs, icon: FileText, color: 'text-slate-400' },
      ]
    }
  ];

  // Flattened nav items for mobile lookups
  const allNavItems = WORKSPACE_GROUPS.flatMap(g => g.items);

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden bg-slate-900 text-slate-100 flex flex-col font-sans ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
      
      {/* HEADER */}
      <header className="bg-slate-950/90 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md px-2.5 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Brand & Mobile Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
            title="Toggle Sidebar Workspaces"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer flex-1 min-w-0" onClick={() => setActiveTab('ai_formulator')}>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-500 p-0.5 shadow-lg shadow-indigo-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Beaker size={16} className="text-teal-400 animate-pulse sm:w-[20px] sm:h-[20px]" />
              </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h1 className="font-extrabold text-xs sm:text-base md:text-lg leading-tight tracking-tight text-white flex flex-wrap items-center gap-1 sm:gap-2">
                <span className="font-extrabold">{t.appTitle}</span>
                <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/30 to-teal-500/30 text-indigo-200 border border-indigo-500/40 shrink-0 font-mono tracking-wider shadow-xs">
                  PRO
                </span>
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium hidden sm:block truncate">
                {t.appSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Search, Voice, Camera */}
        <div className="flex-1 max-w-xl relative hidden md:flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-24 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
            
            {/* Quick Actions in Search Bar */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ${isListening ? 'text-red-400 animate-pulse bg-red-500/10' : ''}`}
                title={t.voiceSearch}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <button
                type="button"
                onClick={() => setIsCameraActive(!isCameraActive)}
                className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ${isCameraActive ? 'text-teal-400 bg-teal-500/10' : ''}`}
                title={t.scanLabel}
              >
                <Camera size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Language Selector & Status */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="relative flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 shrink-0">
            <Globe size={14} className="text-teal-400 shrink-0" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer pr-0.5 sm:pr-1 w-auto"
            >
              <option value="en" className="bg-slate-900 text-slate-200">🇬🇧 English</option>
              <option value="hi" className="bg-slate-900 text-slate-200">🇮🇳 हिन्दी</option>
              <option value="mr" className="bg-slate-900 text-slate-200">🇮🇳 मराठी</option>
              <option value="es" className="bg-slate-900 text-slate-200">🇪🇸 Español</option>
              <option value="fr" className="bg-slate-900 text-slate-200">🇫🇷 Français</option>
              <option value="ar" className="bg-slate-900 text-slate-200">🇸🇦 العربية</option>
              <option value="zh" className="bg-slate-900 text-slate-200">🇨🇳 中文</option>
            </select>
          </div>
        </div>
      </header>

      {/* CAMERA / SCANNER MODAL FEEDBACK IF TOGGLED */}
      {isCameraActive && (
        <div className="bg-teal-950/80 border-b border-teal-800/50 px-4 py-2 flex items-center justify-between text-xs text-teal-200 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Camera size={16} className="animate-bounce text-teal-400" />
            <span>Label Scanner Active: Point camera at raw material specifications or OCR label</span>
          </div>
          <button onClick={() => setIsCameraActive(false)} className="text-teal-400 hover:text-white font-bold">
            Close Scanner
          </button>
        </div>
      )}

      {/* MAIN CONTAINER (LAYOUT WITH SIDEBAR) */}
      <div className="flex-1 flex relative overflow-hidden w-full max-w-full pb-14 sm:pb-0">

        {/* Mobile Backdrop Overlay when sidebar is open */}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 top-14 bg-slate-950/60 backdrop-blur-xs z-30 md:hidden transition-opacity"
            aria-hidden="true"
          />
        )}

        {/* LEFT VERTICAL NAVIGATION SIDEBAR WITH LOGICAL WORKSPACES */}
        <aside 
          className={`
            fixed md:relative top-14 bottom-0 left-0 md:top-auto md:bottom-auto md:inset-auto z-40 
            flex flex-col bg-slate-950 border-r border-slate-800 
            transition-all duration-300 select-none overflow-y-auto shrink-0
            ${sidebarOpen 
              ? 'w-64 max-w-[80vw] translate-x-0' 
              : '-translate-x-full md:translate-x-0 md:w-20 w-0'
            }
          `}
        >
          <div className="p-3 pt-4 md:pt-3 space-y-5">
            {WORKSPACE_GROUPS.map((group) => (
              <div key={group.id} className="space-y-1">
                {sidebarOpen ? (
                  <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
                    <span>{group.title}</span>
                  </div>
                ) : (
                  <div className="h-px bg-slate-800 my-2 hidden md:block" />
                )}
                
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as TabType);
                        if (typeof window !== 'undefined' && window.innerWidth < 768) {
                          setSidebarOpen(false);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-indigo-600/20 border border-indigo-500/40 text-white shadow-md shadow-indigo-600/10' 
                          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                      }`}
                      title={item.label}
                    >
                      <Icon size={18} className={`${item.color} shrink-0`} />
                      <span className={`truncate ${!sidebarOpen ? 'sm:hidden' : 'block'}`}>
                        {item.label}
                      </span>
                      {item.badge && sidebarOpen && (
                        <span className="ml-auto text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* SIDEBAR FOOTER */}
          <div className="mt-auto p-3 border-t border-slate-800/60 text-[11px] text-slate-500 text-center">
            {sidebarOpen ? (
              <p>v4.8.0 • Lab Workspaces Active</p>
            ) : (
              <p className="hidden sm:block">R&D</p>
            )}
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT AREA */}
        <main className={`flex-1 overflow-y-auto overflow-x-hidden bg-slate-900 ${activeTab === 'encyclopedia' ? 'p-0 sm:p-6' : 'p-3 sm:p-6'} min-w-0 w-full max-w-full space-y-4`}>
          
          {/* HORIZONTAL WORKSPACE QUICK-NAV STRIP (Mobile & Compact Desktop) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800/80 -mx-3 px-3 sm:mx-0 sm:px-0">
            {allNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                      : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-white' : item.color} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {activeTab === 'ai_formulator' && (
            <AIFormulator 
              lang={lang} 
              translations={TRANSLATIONS} 
              onFormulaGenerated={(formula) => setActiveFormula(formula)}
            />
          )}

          {activeTab === 'encyclopedia' && (
            <ChemicalEncyclopedia 
              lang={lang} 
              translations={TRANSLATIONS} 
              selectedChemicalId={selectedChemicalId}
              onSelectChemical={(id: string) => setSelectedChemicalId(id)}
            />
          )}

          {activeTab === 'formulas' && (
            <FormulationLibrary 
              lang={lang} 
              translations={TRANSLATIONS} 
              selectedFormulaId={selectedFormulaId}
              onSelectFormula={(id: string) => setSelectedFormulaId(id)}
              onSelectActiveFormula={(formula) => setActiveFormula(formula)}
              activeFormula={activeFormula}
            />
          )}

          {activeTab === 'ph_engine' && (
            <PHEngineView activeFormula={activeFormula} />
          )}

          {activeTab === 'analyzer' && (
            <SmartFormulaAnalyzerPro 
              lang={lang as any} 
              translations={TRANSLATIONS} 
              ingredients={activeFormula?.ingredients || []}
              formulaName={activeFormula?.name || ""}
              productType={activeFormula?.productType || "Liquid Laundry Detergent"}
              grade={activeFormula?.grade || "Standard"}
              targetCost={activeFormula?.targetCost || 0}
            />
          )}

          {activeTab === 'calculators' && (
            <RCCalculators lang={lang} translations={TRANSLATIONS} activeFormula={activeFormula} />
          )}

          {activeTab === 'qc' && (
            <QCOperations lang={lang} translations={TRANSLATIONS} activeFormula={activeFormula} />
          )}

          {activeTab === 'inventory' && (
            <InventoryProduction 
              lang={lang} 
              translations={TRANSLATIONS} 
              selectedBatchId={selectedBatchId}
              onSelectBatch={(id: string) => setSelectedBatchId(id)}
              activeFormula={activeFormula}
            />
          )}

          {activeTab === 'docs' && (
            <DocsLibrary lang={lang} translations={TRANSLATIONS} />
          )}

          {activeTab === 'notebook' && (
            <LabNotebook lang={lang} translations={TRANSLATIONS} activeFormula={activeFormula} />
          )}

          {activeTab === 'math_tests' && (
            <MathTestSuite />
          )}

        </main>
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENT: Advanced pH Engine UI View
// ============================================
function PHEngineView({ activeFormula }: { activeFormula?: ActiveFormulaState | null }) {
  const [ingredients, setIngredients] = useState<IngredientInput[]>([
    { id: '1', name: 'Sodium Hydroxide (Caustic Soda Lye 100%)', rawPercent: 0.44 },
    { id: '2', name: 'Linear Alkylbenzene Sulfonic Acid (LABSA 90%)', rawPercent: 4.0 },
  ]);
  const [batchSize, setBatchSize] = useState<number>(100);
  const [targetPH, setTargetPH] = useState<number>(7.00);
  const [simpleResult, setSimpleResult] = useState<PHSimpleResult | null>(null);
  const [advancedResult, setAdvancedResult] = useState<PHAdvancedResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liveSync, setLiveSync] = useState<boolean>(false);

  const findMatchingPHEngineIngredient = useCallback((name: string): string => {
    if (INGREDIENT_DATABASE[name]) return name;
    const lower = name.toLowerCase();
    
    // Exact case-insensitive match
    const exactMatch = AVAILABLE_INGREDIENTS.find(k => k.toLowerCase() === lower);
    if (exactMatch) return exactMatch;
    
    // Key keyword mappings
    if (lower.includes('labsa') || lower.includes('sulfonic')) {
      const match = AVAILABLE_INGREDIENTS.find(k => k.toLowerCase().includes('labsa'));
      if (match) return match;
    }
    if (lower.includes('sles') || lower.includes('laureth sulfate')) {
      const match = AVAILABLE_INGREDIENTS.find(k => k.toLowerCase().includes('sles'));
      if (match) return match;
    }
    if (lower.includes('caustic') || lower.includes('sodium hydroxide') || lower.includes('naoh')) {
      const match = AVAILABLE_INGREDIENTS.find(k => k.toLowerCase().includes('sodium hydroxide') || k.toLowerCase().includes('caustic') || k.toLowerCase().includes('naoh'));
      if (match) return match;
    }
    if (lower.includes('citric')) {
      const match = AVAILABLE_INGREDIENTS.find(k => k.toLowerCase().includes('citric'));
      if (match) return match;
    }
    if (lower.includes('soda ash') || lower.includes('sodium carbonate')) {
      const match = AVAILABLE_INGREDIENTS.find(k => k.toLowerCase().includes('soda ash') || k.toLowerCase().includes('carbonate'));
      if (match) return match;
    }
    
    // Partial substring match
    const partialMatch = AVAILABLE_INGREDIENTS.find(k => 
      lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)
    );
    if (partialMatch) return partialMatch;
    
    return AVAILABLE_INGREDIENTS[0] || 'Sodium Hydroxide (Caustic Soda Lye 100%)';
  }, []);

  const handleLoadActiveFormula = useCallback(() => {
    if (!activeFormula || !activeFormula.ingredients || activeFormula.ingredients.length === 0) return;

    const importedIngredients: IngredientInput[] = activeFormula.ingredients.map((ing, idx) => ({
      id: `active-${Date.now()}-${idx}`,
      name: findMatchingPHEngineIngredient(ing.name),
      rawPercent: Number(ing.percentage) || 0,
    }));

    setIngredients(importedIngredients);
    if (activeFormula.batchSize && activeFormula.batchSize > 0) {
      setBatchSize(activeFormula.batchSize);
    }
    setSimpleResult(null);
    setAdvancedResult(null);
    setErrorMessage(null);
  }, [activeFormula, findMatchingPHEngineIngredient]);

  // Optional Live Sync Effect (Observes activeFormula when liveSync = true)
  useEffect(() => {
    if (liveSync && activeFormula && activeFormula.ingredients && activeFormula.ingredients.length > 0) {
      handleLoadActiveFormula();
    }
  }, [liveSync, activeFormula, handleLoadActiveFormula]);

  const addIngredient = useCallback(() => {
    setIngredients(prev => [
      ...prev,
      { id: Date.now().toString(), name: AVAILABLE_INGREDIENTS[0], rawPercent: 0 },
    ]);
  }, []);

  const removeIngredient = useCallback((id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateIngredient = useCallback((id: string, field: keyof IngredientInput, value: any) => {
    setIngredients(prev =>
      prev.map(i => (i.id === id ? { ...i, [field]: value } : i))
    );
  }, []);

  const handleCheckFormula = useCallback(() => {
    setErrorMessage(null);
    setLoading(true);
    setTimeout(() => {
      try {
        const simple = calculatePHSimple(ingredients, batchSize);
        const advanced = calculatePHAdvanced(ingredients, batchSize);
        setSimpleResult(simple);
        setAdvancedResult(advanced);
      } catch (err: any) {
        console.error('pH Engine Error:', err);
        setErrorMessage(
          'An unexpected error occurred while calculating pH. Please check your formulation and try again.'
        );
        setSimpleResult(null);
        setAdvancedResult(null);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [ingredients, batchSize]);

  const totalPercent = ingredients.reduce((sum, i) => sum + i.rawPercent, 0);

  // Derived Neutralization Assistant values (Strictly read-only UI helpers)
  const currentpH = advancedResult?.finalPH ?? 7.0;
  const excessAcid = advancedResult?.excessStrongAcid ?? 0;
  const excessBase = advancedResult?.excessStrongBase ?? 0;
  
  const isAcidExcess = excessAcid > 1e-6 || currentpH < 6.80;
  const isAlkaliExcess = excessBase > 1e-6 || currentpH > 7.20;
  const isNeutral = !isAcidExcess && !isAlkaliExcess;

  // Exact NaOH addition (g and kg) needed to reach equivalence (pH 7.00)
  // 1 mol NaOH = 39.9971 g
  const recNaOHGrams = excessAcid * 39.9971;
  const recNaOHKg = recNaOHGrams / 1000;

  // Exact LABSA addition (g and kg) needed to reach equivalence (pH 7.00)
  // 1 mol LABSA (90%) = 326.49 / 0.90 = 362.766 g
  const recLABSAGrams = excessBase * (326.49 / 0.90);
  const recLABSAKg = recLABSAGrams / 1000;

  const isHighSensitivity = Math.abs(currentpH - targetPH) < 3.5 || excessAcid < 0.05 || excessBase < 0.05;

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-800">
      
      {/* Header Banner */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 text-slate-100 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TestTube size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 flex-wrap">
                Detergent R&D Lab pH Engine
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  Phase 7A Industrial Mode
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                High-Precision Batch Analysis • Buffer Capacity (β) • Debye-Hückel Activity • Newton-Raphson Solver
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Formula Import Toolbar */}
      {activeFormula && activeFormula.ingredients && activeFormula.ingredients.length > 0 ? (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-200 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Active Workspace Formula Available</div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                {activeFormula.name || "Untitled Formula"}
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {activeFormula.ingredients.length} ingredients
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer bg-slate-800/90 hover:bg-slate-800 px-3 py-2 rounded-xl border border-slate-700 select-none transition-colors">
              <input
                type="checkbox"
                checked={liveSync}
                onChange={(e) => setLiveSync(e.target.checked)}
                className="rounded text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <span>Live Sync Active Formula</span>
              {liveSync && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                  LIVE
                </span>
              )}
            </label>
            <button
              onClick={handleLoadActiveFormula}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer border border-emerald-400/30 shrink-0"
            >
              <RefreshCw size={14} />
              Load Active Formula ({activeFormula.name || "Active Formula"})
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-slate-400 text-xs">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-slate-500 shrink-0" />
            <span>No active formula selected in workspace. Select or generate a formula in AI Expert or Formula Library to load it here.</span>
          </div>
        </div>
      )}

      {/* Formula Form */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2 pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FlaskConical size={18} className="text-indigo-600" />
            Formula Ingredients (Smart High-Precision Unit Display)
          </h3>
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Batch Size:</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={batchSize}
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  setBatchSize(isNaN(val) || val <= 0 ? 100 : val);
                }}
                className="w-24 px-2.5 py-1 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-xs font-bold text-slate-600">kg</span>
              <span className="text-[11px] font-mono text-indigo-600 font-semibold whitespace-nowrap">
                ({(batchSize * 1000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 3 })} g)
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {ingredients.map((ing) => {
            const purity = INGREDIENT_DATABASE[ing.name]?.purity ?? 1;
            const activePct = (purity * 100).toFixed(0);
            const weightKgNum = (ing.rawPercent * batchSize) / 100;
            const weightKgStr = weightKgNum.toFixed(6);
            const weightGramsStr = (weightKgNum * 1000).toFixed(3);

            return (
              <div key={ing.id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Ingredient Selector
                    </label>
                    <select
                      value={ing.name}
                      onChange={e => updateIngredient(ing.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800"
                    >
                      {AVAILABLE_INGREDIENTS.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeIngredient(ing.id)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition self-end cursor-pointer"
                    title="Remove ingredient"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 truncate" title="Raw %">
                      Raw %
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      min="0"
                      max="100"
                      value={ing.rawPercent}
                      onChange={e => updateIngredient(ing.id, 'rawPercent', parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 bg-white text-center focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 truncate" title="Active %">
                      Active Purity %
                    </label>
                    <div className="w-full px-2 py-1.5 border border-slate-200 bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-700 text-center select-none">
                      {activePct}%
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 truncate" title="High Precision Weight">
                      Weight (kg & grams)
                    </label>
                    <div className="space-y-0.5">
                      <input
                        type="number"
                        step="0.000001"
                        min="0"
                        value={weightKgStr}
                        onChange={e => {
                          const w = parseFloat(e.target.value) || 0;
                          const newPct = batchSize > 0 ? (w / batchSize) * 100 : 0;
                          updateIngredient(ing.id, 'rawPercent', newPct);
                        }}
                        className="w-full px-2 py-1 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 bg-white text-center focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="text-center text-[11px] font-mono font-bold text-indigo-600">
                        ({weightGramsStr} g)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={addIngredient}
            className="flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0"
          >
            <Plus size={16} />
            Add Ingredient
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <span className={`text-xs font-bold ${Math.abs(totalPercent - 100) < 0.1 ? 'text-emerald-600' : 'text-amber-600'}`}>
              Total: {totalPercent.toFixed(4)}% {Math.abs(totalPercent - 100) >= 0.1 && '(Water auto-calculated)'}
            </span>

            <button
              type="button"
              onClick={handleCheckFormula}
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
              Calculate pH & Buffer
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertTriangle size={16} className="shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* RESULTS SECTION */}
      {simpleResult && advancedResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Simple Result Card */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>Basic Stoichiometric Summary</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">Fast Mode</span>
              </h3>

              <div className="space-y-2 text-xs text-slate-600 pt-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Calculation Method:</span>
                  <span className="font-bold text-slate-800">{simpleResult.method ?? "Simple Weighted Average"}</span>
                </div>
                {(simpleResult as any).requiredNaOH100 !== undefined && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Required NaOH (100%):</span>
                    <span className="font-mono font-bold text-slate-800">
                      {((simpleResult as any).requiredNaOH100 ?? 0).toFixed(6)} kg ({(((simpleResult as any).requiredNaOH100 ?? 0) * 1000).toFixed(3)} g)
                    </span>
                  </div>
                )}
                {(simpleResult as any).actualNaOH100 !== undefined && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Actual NaOH (100%):</span>
                    <span className="font-mono font-bold text-slate-800">
                      {((simpleResult as any).actualNaOH100 ?? 0).toFixed(6)} kg ({(((simpleResult as any).actualNaOH100 ?? 0) * 1000).toFixed(3)} g)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Scientific pH Analysis Card */}
            <div className="bg-slate-950 text-slate-100 rounded-2xl shadow-xl border border-slate-800 p-6 space-y-4">
              <div className="border-b border-slate-800 pb-3 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-teal-400" />
                    Scientific pH Analysis
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {(advancedResult as any).solverUsed ?? "Newton-Raphson"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Calculated using Newton-Raphson Equilibrium Solver
                </p>
              </div>

              <div className="flex items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-400 block mb-0.5">Final pH</span>
                  <span className="text-xs font-semibold text-slate-300 block">Equilibrium pH</span>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    Buffer Capacity (β): {(advancedResult.totalBufferCapacity ?? (advancedResult as any).bufferCapacity ?? 0).toFixed(4)}
                  </span>
                </div>
                <span className="text-3xl font-black text-teal-400 font-mono">
                  {(advancedResult.finalPH ?? (advancedResult as any).pH ?? 7).toFixed(2)}
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Solver Converged:</span>
                  <span className={(advancedResult as any).solverConverged !== false ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                    {(advancedResult as any).solverConverged !== false ? "Yes (Zero Residual)" : "Fallback Used"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Buffer Capacity (β):</span>
                  <span className="font-mono text-teal-300">{(advancedResult.totalBufferCapacity ?? (advancedResult as any).bufferCapacity ?? 0).toFixed(4)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Excess Strong Base:</span>
                  <span className="font-mono text-teal-300">{(advancedResult.excessStrongBase ?? 0).toFixed(6)} mol</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Excess Strong Acid:</span>
                  <span className="font-mono text-teal-300">{(advancedResult.excessStrongAcid ?? 0).toFixed(6)} mol</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Active Buffers Detected:</span>
                  <span className="font-bold text-teal-400">{advancedResult.activeBuffers?.length ?? 0}</span>
                </div>
              </div>

              {/* Enzyme Warning if applicable */}
              {advancedResult.enzymeWarning && advancedResult.enzymeWarningMsg && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs">
                  {advancedResult.enzymeWarningMsg}
                </div>
              )}

              {/* Neutralization Summary Log */}
              {(advancedResult.neutralizationSummary || (advancedResult as any).notes) && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Audit Log:</span>
                  <ul className="space-y-1">
                    {(advancedResult.neutralizationSummary || (advancedResult as any).notes || []).map((note: string, idx: number) => (
                      <li key={idx} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                        <CheckCircle size={12} className="text-teal-400 shrink-0 mt-0.5" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>

          {/* TASK 4: HIGH NEUTRALIZATION SENSITIVITY WARNING */}
          {isHighSensitivity && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-amber-200 shadow-md">
              <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <span>⚠ High Neutralization Sensitivity</span>
                </h4>
                <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                  Small additions near equivalence (pH 4.0 – 10.0) produce steep logarithmic pH shifts. Add chemical additions slowly, mix thoroughly, and allow thermal & chemical equilibrium before recalculating.
                </p>
              </div>
            </div>
          )}

          {/* TASK 3: SMART NEUTRALIZATION ASSISTANT CARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity size={18} className="text-teal-400" />
                  Smart Neutralization Operator Assistant
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time chemical adjustment recommendations for laboratory & production operators
                </p>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-slate-400">Target pH:</span>
                <span className="text-xs font-mono font-bold text-teal-400">{targetPH.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Current pH */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Current pH</span>
                <div className="text-2xl font-black text-white font-mono">{currentpH.toFixed(2)}</div>
                <span className="text-[11px] text-slate-400 block">
                  Delta: {Math.abs(currentpH - targetPH).toFixed(2)} pH units
                </span>
              </div>

              {/* Status */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Formulation Status</span>
                <div>
                  {isAcidExcess && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
                      Acid Excess
                    </span>
                  )}
                  {isAlkaliExcess && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold">
                      Alkali Excess
                    </span>
                  )}
                  {isNeutral && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                      Neutralized
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 block font-mono">
                  {isAcidExcess ? `${excessAcid.toFixed(6)} mol H+` : isAlkaliExcess ? `${excessBase.toFixed(6)} mol OH-` : 'Equilibrium Met'}
                </span>
              </div>

              {/* Remaining Acid */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Remaining Acid</span>
                <div className="text-sm font-bold text-rose-300 font-mono">
                  {excessAcid.toFixed(6)} mol
                </div>
                <span className="text-[11px] text-slate-400 block">
                  {isAcidExcess ? `≡ ${(excessAcid * 362.766).toFixed(3)} g LABSA 90%` : '0.000 g'}
                </span>
              </div>

              {/* Remaining Base */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Remaining Base</span>
                <div className="text-sm font-bold text-purple-300 font-mono">
                  {excessBase.toFixed(6)} mol
                </div>
                <span className="text-[11px] text-slate-400 block">
                  {isAlkaliExcess ? `≡ ${(excessBase * 39.9971).toFixed(3)} g NaOH 100%` : '0.000 g'}
                </span>
              </div>
            </div>

            {/* Recommended Addition & Operator Instructions */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Scale size={16} />
                  Recommended Chemical Adjustment
                </span>
                <span className="text-xs font-mono font-bold text-white bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                  {isAcidExcess && `Add ${recNaOHGrams.toFixed(3)} g NaOH 100% (${recNaOHKg.toFixed(6)} kg)`}
                  {isAlkaliExcess && `Add ${recLABSAGrams.toFixed(3)} g LABSA 90% (${recLABSAKg.toFixed(6)} kg)`}
                  {isNeutral && 'No Chemical Adjustment Required'}
                </span>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed space-y-1">
                <span className="font-bold text-slate-400 block">Operator Instructions:</span>
                {isAcidExcess && (
                  <p>
                    1. Weigh exactly <strong className="text-teal-300">{recNaOHGrams.toFixed(3)} g</strong> (or {recNaOHKg.toFixed(6)} kg) of 100% NaOH (or active liquid lye equivalent).<br />
                    2. Add slowly to the mixing vessel under constant mechanical agitation.<br />
                    3. Mix thoroughly for 10–15 minutes to reach complete reaction and thermal equilibrium.<br />
                    4. Re-calculate or test with a calibrated laboratory pH probe.
                  </p>
                )}
                {isAlkaliExcess && (
                  <p>
                    1. Weigh exactly <strong className="text-teal-300">{recLABSAGrams.toFixed(3)} g</strong> (or {recLABSAKg.toFixed(6)} kg) of 90% LABSA sulfonic acid.<br />
                    2. Add slowly under high-shear agitation.<br />
                    3. Allow complete neutralization reaction.<br />
                    4. Recalculate pH or verify with lab probe.
                  </p>
                )}
                {isNeutral && (
                  <p>
                    Formulation is within target specification (pH 6.80 – 7.20). Proceed with secondary additions (preservatives, enzymes, fragrance, or viscosity modifiers).
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* TASK 5: PRODUCTION WORKFLOW PANEL */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-xl space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Gauge size={16} className="text-indigo-400" />
              Production Workflow Pipeline
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1: Current Situation */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 relative">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Step 1 • Current Situation
                </div>
                <div className="text-sm font-extrabold text-white mt-1">
                  {isAcidExcess && `Acid Excess (pH ${currentpH.toFixed(2)})`}
                  {isAlkaliExcess && `Alkali Excess (pH ${currentpH.toFixed(2)})`}
                  {isNeutral && `Neutralized (pH ${currentpH.toFixed(2)})`}
                </div>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  {isAcidExcess && `${excessAcid.toFixed(6)} mol H+`}
                  {isAlkaliExcess && `${excessBase.toFixed(6)} mol OH-`}
                  {isNeutral && `0.000000 mol excess`}
                </p>
              </div>

              {/* Step 2: Recommended Action */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 relative">
                <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                  Step 2 • Recommended Action
                </div>
                <div className="text-sm font-extrabold text-indigo-300 mt-1">
                  {isAcidExcess && `Add ${recNaOHGrams.toFixed(3)} g NaOH`}
                  {isAlkaliExcess && `Add ${recLABSAGrams.toFixed(3)} g LABSA`}
                  {isNeutral && `No Action Required`}
                </div>
                <p className="text-xs text-indigo-400/80 font-mono mt-1">
                  {isAcidExcess && `(${recNaOHKg.toFixed(6)} kg 100% NaOH)`}
                  {isAlkaliExcess && `(${recLABSAKg.toFixed(6)} kg 90% LABSA)`}
                  {isNeutral && `Target Specification Met`}
                </p>
              </div>

              {/* Step 3: Expected Result */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Step 3 • Expected Result
                </div>
                <div className="text-sm font-extrabold text-emerald-400 mt-1">
                  Expected pH ≈ 7.00
                </div>
                <p className="text-xs text-emerald-400/80 mt-1">
                  Equilibrium Neutralization
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
