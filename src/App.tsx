import React, { useState, useCallback, useEffect } from 'react';
import { 
  BookOpen, 
  Library, 
  TestTube, 
  Search, 
  Mic, 
  MicOff, 
  Camera, 
  Globe, 
  Sparkles, 
  FlaskConical, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Play, 
  Info,
  RefreshCw,
  Scale,
  Activity,
  Gauge,
  Calculator,
  ClipboardCheck,
  Package,
  FileText,
  PenTool,
  Award,
  Layers,
  Download,
  Smartphone
} from 'lucide-react';

import AIFormulator from './components/AIFormulator';
import ChemicalEncyclopedia from './components/ChemicalEncyclopedia';
import FormulationLibrary from './components/FormulationLibrary';
import RCCalculators from './components/RCCalculators';
import QCOperations from './components/QCOperations';
import InventoryProduction from './components/InventoryProduction';
import DocsLibrary from './components/DocsLibrary';
import LabNotebook from './components/LabNotebook';
import MathTestSuite from './components/MathTestSuite';

import { IngredientInput, PHAdvancedResult, PHSimpleResult, ActiveFormulaState } from './types';
import { INGREDIENT_DATABASE, calculatePHAdvanced, calculatePHSimple } from './utils/pHEngine';

const AVAILABLE_INGREDIENTS = Object.keys(INGREDIENT_DATABASE).sort();

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    appTitle: "Detergent Formula Expert",
    appSubtitle: "AI Formulation & Scientific R&D Laboratory",
    formulaExpert: "Formula Expert",
    formulaExpertDesc: "Formulation analysis, ingredient balancing & verification",
    formulaLibrary: "Formula Library",
    formulaLibraryDesc: "Verified standard manufacturing recipes & batch scaling",
    chemicalEncyclopedia: "Chemical Encyclopedia",
    chemicalEncyclopediaDesc: "Interactive raw materials & chemical database",
    phEngine: "pH Engine",
    phEngineDesc: "Newton-Raphson charge balance & buffer capacity",
    calculators: "Calculators",
    calculatorsDesc: "HLB, active matter, neutralization & dilutions",
    qcOperations: "QC & SOPs",
    qcOperationsDesc: "Quality control tests, titration & stability",
    inventory: "Inventory",
    inventoryDesc: "Raw material stock & batch deduction logs",
    docs: "Docs & SDS",
    docsDesc: "Technical bulletins & compliance datasheets",
    labNotebook: "Lab Notebook",
    labNotebookDesc: "Trial observation journal & batch history",
    validation: "Math Test Suite",
    validationDesc: "Real-time scientific algorithm verification",
    searchPlaceholder: "Search raw materials, formulas, CAS numbers, or INCI...",
    lblFormula: "Batch Name",
    voiceSearch: "Voice Search",
    scanLabel: "Scan Label / Camera",
    langName: "English"
  },
  hi: {
    appTitle: "Detergent Formula Expert",
    appSubtitle: "औद्योगिक फॉर्मूलेशन और R&D प्लेटफॉर्म",
    formulaExpert: "फॉर्मूला विशेषज्ञ",
    formulaExpertDesc: "फॉर्मूलेशन विश्लेषण, घटक संतुलन और वैज्ञानिक सत्यापन",
    formulaLibrary: "फॉर्मूला लाइब्रेरी",
    formulaLibraryDesc: "सत्यापित मानक निर्माण व्यंजन और बैच स्केलिंग",
    chemicalEncyclopedia: "रासायनिक ज्ञानकोश",
    chemicalEncyclopediaDesc: "आवश्यक डिटर्जेंट कच्चे माल का ज्ञानकोश",
    phEngine: "pH इंजन",
    phEngineDesc: "न्यूटन-राफसन चार्ज संतुलन और बफर क्षमता हलकर्ता",
    calculators: "कैलकुलेटर",
    calculatorsDesc: "HLB, एक्टिव मैटर, उदासीनीकरण",
    qcOperations: "QC और SOP",
    qcOperationsDesc: "गुणवत्ता नियंत्रण और स्थिरता परीक्षण",
    inventory: "इन्वेंट्री",
    inventoryDesc: "कच्चा माल स्टॉक और उत्पादन लॉग",
    docs: "दस्तावेज़",
    docsDesc: "तकनीकी बुलेटिन और SDS",
    labNotebook: "लैब नोटबुक",
    labNotebookDesc: "प्रयोग और टिप्पणियां",
    validation: "सत्यापन",
    validationDesc: "एल्गोरिदम परीक्षण",
    searchPlaceholder: "कच्चा माल, फॉर्मूला, CAS नंबर खोजें...",
    lblFormula: "बैच का नाम",
    voiceSearch: "आवाज खोज",
    scanLabel: "स्कैन करें / कैमरा",
    langName: "हिन्दी"
  },
  mr: {
    appTitle: "Detergent Formula Expert",
    appSubtitle: "औद्योगिक फॉर्म्युलेशन आणि R&D प्लॅटफॉर्म",
    formulaExpert: "फॉर्म्युला तज्ञ",
    formulaExpertDesc: "फॉर्म्युलेशन विश्लेषण, घटक संतुलन आणि पडताळणी",
    formulaLibrary: "फॉर्म्युला लायब्ररी",
    formulaLibraryDesc: "प्रमाणित उत्पादन पाककृती",
    chemicalEncyclopedia: "रासायनिक ज्ञानकोश",
    chemicalEncyclopediaDesc: "कच्च्या मालाचा डेटाबेस",
    phEngine: "pH इंजिन",
    phEngineDesc: "न्यूटन-राफसन सॉल्व्हर",
    calculators: "कॅल्क्युलेटर",
    calculatorsDesc: "HLB आणि Active Matter",
    qcOperations: "QC ऑपरेशन्स",
    qcOperationsDesc: "गुणवत्ता चाचणी",
    inventory: "इन्व्हेंटरी",
    inventoryDesc: "कच्चा माल साठा",
    docs: "कागदपत्रे",
    docsDesc: "तांत्रिक दस्तऐवज",
    labNotebook: "लॅब नोंदवही",
    labNotebookDesc: "प्रयोग नोंदी",
    validation: "चाचणी संच",
    validationDesc: "वैज्ञानिक पडताळणी",
    searchPlaceholder: "कच्चा माल, फॉर्म्युला, CAS शोधा...",
    lblFormula: "बॅचचे नाव",
    voiceSearch: "आवाज शोध",
    scanLabel: "स्कॅन करा / कॅमेरा",
    langName: "मराठी"
  },
  gu: {
    appTitle: "Detergent Formula Expert",
    appSubtitle: "ઔદ્યોગિક ફોર્મ્યુલેશન અને R&D લેબોરેટરી",
    formulaExpert: "ફોર્મ્યુલા નિષ્ણાત",
    formulaExpertDesc: "ફોર્મ્યુલેશન વિશ્લેષણ, ઘટક સંતુલન અને વૈજ્ઞાનિક ચકાસણી",
    formulaLibrary: "ફોર્મ્યુલા લાઇબ્રેરી",
    formulaLibraryDesc: "પ્રમાણિત ઉત્પાદન રેસિપી અને બેચ સ્કેલિંગ",
    chemicalEncyclopedia: "રાસાયણિક જ્ઞાનકોશ",
    chemicalEncyclopediaDesc: "આવશ્યક કાચા માલનો ડેટાબેઝ",
    phEngine: "pH એન્જિન",
    phEngineDesc: "ન્યૂટન-રાફસન ચાર્જ બેલેન્સ સોલ્વર",
    calculators: "કેલ્ક્યુલેટર",
    calculatorsDesc: "HLB, એક્ટિવ મેટર, તટસ્થીકરણ અને પાતળું કરવું",
    qcOperations: "QC અને SOP",
    qcOperationsDesc: "ગુણવત્તા નિયંત્રણ અને સ્થિરતા પરીક્ષણ",
    inventory: "ઇન્વેન્ટરી",
    inventoryDesc: "કાચો માલ સ્ટોક અને ઉત્પાદન લોગ",
    docs: "દસ્તાવેજો અને SDS",
    docsDesc: "તકનીકી બુલેટિન અને સલામતી શીટ્સ",
    labNotebook: "લેબ નોટબુક",
    labNotebookDesc: "પ્રયોગ અને અવલોકન નોંધો",
    validation: "ગણિત પરીક્ષણ",
    validationDesc: "વૈજ્ઞાનિક અલ્ગોરિધમ ચકાસણી",
    searchPlaceholder: "કાચો માલ, ફોર્મ્યુલા, CAS નંબર શોધો...",
    lblFormula: "બેચ નામ",
    voiceSearch: "અવાજ શોધ",
    scanLabel: "સ્કેન / કૅમેરો",
    langName: "ગુજરાતી"
  },
  ur: {
    appTitle: "Detergent Formula Expert",
    appSubtitle: "صنعتی فارمولیشن اور سائنسی R&D لیبارٹری",
    formulaExpert: "فارمولا ماہر",
    formulaExpertDesc: "فارمولیشن تجزیہ، کیمیائی توازن اور تصدیق",
    formulaLibrary: "فارمولا لائبریری",
    formulaLibraryDesc: "تصدیق شدہ معیاری مینوفیکچرنگ ترکیبیں",
    chemicalEncyclopedia: "کیمیائی انسائیکلوپیڈیا",
    chemicalEncyclopediaDesc: "خام مال اور کیمیکل ڈیٹا بیس",
    phEngine: "پی ایچ انجن",
    phEngineDesc: "نیوٹن-رافسن چارج بیلنس اور بفر صلاحیت",
    calculators: "کیلکولیٹر",
    calculatorsDesc: "HLB، ایکٹو میٹر، نیوٹرلائزیشن",
    qcOperations: "کوالٹی کنٹرول اور SOPs",
    qcOperationsDesc: "معیار کی جانچ اور استحکام ٹیسٹ",
    inventory: "انوینٹری",
    inventoryDesc: "خام مال کا اسٹاک اور بیچ ریکارڈ",
    docs: "دستاویزات اور SDS",
    docsDesc: "تکنیکی معلومات اور حفاظتی ڈیٹا شیٹس",
    labNotebook: "لیب نوٹ بک",
    labNotebookDesc: "تجربات کے مشاہدات کا ریکارڈ",
    validation: "سائنسی تصدیق",
    validationDesc: "الگورتھم ٹیسٹ سوٹ",
    searchPlaceholder: "خام مال، فارمولا، CAS نمبر تلاش کریں...",
    lblFormula: "بیچ کا نام",
    voiceSearch: "آواز سے تلاش",
    scanLabel: "اسکین لیبل / کیمرہ",
    langName: "اردو"
  },
  bn: {
    appTitle: "Detergent Formula Expert",
    appSubtitle: "শিল্প ফর্মুলেশন এবং বৈজ্ঞানিক R&D পরীক্ষাগার",
    formulaExpert: "ফর্মুলা বিশেষজ্ঞ",
    formulaExpertDesc: "ফর্মুলেশন বিশ্লেষণ, উপাদান ভারসাম্য এবং যাচাইকরণ",
    formulaLibrary: "ফর্মুলা লাইব্রেরি",
    formulaLibraryDesc: "যাচাইকৃত স্ট্যান্ডার্ড ম্যানুফ্যাকচারিং রেসিপি",
    chemicalEncyclopedia: "রাসায়নিক বিশ্বকোষ",
    chemicalEncyclopediaDesc: "কাঁচামাল এবং রাসায়নিক ডাটাবেস",
    phEngine: "pH ইঞ্জিন",
    phEngineDesc: "নিউটন-র‍্যাফসন চার্জ ব্যালেন্স সমাধানকারী",
    calculators: "ক্যালকুলেটর",
    calculatorsDesc: "HLB, অ্যাক্টিভ ম্যাটার ও নিউট্রালাইজেশন",
    qcOperations: "QC ও SOPs",
    qcOperationsDesc: "মান নিয়ন্ত্রণ এবং স্থিতিশীলতা পরীক্ষা",
    inventory: "ইনভেন্টরি",
    inventoryDesc: "কাঁচামালের স্টক ও ব্যাচ ট্র্যাকিং",
    docs: "ডকুমেন্টস ও SDS",
    docsDesc: "কারিগরি বুলেটিন এবং সুরক্ষা ডেটাশিট",
    labNotebook: "ল্যাব নোটবুক",
    labNotebookDesc: "পরীক্ষার পর্যবেক্ষণ ও নোট",
    validation: "বৈজ্ঞানিক যাচাই",
    validationDesc: "অ্যালগরিদম টেস্ট স্যুট",
    searchPlaceholder: "কাঁচামাল, ফর্মুলা, CAS নম্বর অনুসন্ধান...",
    lblFormula: "ব্যাচের নাম",
    voiceSearch: "ভয়েস অনুসন্ধান",
    scanLabel: "স্ক্যান লেবেল / ক্যামেরা",
    langName: "বাংলা"
  },
  ta: {
    appTitle: "Detergent Formula Expert",
    appSubtitle: "தொழில்துறை ஃபார்முலேஷன் மற்றும் R&D ஆய்வகம்",
    formulaExpert: "ஃபார்முலா நிபுணர்",
    formulaExpertDesc: "ஃபார்முலேஷன் பகுப்பாய்வு மற்றும் சரிபார்ப்பு",
    formulaLibrary: "ஃபார்முலா நூலகம்",
    formulaLibraryDesc: "சரிபார்க்கப்பட்ட நிலையான செய்முறைகள்",
    chemicalEncyclopedia: "வேதியியல் கலைக்களஞ்சியம்",
    chemicalEncyclopediaDesc: "மூலப்பொருட்கள் மற்றும் வேதியியல் தரவுத்தளம்",
    phEngine: "pH எஞ்சின்",
    phEngineDesc: "நியூட்டன்-ராப்சன் சமநிலை தீர்வு",
    calculators: "கால்குலேட்டர்கள்",
    calculatorsDesc: "HLB, ஆக்டிவ் மேட்டர் மற்றும் நடுநிலையாக்கல்",
    qcOperations: "தரக்கட்டுப்பாடு & SOPs",
    qcOperationsDesc: "தர பரிசோதனை மற்றும் நிலைப்புத்தன்மை",
    inventory: "சரக்கு இருப்பு",
    inventoryDesc: "மூலப்பொருள் இருப்பு மற்றும் உற்பத்தி பதிவு",
    docs: "ஆவணங்கள் & SDS",
    docsDesc: "தொழில்நுட்ப ஆவணங்கள் மற்றும் பாதுகாப்பு தாள்கள்",
    labNotebook: "ஆய்வக குறிப்பேடு",
    labNotebookDesc: "சோதனை அவதானிப்புகள் மற்றும் பதிவுகள்",
    validation: "கணித சரிபார்ப்பு",
    validationDesc: "அல்காரிதம் சோதனை தொகுப்பு",
    searchPlaceholder: "மூலப்பொருட்கள், சூத்திரங்கள், CAS எண் தேடுக...",
    lblFormula: "தொகுதி பெயர்",
    voiceSearch: "குரல் தேடல்",
    scanLabel: "ஸ்கேன் / கேமரா",
    langName: "தமிழ்"
  },
  te: {
    appTitle: "Detergent Formula Expert",
    appSubtitle: "పారిశ్రామిక ఫార్ములేషన్ మరియు R&D ప్రయోగశాల",
    formulaExpert: "ఫార్ములా నిపుణుడు",
    formulaExpertDesc: "ఫార్ములేషన్ విశ్లేషణ మరియు శాస్త్రీయ ధృవీకరణ",
    formulaLibrary: "ఫార్ములా లైబ్రరీ",
    formulaLibraryDesc: "ప్రామాణిక తయారీ వంటకాలు మరియు బ్యాచ్ స్కేలింగ్",
    chemicalEncyclopedia: "రసాయన ఎన్సైక్లోపీడియా",
    chemicalEncyclopediaDesc: "ముడి పదార్థాలు మరియు రసాయన డేటాబేస్",
    phEngine: "pH ఇంజిన్",
    phEngineDesc: "న్యూటన్-రాఫ్సన్ ఛార్జ్ బ్యాలెన్స్ పరిష్కరిణి",
    calculators: "క్యాలిక్యులేటర్లు",
    calculatorsDesc: "HLB, యాక్టివ్ మ్యాటర్ మరియు తటస్థీకరణ",
    qcOperations: "QC మరియు SOPలు",
    qcOperationsDesc: "నాణ్యత నియంత్రణ మరియు స్థిరత్వ పరీక్షలు",
    inventory: "ఇన్వెంటరీ",
    inventoryDesc: "ముడి పదార్థాల నిల్వ మరియు బ్యాచ్ లాగ్‌లు",
    docs: "డాక్యుమెంట్లు & SDS",
    docsDesc: "సాంకేతిక బులెటిన్లు మరియు భద్రతా డేటాషీట్లు",
    labNotebook: "ల్యాబ్ నోట్‌బుక్",
    labNotebookDesc: "ప్రయోగ పరిశీలనలు మరియు బ్యాచ్ రికార్డులు",
    validation: "గణిత ధృవీకరణ",
    validationDesc: "అల్గోరిథం టెస్ట్ సూట్",
    searchPlaceholder: "ముడి పదార్థాలు, ఫార్ములాలు, CAS నంబర్ శోధించండి...",
    lblFormula: "బ్యాచ్ పేరు",
    voiceSearch: "వాయిస్ శోధన",
    scanLabel: "స్కాన్ / కెమెరా",
    langName: "తెలుగు"
  },
  es: {
    appTitle: "Detergent Formula Expert",
    appSubtitle: "Laboratorio de Formulación y R&D de Detergentes",
    formulaExpert: "Experto en Fórmulas",
    formulaExpertDesc: "Análisis y balance científico de fórmulas",
    formulaLibrary: "Biblioteca de Fórmulas",
    formulaLibraryDesc: "Recetas maestras verificadas",
    chemicalEncyclopedia: "Enciclopedia Química",
    chemicalEncyclopediaDesc: "Base de datos de materias primas",
    phEngine: "Motor de pH",
    phEngineDesc: "Equilibrio Newton-Raphson",
    calculators: "Calculadoras",
    calculatorsDesc: "HLB, materia activa y neutralización",
    qcOperations: "Control de Calidad",
    qcOperationsDesc: "Protocolos y pruebas de estabilidad",
    inventory: "Inventario",
    inventoryDesc: "Stock y deducciones por lote",
    docs: "Documentos y SDS",
    docsDesc: "Hojas de seguridad y normativas",
    labNotebook: "Cuaderno de Lab",
    labNotebookDesc: "Registro de ensayos",
    validation: "Validación Matemática",
    validationDesc: "Suite de pruebas científicas",
    searchPlaceholder: "Buscar materias primas, fórmulas, CAS...",
    lblFormula: "Nombre del Lote",
    voiceSearch: "Búsqueda por Voz",
    scanLabel: "Escanear / Cámara",
    langName: "Español"
  },
  fr: {
    appTitle: "Detergent Formula Expert",
    appSubtitle: "Laboratoire R&D et Formulation de Détergents",
    formulaExpert: "Expert en Formules",
    formulaExpertDesc: "Analyse et équilibrage de formulations",
    formulaLibrary: "Bibliothèque de Formules",
    formulaLibraryDesc: "Recettes standard de fabrication",
    chemicalEncyclopedia: "Encyclopédie Chimique",
    chemicalEncyclopediaDesc: "Matières premières et propriétés",
    phEngine: "Moteur de pH",
    phEngineDesc: "Solveur d'équilibre Newton-Raphson",
    calculators: "Calculateurs",
    calculatorsDesc: "HLB, matière active et dilution",
    qcOperations: "Contrôle Qualité",
    qcOperationsDesc: "Protocoles et titrages",
    inventory: "Inventaire",
    inventoryDesc: "Gestion des stocks et lots",
    docs: "Documentation",
    docsDesc: "Fiches de sécurité et normes",
    labNotebook: "Cahier de Labo",
    labNotebookDesc: "Journal des essais",
    validation: "Suite de Validation",
    validationDesc: "Tests scientifiques",
    searchPlaceholder: "Rechercher matières premières, formules, CAS...",
    lblFormula: "Nom du Lot",
    voiceSearch: "Recherche Vocale",
    scanLabel: "Scanner / Caméra",
    langName: "Français"
  },
  ar: {
    appTitle: "Detergent Formula Expert",
    appSubtitle: "مختبر التركيب والتطوير الصناعي للمنظفات",
    formulaExpert: "خبير التركيبات",
    formulaExpertDesc: "تحليل التركيب وموازنة المكونات",
    formulaLibrary: "مكتبة التركيبات",
    formulaLibraryDesc: "وصفات تصنيع قياسية",
    chemicalEncyclopedia: "الموسوعة الكيميائية",
    chemicalEncyclopediaDesc: "قاعدة بيانات المواد الخام",
    phEngine: "محرك الرقم الهيدروجيني",
    phEngineDesc: "حاسب توازن الشحنة",
    calculators: "الحاسبات",
    calculatorsDesc: "حساب المادة الفعالة و HLB",
    qcOperations: "مراقبة الجودة",
    qcOperationsDesc: "فحوصات الجودة",
    inventory: "المخزون",
    inventoryDesc: "مخزون المواد الخام",
    docs: "المستندات",
    docsDesc: "صحائف السلامة",
    labNotebook: "سجل المختبر",
    labNotebookDesc: "ملاحظات التجارب",
    validation: "التحقق الرياضي",
    validationDesc: "اختبارات الحسابات",
    searchPlaceholder: "ابحث عن المواد الخام، التركيبات، رقم CAS...",
    lblFormula: "اسم الدفعة",
    voiceSearch: "البحث الصوتي",
    scanLabel: "مسح الضوئي / الكاميرا",
    langName: "العربية"
  },
  zh: {
    appTitle: "Detergent Formula Expert",
    appSubtitle: "AI 工业配方与科学研发实验室",
    formulaExpert: "配方专家",
    formulaExpertDesc: "配方物理化学分析与成分平衡",
    formulaLibrary: "配方库",
    formulaLibraryDesc: "标准生产配方与批次缩放",
    chemicalEncyclopedia: "化学百科全书",
    chemicalEncyclopediaDesc: "原料与化学品数据库",
    phEngine: "pH 引擎",
    phEngineDesc: "牛顿-拉夫逊电荷平衡求解器",
    calculators: "计算器",
    calculatorsDesc: "HLB、活性物与中和计算",
    qcOperations: "质量控制",
    qcOperationsDesc: "滴定与稳定性测试规程",
    inventory: "原料库存",
    inventoryDesc: "库存管理与批次扣减",
    docs: "技术文档",
    docsDesc: "安全数据表与法规指南",
    labNotebook: "实验室日志",
    labNotebookDesc: "试验记录与批次跟踪",
    validation: "科学验证",
    validationDesc: "算法测试套件",
    searchPlaceholder: "搜索原料、配方、CAS 号或 INCI...",
    lblFormula: "批次名称",
    voiceSearch: "语音搜索",
    scanLabel: "扫描标签 / 摄像头",
    langName: "中文"
  }
};

export type TabType = 
  | 'formula_expert' 
  | 'formula_library' 
  | 'chemical_encyclopedia' 
  | 'ph_engine'
  | 'calculators'
  | 'qc_operations'
  | 'inventory'
  | 'docs_library'
  | 'lab_notebook'
  | 'validation_suite';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('formula_expert');
  const [lang, setLang] = useState<string>('en');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  // Capture PWA beforeinstallprompt event for 1-click install on any mobile/desktop browser
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert("To install this app on your phone:\n\n1. In Chrome, tap the 3 dots (⋮) in the top-right corner.\n2. Tap 'Add to Home screen' or 'Install App'.\n\nOr click 'DOWNLOAD APK' to install the offline Android app package!");
    }
  };

  // Cross-component selected IDs & Single Source of Truth Active Formula State
  const [selectedChemicalId, setSelectedChemicalId] = useState<string | null>(null);
  const [selectedFormulaId, setSelectedFormulaId] = useState<string | null>(null);
  const [activeFormula, setActiveFormula] = useState<ActiveFormulaState | null>(() => {
    try {
      const saved = localStorage.getItem("aiformulator_formulationResult");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && Array.isArray(parsed.ingredients) && parsed.ingredients.length > 0) {
          const rawIngs = parsed.ingredients;
          const normalizedIngs = rawIngs.map((ing: any, idx: number) => {
            const pct = ing.percentage ?? ing.percent ?? ing.percentageInFormula ?? 0;
            const activePct = ing.activeMatterPct ?? ing.activePercent ?? ing.purity ?? ing.activeMatterPurity;
            const hlbVal = ing.hlbValue ?? ing.hlb;
            return {
              ...ing,
              id: ing.id || `ing-${idx}`,
              name: ing.name || `Ingredient ${idx + 1}`,
              percentage: Number(pct),
              percent: Number(pct),
              activeMatterPct: activePct !== undefined && activePct !== null ? Number(activePct) : undefined,
              activePercent: activePct !== undefined && activePct !== null ? Number(activePct) : undefined,
              hlbValue: hlbVal !== undefined && hlbVal !== null ? Number(hlbVal) : undefined,
              hlb: hlbVal !== undefined && hlbVal !== null ? Number(hlbVal) : undefined,
              costPerKg: ing.costPerKg !== undefined ? Number(ing.costPerKg) : 0,
              role: ing.role || ing.function || 'Component',
            };
          });
          return {
            id: parsed.id || `active-${Date.now()}`,
            name: parsed.name || parsed.formulaName || "Active Formula",
            productType: parsed.productType || "Liquid Laundry Detergent",
            grade: parsed.grade || "Standard",
            targetCost: parsed.targetCost !== undefined ? Number(parsed.targetCost) : 0,
            batchSize: parsed.batchSize !== undefined ? Number(parsed.batchSize) : (parsed.batchSizeKg !== undefined ? Number(parsed.batchSizeKg) : 100),
            batchSizeKg: parsed.batchSizeKg !== undefined ? Number(parsed.batchSizeKg) : (parsed.batchSize !== undefined ? Number(parsed.batchSize) : 100),
            ingredients: normalizedIngs,
            isDraft: parsed.isDraft ?? true,
            status: parsed.status || "Draft",
            notes: parsed.notes,
            category: parsed.category,
            targetPH: parsed.targetPH !== undefined ? Number(parsed.targetPH) : undefined
          };
        }
      }
    } catch (e) {
      console.error("Failed to hydrate activeFormula from localStorage in App.tsx:", e);
    }
    return null;
  });

  // Persist activeFormula changes to localStorage SSOT recovery storage
  useEffect(() => {
    try {
      if (activeFormula && Array.isArray(activeFormula.ingredients) && activeFormula.ingredients.length > 0) {
        localStorage.setItem("aiformulator_formulationResult", JSON.stringify(activeFormula));
      } else if (activeFormula === null) {
        localStorage.removeItem("aiformulator_formulationResult");
      }
    } catch (e) {
      console.error("Failed to persist activeFormula to localStorage in App.tsx:", e);
    }
  }, [activeFormula]);

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

  // Primary 4 Core Workstations
  const PRIMARY_NAV = [
    { 
      id: 'formula_expert' as TabType, 
      label: t.formulaExpert, 
      desc: "Create • Analyze • Verify",
      icon: FlaskConical, 
      glow: "from-blue-500/20 to-cyan-500/20",
      accent: "text-cyan-400",
      badge: "CORE"
    },
    { 
      id: 'formula_library' as TabType, 
      label: t.formulaLibrary, 
      desc: "Master Recipes & SOPs",
      icon: Library, 
      glow: "from-purple-500/20 to-indigo-500/20",
      accent: "text-purple-400",
      badge: "RECIPES"
    },
    { 
      id: 'chemical_encyclopedia' as TabType, 
      label: t.chemicalEncyclopedia, 
      desc: "Raw Materials & CAS Data",
      icon: BookOpen, 
      glow: "from-teal-500/20 to-emerald-500/20",
      accent: "text-teal-400",
      badge: "DATABASE"
    },
    { 
      id: 'ph_engine' as TabType, 
      label: t.phEngine, 
      desc: "Newton-Raphson Solver",
      icon: TestTube, 
      glow: "from-amber-500/20 to-orange-500/20",
      accent: "text-amber-400",
      badge: "EQUILIBRIUM"
    },
  ];

  // Secondary Scientific Tool Suites
  const SECONDARY_NAV = [
    { id: 'calculators' as TabType, label: t.calculators, icon: Calculator, accent: "text-blue-400" },
    { id: 'qc_operations' as TabType, label: t.qcOperations, icon: ClipboardCheck, accent: "text-emerald-400" },
    { id: 'inventory' as TabType, label: t.inventory, icon: Package, accent: "text-cyan-400" },
    { id: 'docs_library' as TabType, label: t.docs, icon: FileText, accent: "text-indigo-400" },
    { id: 'lab_notebook' as TabType, label: t.labNotebook, icon: PenTool, accent: "text-rose-400" },
    { id: 'validation_suite' as TabType, label: t.validation, icon: Award, accent: "text-purple-400" },
  ];

  return (
    <div className={`min-h-screen w-full bg-[#070b18] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
      
      {/* GLOBAL APPLICATION HEADER (Premium Dark Laboratory SaaS Design) */}
      <header className="bg-[#0b1020]/95 backdrop-blur-md border-b border-slate-800/80 shrink-0 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-3 sticky top-0 z-40">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-blue-500 via-purple-500 to-amber-500" />
        
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none shrink-0" onClick={() => setActiveTab('formula_expert')}>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 p-[1.5px] shadow-lg shadow-cyan-500/20 shrink-0">
            <div className="w-full h-full bg-[#0b1020] rounded-[10px] flex items-center justify-center">
              <FlaskConical size={20} className="text-cyan-400" />
            </div>
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm sm:text-base tracking-tight text-white whitespace-nowrap bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                Detergent Formula Expert
              </span>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 font-mono hidden xs:inline-block shadow-xs">
                PRO R&D LAB
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:block truncate max-w-xs">
              {t.appSubtitle}
            </span>
          </div>
        </div>

        {/* Center: Search Bar with Voice & OCR */}
        <div className="flex-1 max-w-xs lg:max-w-md relative hidden md:flex items-center gap-2">
          <div className="relative w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-20 py-2 rounded-xl bg-[#131d35] border border-slate-700/70 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition shadow-inner"
            />
            
            {/* Quick Actions inside Search Bar */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 transition cursor-pointer ${isListening ? 'text-red-400 animate-pulse bg-red-950/60 border border-red-500/50' : ''}`}
                title={t.voiceSearch}
              >
                {isListening ? <MicOff size={14} /> : <Mic size={14} />}
              </button>

              <button
                type="button"
                onClick={() => setIsCameraActive(!isCameraActive)}
                className={`p-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-800/60 transition cursor-pointer ${isCameraActive ? 'text-teal-300 bg-teal-950/60 border border-teal-500/50' : ''}`}
                title={t.scanLabel}
              >
                <Camera size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Download APK Button, Active Formula Quick Badge & Language Selector */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {!isInstalled && (
            <button
              id="install-pwa-header-btn"
              type="button"
              onClick={handleInstallPWA}
              className="flex flex-col items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold transition shadow-md shadow-blue-950/40 border border-blue-400/40 group cursor-pointer"
              title="Install Web App on Phone Home Screen (100% Compatible with All Phones)"
            >
              <div className="flex items-center gap-1.5">
                <Smartphone size={14} className="text-blue-200 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] sm:text-xs font-black tracking-wide uppercase whitespace-nowrap">INSTALL APP</span>
              </div>
              <span className="text-[9px] font-normal text-blue-100/90 whitespace-nowrap leading-none mt-0.5">
                Phone & Tablet • 0.3 MB
              </span>
            </button>
          )}

          <a
            id="download-apk-header-btn"
            href="/detergent-formula-expert-release.apk"
            download="detergent-formula-expert-release.apk"
            className="flex flex-col items-center justify-center bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold transition shadow-md shadow-emerald-950/40 border border-emerald-400/40 group cursor-pointer"
            title="Download Detergent Formula Expert Android APK (0.3 MB)"
          >
            <div className="flex items-center gap-1.5">
              <Download size={14} className="text-emerald-200 group-hover:translate-y-0.5 transition-transform" />
              <span className="text-[11px] sm:text-xs font-black tracking-wide uppercase whitespace-nowrap">DOWNLOAD APK</span>
            </div>
            <span className="text-[9px] font-normal text-emerald-100/90 whitespace-nowrap leading-none mt-0.5">
              Offline APK • 0.3 MB
            </span>
          </a>

          {activeFormula && (
            <div 
              onClick={() => setActiveTab('formula_expert')}
              className="hidden lg:flex items-center gap-2 bg-[#131d35] hover:bg-[#182442] border border-cyan-500/40 rounded-xl px-3 py-1.5 text-xs text-cyan-300 cursor-pointer transition shadow-md shadow-cyan-950/40"
              title="Click to view active formula in Formula Expert"
            >
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-bold text-white truncate max-w-[130px]">{activeFormula.name}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-bold">
                {activeFormula.ingredients?.length || 0} ing
              </span>
            </div>
          )}

          <div className="relative flex items-center gap-1.5 bg-[#131d35] hover:bg-[#182442] border border-slate-700/80 rounded-xl px-2.5 sm:px-3 py-1.5 shrink-0 transition">
            <Globe size={14} className="text-cyan-400 shrink-0" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="en" className="bg-[#0e1629] text-white">🇬🇧 English</option>
              <option value="hi" className="bg-[#0e1629] text-white">🇮🇳 हिन्दी (Hindi)</option>
              <option value="gu" className="bg-[#0e1629] text-white">🇮🇳 ગુજરાતી (Gujarati)</option>
              <option value="mr" className="bg-[#0e1629] text-white">🇮🇳 मराठी (Marathi)</option>
              <option value="ur" className="bg-[#0e1629] text-white">🇮🇳 اردو (Urdu)</option>
              <option value="bn" className="bg-[#0e1629] text-white">🇮🇳 বাংলা (Bengali)</option>
              <option value="ta" className="bg-[#0e1629] text-white">🇮🇳 தமிழ் (Tamil)</option>
              <option value="te" className="bg-[#0e1629] text-white">🇮🇳 తెలుగు (Telugu)</option>
              <option value="es" className="bg-[#0e1629] text-white">🇪🇸 Español</option>
              <option value="fr" className="bg-[#0e1629] text-white">🇫🇷 Français</option>
              <option value="ar" className="bg-[#0e1629] text-white">🇸🇦 العربية</option>
              <option value="zh" className="bg-[#0e1629] text-white">🇨🇳 中文</option>
            </select>
          </div>
        </div>
      </header>

      {/* CAMERA / SCANNER MODAL FEEDBACK IF TOGGLED */}
      {isCameraActive && (
        <div className="bg-teal-950/80 border-b border-teal-500/40 px-4 py-2 flex items-center justify-between text-xs text-teal-200 animate-fadeIn shrink-0">
          <div className="flex items-center gap-2">
            <Camera size={16} className="animate-pulse text-teal-400" />
            <span>Label Scanner Active: Point camera at raw material specifications or OCR chemical label</span>
          </div>
          <button onClick={() => setIsCameraActive(false)} className="text-teal-400 hover:text-white font-bold cursor-pointer underline">
            Close Scanner
          </button>
        </div>
      )}

      {/* TOP NAVIGATION SUITE (Dark Modern Cards with Glowing Accents) */}
      <div className="bg-[#0b1020] border-b border-slate-800/80 px-3 sm:px-6 py-3 shrink-0">
        <div className="max-w-7xl mx-auto space-y-3">
          
          {/* Primary 4 Core Workstations Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 cursor-pointer border text-left relative overflow-hidden group ${
                    isActive 
                      ? 'bg-gradient-to-br from-[#152342] to-[#1c2c54] border-cyan-500/70 text-white shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-400/30'
                      : 'bg-[#0f172a]/70 hover:bg-[#131d35] border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-110 ${
                    isActive 
                      ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30' 
                      : 'bg-[#18233a] text-slate-400 border border-slate-700/60'
                  }`}>
                    <Icon size={20} className={isActive ? 'text-white' : item.accent} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs sm:text-sm font-extrabold truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                        {item.label}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                        isActive ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.badge}
                      </span>
                    </div>
                    <span className={`text-[11px] font-medium truncate ${isActive ? 'text-cyan-200/90' : 'text-slate-400'}`}>
                      {item.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Secondary Specialized Tool Suites Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-slate-800/60">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 mr-1 shrink-0 flex items-center gap-1">
              <Layers size={12} className="text-slate-400" /> Specialized R&D Suites:
            </span>
            {SECONDARY_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-300 shadow-xs'
                      : 'bg-[#0e1629] border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-[#131d35] hover:border-slate-700'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-cyan-400' : item.accent} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full p-3 sm:p-5 md:p-6 min-w-0 overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full space-y-6">

          {activeTab === 'formula_expert' && (
            <AIFormulator 
              lang={lang as any} 
              translations={TRANSLATIONS} 
              onFormulaGenerated={(formula) => setActiveFormula(formula)}
              activeFormula={activeFormula}
            />
          )}

          {activeTab === 'formula_library' && (
            <FormulationLibrary 
              lang={lang as any} 
              translations={TRANSLATIONS} 
              selectedFormulaId={selectedFormulaId ?? undefined}
              onSelectFormula={(id: string) => setSelectedFormulaId(id)}
              onSelectActiveFormula={(formula) => {
                setActiveFormula(formula);
                setActiveTab('formula_expert');
              }}
              activeFormula={activeFormula}
            />
          )}

          {activeTab === 'chemical_encyclopedia' && (
            <ChemicalEncyclopedia 
              lang={lang as any} 
              translations={TRANSLATIONS} 
              selectedChemicalId={selectedChemicalId}
              onSelectChemical={(id: string) => setSelectedChemicalId(id)}
            />
          )}

          {activeTab === 'ph_engine' && (
            <PHEngineView activeFormula={activeFormula} />
          )}

          {activeTab === 'calculators' && (
            <RCCalculators 
              lang={lang as any} 
              translations={TRANSLATIONS} 
              activeFormula={activeFormula}
            />
          )}

          {activeTab === 'qc_operations' && (
            <QCOperations />
          )}

          {activeTab === 'inventory' && (
            <InventoryProduction 
              activeFormula={activeFormula}
            />
          )}

          {activeTab === 'docs_library' && (
            <DocsLibrary />
          )}

          {activeTab === 'lab_notebook' && (
            <LabNotebook />
          )}

          {activeTab === 'validation_suite' && (
            <MathTestSuite />
          )}

        </div>
      </main>

    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: Advanced pH Engine UI View (Redesigned in Dark Lab System)
// =========================================================================
function PHEngineView({ activeFormula }: { activeFormula?: ActiveFormulaState | null }) {
  const findMatchingPHEngineIngredient = useCallback((name: string): string => {
    if (INGREDIENT_DATABASE[name]) return name;
    const lower = (name || "").toLowerCase();
    
    const exactMatch = AVAILABLE_INGREDIENTS.find(k => (k || "").toLowerCase() === lower);
    if (exactMatch) return exactMatch;
    
    if (lower.includes('labsa') || lower.includes('sulfonic')) {
      if (lower.includes('96')) {
        const m96 = AVAILABLE_INGREDIENTS.find(k => k.includes('96%'));
        if (m96) return m96;
      }
      const match = AVAILABLE_INGREDIENTS.find(k => (k || "").toLowerCase().includes('labsa'));
      if (match) return match;
    }
    if (lower.includes('sles') || lower.includes('laureth sulfate')) {
      const match = AVAILABLE_INGREDIENTS.find(k => (k || "").toLowerCase().includes('sles'));
      if (match) return match;
    }
    if (lower.includes('caustic') || lower.includes('sodium hydroxide') || lower.includes('naoh')) {
      if (lower.includes('50') || lower.includes('lye')) {
        const m50 = AVAILABLE_INGREDIENTS.find(k => k.includes('50%'));
        if (m50) return m50;
      }
      const match = AVAILABLE_INGREDIENTS.find(k => (k || "").toLowerCase().includes('sodium hydroxide') || (k || "").toLowerCase().includes('caustic') || (k || "").toLowerCase().includes('naoh'));
      if (match) return match;
    }
    if (lower.includes('citric acid')) {
      const match = AVAILABLE_INGREDIENTS.find(k => (k || "").toLowerCase().includes('citric acid'));
      if (match) return match;
    }
    if (lower.includes('sodium citrate') || lower.includes('citrate')) {
      const match = AVAILABLE_INGREDIENTS.find(k => (k || "").toLowerCase().includes('sodium citrate'));
      if (match) return match;
    }
    if (lower.includes('soda ash') || lower.includes('sodium carbonate')) {
      const match = AVAILABLE_INGREDIENTS.find(k => (k || "").toLowerCase().includes('soda ash') || (k || "").toLowerCase().includes('carbonate'));
      if (match) return match;
    }
    if (lower.includes('bicarbonate')) {
      const match = AVAILABLE_INGREDIENTS.find(k => (k || "").toLowerCase().includes('bicarbonate'));
      if (match) return match;
    }
    if (lower.includes('metasilicate')) {
      const match = AVAILABLE_INGREDIENTS.find(k => (k || "").toLowerCase().includes('metasilicate'));
      if (match) return match;
    }
    if (lower.includes('triethanolamine') || (lower.includes('tea') && !lower.includes('tree'))) {
      const match = AVAILABLE_INGREDIENTS.find(k => (k || "").toLowerCase().includes('triethanolamine') || (k || "").toLowerCase().includes('tea'));
      if (match) return match;
    }
    
    const partialMatch = AVAILABLE_INGREDIENTS.find(k => 
      lower.includes((k || "").toLowerCase()) || (k || "").toLowerCase().includes(lower)
    );
    if (partialMatch) return partialMatch;
    
    // Return original name so neutral ingredients remain neutral without turning into caustic soda
    return name || 'Unknown Ingredient';
  }, []);

  const [ingredients, setIngredients] = useState<IngredientInput[]>(() => {
    if (activeFormula && activeFormula.ingredients && activeFormula.ingredients.length > 0) {
      return activeFormula.ingredients.map((ing, idx) => ({
        id: `active-init-${idx}`,
        name: findMatchingPHEngineIngredient(ing.name),
        rawPercent: Number(ing.percentage ?? ing.percent ?? ing.percentageInFormula ?? 0),
        activePercent: ing.activeMatterPct ?? ing.activePercent ?? ing.activeMatterPurity ?? 100,
      }));
    }
    return [
      { id: '1', name: 'Sodium Hydroxide (Caustic Soda Lye 100%)', rawPercent: 0.44 },
      { id: '2', name: 'Linear Alkylbenzene Sulfonic Acid (LABSA 90%)', rawPercent: 4.0 },
    ];
  });
  const [batchSize, setBatchSize] = useState<number>(() => {
    if (activeFormula?.batchSize && activeFormula.batchSize > 0) return activeFormula.batchSize;
    if ((activeFormula as any)?.batchSizeKg && (activeFormula as any).batchSizeKg > 0) return (activeFormula as any).batchSizeKg;
    return 100;
  });
  const [targetPH, _setTargetPH] = useState<number>(7.00);
  const [simpleResult, setSimpleResult] = useState<PHSimpleResult | null>(() => {
    if (activeFormula && activeFormula.ingredients && activeFormula.ingredients.length > 0) {
      const initialIngs = activeFormula.ingredients.map((ing, idx) => ({
        id: `active-init-${idx}`,
        name: findMatchingPHEngineIngredient(ing.name),
        rawPercent: Number(ing.percentage ?? ing.percent ?? ing.percentageInFormula ?? 0),
        activePercent: ing.activeMatterPct ?? ing.activePercent ?? ing.activeMatterPurity ?? 100,
      }));
      const bSize = activeFormula.batchSize || (activeFormula as any).batchSizeKg || 100;
      try {
        return calculatePHSimple(initialIngs, bSize);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [advancedResult, setAdvancedResult] = useState<PHAdvancedResult | null>(() => {
    if (activeFormula && activeFormula.ingredients && activeFormula.ingredients.length > 0) {
      const initialIngs = activeFormula.ingredients.map((ing, idx) => ({
        id: `active-init-${idx}`,
        name: findMatchingPHEngineIngredient(ing.name),
        rawPercent: Number(ing.percentage ?? ing.percent ?? ing.percentageInFormula ?? 0),
        activePercent: ing.activeMatterPct ?? ing.activePercent ?? ing.activeMatterPurity ?? 100,
      }));
      const bSize = activeFormula.batchSize || (activeFormula as any).batchSizeKg || 100;
      try {
        return calculatePHAdvanced(initialIngs, bSize);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liveSync, setLiveSync] = useState<boolean>(true);

  const lastSyncedRef = React.useRef<string>("");

  const handleLoadActiveFormula = useCallback(() => {
    if (!activeFormula || !activeFormula.ingredients || activeFormula.ingredients.length === 0) return;

    const bSize = (activeFormula.batchSize && activeFormula.batchSize > 0)
      ? activeFormula.batchSize
      : ((activeFormula as any)?.batchSizeKg && (activeFormula as any).batchSizeKg > 0)
        ? (activeFormula as any).batchSizeKg
        : 100;

    const importedIngredients: IngredientInput[] = activeFormula.ingredients.map((ing, idx) => ({
      id: `active-${Date.now()}-${idx}`,
      name: findMatchingPHEngineIngredient(ing.name),
      rawPercent: Number(ing.percentage ?? ing.percent ?? ing.percentageInFormula ?? 0),
      activePercent: ing.activeMatterPct ?? ing.activePercent ?? ing.activeMatterPurity ?? 100,
    }));

    setIngredients(importedIngredients);
    setBatchSize(bSize);
    setErrorMessage(null);

    try {
      const simple = calculatePHSimple(importedIngredients, bSize);
      const advanced = calculatePHAdvanced(importedIngredients, bSize);
      setSimpleResult(simple);
      setAdvancedResult(advanced);
    } catch (err: any) {
      console.error('pH Engine Error on active formula auto-sync:', err);
      setSimpleResult(null);
      setAdvancedResult(null);
    }
  }, [activeFormula, findMatchingPHEngineIngredient]);

  // Synchronize PHEngineView with activeFormula automatically when present
  useEffect(() => {
    if (liveSync && activeFormula && activeFormula.ingredients && activeFormula.ingredients.length > 0) {
      const formulaKey = `${activeFormula.id || ''}_${activeFormula.name || ''}_${JSON.stringify(activeFormula.ingredients)}_${activeFormula.batchSize || ''}`;
      if (lastSyncedRef.current !== formulaKey) {
        lastSyncedRef.current = formulaKey;
        handleLoadActiveFormula();
      }
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

  const totalPercent = ingredients.reduce((sum, i) => sum + (i.rawPercent ?? 0), 0);

  const currentpH = advancedResult?.finalPH ?? advancedResult?.pH ?? 7.0;
  const excessAcid = advancedResult?.excessStrongAcid ?? (advancedResult?.details ? Math.max(0, (advancedResult.details.totalAcidMoles || 0) - (advancedResult.details.totalBaseMoles || 0)) : 0);
  const excessBase = advancedResult?.excessStrongBase ?? (advancedResult?.details ? Math.max(0, (advancedResult.details.totalBaseMoles || 0) - (advancedResult.details.totalAcidMoles || 0)) : 0);
  
  const isAcidExcess = excessAcid > 1e-6 || currentpH < 6.80;
  const isAlkaliExcess = excessBase > 1e-6 || currentpH > 7.20;
  const isNeutral = !isAcidExcess && !isAlkaliExcess;

  // Corrective Reagents Configuration
  const [selectedAlkaliReagent, setSelectedAlkaliReagent] = useState<string>("NaOH Flakes (99% / 100%)");
  const [selectedAcidReagent, setSelectedAcidReagent] = useState<string>("LABSA (90% Acid Slurry)");

  const ALKALI_REAGENTS: Record<string, { name: string; mw: number; purity: number; valency: number }> = {
    "NaOH Flakes (99% / 100%)": { name: "NaOH Flakes (99% / 100%)", mw: 39.9971, purity: 0.99, valency: 1 },
    "Caustic Lye NaOH (50% Soln)": { name: "Caustic Lye NaOH (50% Soln)", mw: 39.9971, purity: 0.50, valency: 1 },
    "Caustic Lye NaOH (48% Soln)": { name: "Caustic Lye NaOH (48% Soln)", mw: 39.9971, purity: 0.48, valency: 1 },
    "Potassium Hydroxide KOH (90% Flakes)": { name: "Potassium Hydroxide KOH (90% Flakes)", mw: 56.1056, purity: 0.90, valency: 1 },
    "Soda Ash Light Na2CO3 (99.2%)": { name: "Soda Ash Light Na2CO3 (99.2%)", mw: 105.988, purity: 0.992, valency: 2 },
    "Triethanolamine TEA (99%)": { name: "Triethanolamine TEA (99%)", mw: 149.188, purity: 0.99, valency: 1 },
  };

  const ACID_REAGENTS: Record<string, { name: string; mw: number; purity: number; valency: number }> = {
    "LABSA (90% Acid Slurry)": { name: "LABSA (90% Acid Slurry)", mw: 326.49, purity: 0.90, valency: 1 },
    "LABSA (96% High-Active)": { name: "LABSA (96% High-Active)", mw: 326.49, purity: 0.96, valency: 1 },
    "Citric Acid Anhydrous (100%)": { name: "Citric Acid Anhydrous (100%)", mw: 192.12, purity: 1.00, valency: 3 },
    "Hydrochloric Acid HCl (33% Technical)": { name: "Hydrochloric Acid HCl (33% Technical)", mw: 36.46, purity: 0.33, valency: 1 },
  };

  // Stoichiometric Dosing Demand Calculations
  const chosenAlkali = ALKALI_REAGENTS[selectedAlkaliReagent] || ALKALI_REAGENTS["NaOH Flakes (99% / 100%)"];
  const activeBaseGramsNeeded = isAcidExcess ? (excessAcid / chosenAlkali.valency) * chosenAlkali.mw : 0;
  const commercialAlkaliGrams = isAcidExcess ? activeBaseGramsNeeded / chosenAlkali.purity : 0;
  const commercialAlkaliKg = commercialAlkaliGrams / 1000;

  const chosenAcid = ACID_REAGENTS[selectedAcidReagent] || ACID_REAGENTS["LABSA (90% Acid Slurry)"];
  const activeAcidGramsNeeded = isAlkaliExcess ? (excessBase / chosenAcid.valency) * chosenAcid.mw : 0;
  const commercialAcidGrams = isAlkaliExcess ? activeAcidGramsNeeded / chosenAcid.purity : 0;
  const commercialAcidKg = commercialAcidGrams / 1000;

  const isHighSensitivity = Math.abs(currentpH - targetPH) < 3.5 || excessAcid < 0.05 || excessBase < 0.05;

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-left" id="ph-engine-root">
      
      {/* 1. Header Hero Banner */}
      <div id="ph-engine-header" className="bg-gradient-to-r from-[#1c1a2e] via-[#1a233a] to-[#122035] rounded-3xl border border-amber-500/40 p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30">
              <TestTube size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  pH Engine & Equilibrium Solver
                </h2>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-extrabold">
                  Newton-Raphson
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Batch Stoichiometry • Acid-Base Equilibrium • Buffer Index (β) • Operator Neutralization SOP
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Active Formula Import Toolbar / Active Workspace Formula Detected */}
      {activeFormula && activeFormula.ingredients && activeFormula.ingredients.length > 0 ? (
        <div id="ph-active-formula-detected" className="bg-[#0e1629] border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider">Active Workspace Formula Detected</div>
              <div className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                {activeFormula.name || "Untitled Formula"}
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 font-semibold">
                  {activeFormula.ingredients.length} ingredients
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <label className="flex items-center gap-2 text-xs text-slate-300 font-bold cursor-pointer bg-[#131d35] hover:bg-[#182442] px-3.5 py-2 rounded-xl border border-slate-700 select-none transition-colors">
              <input
                type="checkbox"
                checked={liveSync}
                onChange={(e) => setLiveSync(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer bg-slate-900 border-slate-700"
              />
              <span>Live Auto-Sync</span>
              {liveSync && (
                <span className="text-[9px] bg-amber-500/20 text-amber-300 font-extrabold px-1.5 py-0.5 rounded border border-amber-500/40">
                  ON
                </span>
              )}
            </label>
            <button
              onClick={handleLoadActiveFormula}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-900/40 transition-all cursor-pointer border border-amber-400/40 shrink-0"
            >
              <RefreshCw size={14} />
              Re-Sync ({activeFormula.name || "Active Formula"})
            </button>
          </div>
        </div>
      ) : (
        <div id="ph-no-active-formula" className="bg-[#0e1629] border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 text-slate-400 text-xs">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-slate-500 shrink-0" />
            <span>No active formula loaded in workspace. Select or create a formulation in Formula Expert or Formula Library.</span>
          </div>
        </div>
      )}

      {/* 3. Formula Form - Batch Ingredients & Stoichiometry */}
      <div id="ph-batch-ingredients-stoichiometry" className="bg-[#0e1629] rounded-2xl shadow-lg border border-slate-800 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <FlaskConical size={18} className="text-amber-400" />
              Batch Ingredients & Stoichiometry
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Specify chemical percentages or high-precision batch weights</p>
          </div>
          <div className="flex items-center gap-2 bg-[#131d35] px-3.5 py-2 rounded-xl border border-slate-700/80">
            <label className="text-xs font-extrabold text-slate-300 whitespace-nowrap">Batch Size:</label>
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
                className="w-20 px-2 py-1 border border-slate-600 rounded-lg text-xs font-mono font-bold text-white bg-[#0a0f1d] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
              <span className="text-xs font-bold text-slate-300">kg</span>
              <span className="text-[11px] font-mono text-amber-400 font-bold whitespace-nowrap">
                ({(batchSize * 1000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} g)
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {ingredients.map((ing) => {
            const purity = (ing.activePercent !== undefined ? ing.activePercent / 100 : (INGREDIENT_DATABASE[ing.name] as any)?.purity ?? 1);
            const activePct = (purity * 100).toFixed(0);
            const rawPctVal = ing.rawPercent ?? 0;
            const ingId = ing.id ?? '';
            const weightKgNum = (rawPctVal * batchSize) / 100;
            const weightKgStr = weightKgNum.toFixed(6);
            const weightGramsStr = (weightKgNum * 1000).toFixed(3);

            return (
              <div key={ingId} className="bg-[#131d35] p-3.5 sm:p-4 rounded-xl border border-slate-700/70 space-y-3 hover:border-amber-500/50 transition">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                      Chemical Raw Material
                    </label>
                    <select
                      value={ing.name}
                      onChange={e => updateIngredient(ingId, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-700 rounded-lg text-xs font-bold bg-[#0e1629] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white outline-none cursor-pointer"
                    >
                      {!AVAILABLE_INGREDIENTS.includes(ing.name) && (
                        <option key={ing.name} value={ing.name} className="bg-[#0e1629] text-amber-300">
                          {ing.name} (Neutral / Inert)
                        </option>
                      )}
                      {AVAILABLE_INGREDIENTS.map(name => (
                        <option key={name} value={name} className="bg-[#0e1629] text-white">{name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeIngredient(ingId)}
                    className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition self-end cursor-pointer"
                    title="Remove chemical"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 truncate" title="Raw %">
                      Formula %
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.000001"
                        min="0"
                        max="100"
                        value={rawPctVal}
                        onChange={e => updateIngredient(ingId, 'rawPercent', parseFloat(e.target.value) || 0)}
                        className="w-full pl-3 pr-7 py-1.5 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white bg-[#0e1629] focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 pointer-events-none">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 truncate" title="Active Purity %">
                      Active Purity
                    </label>
                    <div className="w-full px-3 py-1.5 border border-slate-700 bg-[#0e1629] rounded-lg text-xs font-mono font-bold text-slate-300 text-center select-none">
                      {activePct}% Purity
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 truncate" title="Batch Weight">
                      Batch Weight
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
                          updateIngredient(ingId, 'rawPercent', newPct);
                        }}
                        className="w-full px-3 py-1 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white bg-[#0e1629] text-center focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                      <div className="text-center text-[10px] font-mono font-bold text-amber-400">
                        ({weightGramsStr} g)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={addIngredient}
            className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300 hover:text-white bg-[#131d35] hover:bg-amber-950/60 border border-amber-500/40 px-4 py-2 rounded-xl transition cursor-pointer shrink-0"
          >
            <Plus size={16} />
            Add Chemical
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <span className={`text-xs font-extrabold ${Math.abs(totalPercent - 100) < 0.1 ? 'text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/40' : 'text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-500/40'}`}>
              Total: {totalPercent.toFixed(2)}% {Math.abs(totalPercent - 100) >= 0.1 && '(Water balance implicit)'}
            </span>

            <button
              type="button"
              onClick={handleCheckFormula}
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-amber-950/60 transition cursor-pointer disabled:opacity-50 border border-amber-400/40"
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} className="fill-current" />}
              Calculate pH & Equilibrium
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl flex items-center gap-2 text-xs text-rose-300 font-semibold">
            <AlertTriangle size={16} className="shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* RESULTS SECTION */}
      {simpleResult && advancedResult && (
        <div id="ph-engine-results" className="space-y-6 flex flex-col w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            
            {/* 4. Simple Result Card - Basic Stoichiometric Summary */}
            <div id="ph-basic-stoichiometric-summary" className="bg-[#0e1629] rounded-2xl shadow-lg border border-slate-800 p-5 sm:p-6 space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    Basic Stoichiometric Summary
                  </h3>
                  <p className="text-[11px] text-slate-400">Molar ratio neutralizer evaluation</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Fast Stoichiometry
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 pt-1">
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="font-semibold text-slate-400">Evaluation Method:</span>
                  <span className="font-bold text-white">{simpleResult.method ?? "Simple Weighted Average"}</span>
                </div>
                {(simpleResult as any).requiredNaOH100 !== undefined && (
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="font-semibold text-slate-400">Equivalence NaOH (100%):</span>
                    <span className="font-mono font-bold text-amber-300">
                      {((simpleResult as any).requiredNaOH100 ?? 0).toFixed(4)} kg ({(((simpleResult as any).requiredNaOH100 ?? 0) * 1000).toFixed(2)} g)
                    </span>
                  </div>
                )}
                {(simpleResult as any).actualNaOH100 !== undefined && (
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="font-semibold text-slate-400">Actual Formula NaOH:</span>
                    <span className="font-mono font-bold text-cyan-300">
                      {((simpleResult as any).actualNaOH100 ?? 0).toFixed(4)} kg ({(((simpleResult as any).actualNaOH100 ?? 0) * 1000).toFixed(2)} g)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 5. Scientific pH Analysis Card - Equilibrium pH Result */}
            <div id="ph-equilibrium-result" className="bg-[#0e1629] rounded-2xl shadow-lg border border-amber-500/40 p-5 sm:p-6 space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-400" />
                    Equilibrium pH Result
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Debye-Hückel & Newton-Raphson Solver
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {(advancedResult as any).solverUsed ?? "Newton-Raphson"}
                </span>
              </div>

              {/* Large Metric Gauge */}
              <div className="flex items-center justify-between bg-[#131d35] p-4 rounded-xl border border-slate-700">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 block mb-0.5">Calculated pH</span>
                  <span className="text-xs font-semibold text-slate-200 block">
                    {currentpH < 6.8 ? 'Acidic Formulation' : currentpH > 8.5 ? 'Alkaline Formulation' : 'Neutral Formulation'}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Buffer Index (β): {(advancedResult.totalBufferCapacity ?? (advancedResult as any).bufferCapacity ?? 0).toFixed(4)}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-4xl font-black font-mono ${
                    currentpH >= 6.5 && currentpH <= 8.5 
                      ? 'text-emerald-400' 
                      : currentpH < 5.0 || currentpH > 11.0 
                        ? 'text-rose-400' 
                        : 'text-amber-400'
                  }`}>
                    {(advancedResult.finalPH ?? (advancedResult as any).pH ?? 7).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Solver State:</span>
                  <span className={(advancedResult as any).solverConverged !== false ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                    {(advancedResult as any).solverConverged !== false ? "✓ Converged (Residual ≈ 0)" : "Fallback Used"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Excess Acid (mol):</span>
                  <span className="font-mono text-rose-300 font-bold">{(advancedResult.excessStrongAcid ?? 0).toFixed(6)} mol</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Excess Base (mol):</span>
                  <span className="font-mono text-purple-300 font-bold">{(advancedResult.excessStrongBase ?? 0).toFixed(6)} mol</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Active Buffer Species:</span>
                  <span className="font-bold text-amber-400">{advancedResult.activeBuffers?.length ?? 0}</span>
                </div>
              </div>

              {advancedResult.enzymeWarning && advancedResult.enzymeWarningMsg && (
                <div className="p-3 bg-amber-950/80 border border-amber-500/50 rounded-xl text-amber-200 text-xs font-medium">
                  {advancedResult.enzymeWarningMsg}
                </div>
              )}
            </div>

          </div>

          {/* 6. HIGH NEUTRALIZATION SENSITIVITY WARNING */}
          {isHighSensitivity && (
            <div id="ph-high-sensitivity-warning" className="p-4 bg-amber-950/60 border border-amber-500/50 rounded-2xl flex items-start gap-3 text-amber-200 shadow-md">
              <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                  ⚠ High Neutralization Sensitivity
                </h4>
                <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                  Near equivalence (pH 5.0 – 9.0), slight reagent additions produce steep logarithmic pH shifts. Add adjustments incrementally under mechanical agitation, allow temperature to stabilize, and verify with a calibrated benchtop pH meter.
                </p>
              </div>
            </div>
          )}

          {/* 7. SMART NEUTRALIZATION ASSISTANT CARD */}
          <div id="ph-neutralization-assistant" className="bg-[#0e1629] border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-lg space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Activity size={18} className="text-amber-400" />
                  Neutralization Operator Assistant & Stoichiometric Dosing
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculated stoichiometric reagent demand to achieve net charge neutrality (pH 7.00 equivalence)
                </p>
              </div>
              <div className="flex items-center gap-2 bg-[#131d35] px-3.5 py-1.5 rounded-xl border border-slate-700">
                <span className="text-xs font-bold text-slate-400">Target pH:</span>
                <span className="text-xs font-mono font-bold text-amber-400">{targetPH.toFixed(2)}</span>
              </div>
            </div>

            {/* Scientific Distinction Banner */}
            <div className="p-3.5 bg-slate-900/90 border border-slate-700/70 rounded-xl text-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="font-extrabold text-amber-400 uppercase tracking-wider text-[10px]">Scientific Paradigm:</span>
                <span>Thermodynamic Equilibrium (<strong className="text-amber-300">pHEngine</strong>) vs. Theoretical Stoichiometric Dosing Demand</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Batch Size: <strong className="text-white">{batchSize} kg</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Equilibrium pH Analysis */}
              <div className="bg-[#131d35] p-4 rounded-xl border border-slate-700 space-y-1">
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block">Equilibrium pH</span>
                <div className="text-2xl font-black text-white font-mono">{currentpH.toFixed(2)}</div>
                <span className="text-[11px] text-slate-400 block">
                  Delta: {Math.abs(currentpH - targetPH).toFixed(2)} pH units
                </span>
              </div>

              {/* 2. Stoichiometric State */}
              <div className="bg-[#131d35] p-4 rounded-xl border border-slate-700 space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Stoichiometric State</span>
                <div>
                  {isAcidExcess && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/80 text-rose-300 border border-rose-500/50 text-xs font-extrabold">
                      Acid Excess
                    </span>
                  )}
                  {isAlkaliExcess && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/80 text-purple-300 border border-purple-500/50 text-xs font-extrabold">
                      Alkali Excess
                    </span>
                  )}
                  {isNeutral && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 text-xs font-extrabold">
                      Stoichiometric Equivalence
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 block font-mono">
                  {isAcidExcess ? `${excessAcid.toFixed(6)} mol H+` : isAlkaliExcess ? `${excessBase.toFixed(6)} mol OH-` : 'Net Charge Zero'}
                </span>
              </div>

              {/* 3. Pure Active Equivalent Demand */}
              <div className="bg-[#131d35] p-4 rounded-xl border border-slate-700 space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Pure Active Demand (100%)</span>
                <div className="text-sm font-bold text-amber-400 font-mono">
                  {isAcidExcess && `${activeBaseGramsNeeded.toFixed(2)} g Pure Base`}
                  {isAlkaliExcess && `${activeAcidGramsNeeded.toFixed(2)} g Pure Acid`}
                  {isNeutral && '0.00 g (Equivalence)'}
                </div>
                <span className="text-[11px] text-slate-400 block">
                  {isAcidExcess ? `Base Eq: ${(excessAcid).toFixed(6)} eq` : isAlkaliExcess ? `Acid Eq: ${(excessBase).toFixed(6)} eq` : '0.00 eq'}
                </span>
              </div>

              {/* 4. Commercial Reagent Dosing */}
              <div className="bg-[#131d35] p-4 rounded-xl border border-slate-700 space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Commercial Dosing Mass</span>
                <div className="text-sm font-bold text-emerald-400 font-mono">
                  {isAcidExcess && `${commercialAlkaliGrams.toFixed(2)} g (${commercialAlkaliKg.toFixed(4)} kg)`}
                  {isAlkaliExcess && `${commercialAcidGrams.toFixed(2)} g (${commercialAcidKg.toFixed(4)} kg)`}
                  {isNeutral && '0.00 g (No Reagents)'}
                </div>
                <span className="text-[11px] text-slate-400 block truncate">
                  {isAcidExcess ? selectedAlkaliReagent : isAlkaliExcess ? selectedAcidReagent : 'Standard Met'}
                </span>
              </div>
            </div>

            {/* Reagent Selector & Corrective Instructions */}
            <div className="bg-[#131d35] p-4 sm:p-5 rounded-xl border border-amber-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-3">
                <span className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Scale size={16} className="text-amber-400" />
                  Select Corrective Reagent Inventory
                </span>
                
                {isAcidExcess && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Alkali Stock:</span>
                    <select
                      value={selectedAlkaliReagent}
                      onChange={(e) => setSelectedAlkaliReagent(e.target.value)}
                      className="bg-[#0e1629] text-amber-300 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold focus:ring-1 focus:ring-amber-400 outline-none cursor-pointer"
                    >
                      {Object.keys(ALKALI_REAGENTS).map(k => (
                        <option key={k} value={k} className="bg-[#0e1629] text-white">{k}</option>
                      ))}
                    </select>
                  </div>
                )}

                {isAlkaliExcess && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Acid Stock:</span>
                    <select
                      value={selectedAcidReagent}
                      onChange={(e) => setSelectedAcidReagent(e.target.value)}
                      className="bg-[#0e1629] text-amber-300 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold focus:ring-1 focus:ring-amber-400 outline-none cursor-pointer"
                    >
                      {Object.keys(ACID_REAGENTS).map(k => (
                        <option key={k} value={k} className="bg-[#0e1629] text-white">{k}</option>
                      ))}
                    </select>
                  </div>
                )}

                {isNeutral && (
                  <span className="text-xs font-mono font-extrabold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-500/50">
                    ✓ Stoichiometric Equivalence Achieved
                  </span>
                )}
              </div>

              {/* Standard Operating Procedure */}
              <div className="text-xs text-slate-300 leading-relaxed space-y-2">
                <span className="font-bold text-white block uppercase tracking-wider text-[11px]">
                  Plant Operator Standard Operating Procedure (SOP):
                </span>
                {isAcidExcess && (
                  <div className="space-y-1">
                    <p>
                      1. Weigh exactly <strong className="text-amber-300 font-mono">{commercialAlkaliGrams.toFixed(2)} g</strong> ({commercialAlkaliKg.toFixed(4)} kg) of commercial <strong className="text-white">{selectedAlkaliReagent}</strong> (equivalent to {activeBaseGramsNeeded.toFixed(2)} g 100% active base).
                    </p>
                    <p>
                      2. Add slowly into the mixing tank under continuous mechanical shear agitation.
                    </p>
                    <p>
                      3. Allow 10–15 minutes for complete exothermic neutralization and temperature equilibration.
                    </p>
                    <p>
                      4. Confirm final pH with a calibrated benchtop pH electrode before introducing heat-sensitive actives or viscosity modifiers.
                    </p>
                  </div>
                )}
                {isAlkaliExcess && (
                  <div className="space-y-1">
                    <p>
                      1. Weigh exactly <strong className="text-amber-300 font-mono">{commercialAcidGrams.toFixed(2)} g</strong> ({commercialAcidKg.toFixed(4)} kg) of commercial <strong className="text-white">{selectedAcidReagent}</strong> (equivalent to {activeAcidGramsNeeded.toFixed(2)} g 100% active acid).
                    </p>
                    <p>
                      2. Introduce slowly into the mixing vortex under high-efficiency mechanical agitation.
                    </p>
                    <p>
                      3. Agitate thoroughly to ensure complete acid-base reaction.
                    </p>
                    <p>
                      4. Re-measure batch pH with calibrated benchtop meter.
                    </p>
                  </div>
                )}
                {isNeutral && (
                  <p className="text-emerald-300">
                    Formulation is at stoichiometric equivalence. Batch is ready for secondary additions (preservatives, bio-enzymes, fragrance, optical brighteners, and salt thickening).
                  </p>
                )}
              </div>

              {/* Safety & Real Matrix Notice */}
              <div className="p-3 bg-[#0b1020] border border-amber-500/20 rounded-lg text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-amber-300">Scientific Matrix Notice: </strong>
                Stoichiometric Neutralization Demand represents theoretical charge balance. Real detergent batches contain builder hydrolysis, complexing agents, micellar ionic activity variations, and buffer systems. Dosing should always be validated incrementally with benchtop pH measurements.
              </div>
            </div>
          </div>

          {/* 8. PRODUCTION WORKFLOW PANEL - Batch Execution Pipeline */}
          <div id="ph-batch-execution-pipeline" className="bg-[#0e1629] border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-lg space-y-4">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Gauge size={16} className="text-amber-400" />
              Batch Execution Pipeline
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1 */}
              <div className="bg-[#131d35] p-4 rounded-xl border border-slate-700 space-y-1">
                <div className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                  Step 1 • Current Status
                </div>
                <div className="text-sm font-extrabold text-white mt-1">
                  {isAcidExcess && `Acidic (pH ${currentpH.toFixed(2)})`}
                  {isAlkaliExcess && `Alkaline (pH ${currentpH.toFixed(2)})`}
                  {isNeutral && `Neutral (pH ${currentpH.toFixed(2)})`}
                </div>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  {isAcidExcess && `${excessAcid.toFixed(6)} mol H+ excess`}
                  {isAlkaliExcess && `${excessBase.toFixed(6)} mol OH- excess`}
                  {isNeutral && `Equilibrium reached`}
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-[#131d35] p-4 rounded-xl border border-amber-500/40 space-y-1">
                <div className="text-[10px] uppercase font-extrabold text-amber-400 tracking-wider">
                  Step 2 • Action Required
                </div>
                <div className="text-sm font-extrabold text-amber-300 mt-1">
                  {isAcidExcess && `Add ${commercialAlkaliGrams.toFixed(2)} g ${selectedAlkaliReagent}`}
                  {isAlkaliExcess && `Add ${commercialAcidGrams.toFixed(2)} g ${selectedAcidReagent}`}
                  {isNeutral && `No Reagents Needed`}
                </div>
                <p className="text-xs text-amber-200/80 font-mono mt-1">
                  {isAcidExcess && `(${commercialAlkaliKg.toFixed(4)} kg ${selectedAlkaliReagent})`}
                  {isAlkaliExcess && `(${commercialAcidKg.toFixed(4)} kg ${selectedAcidReagent})`}
                  {isNeutral && `Specification satisfied`}
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-[#131d35] p-4 rounded-xl border border-emerald-500/40 space-y-1">
                <div className="text-[10px] uppercase font-extrabold text-emerald-400 tracking-wider">
                  Step 3 • Target Endpoint
                </div>
                <div className="text-sm font-extrabold text-emerald-300 mt-1">
                  Target pH ≈ 7.00
                </div>
                <p className="text-xs text-emerald-400/80 mt-1">
                  Equilibrium & Stability Spec
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
