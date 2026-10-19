import { initializeDatabaseAndStores } from './db/init';
import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Library, 
  TestTube, 
  Search, 
  Mic, 
  MicOff, 
  Camera, 
  Globe, 
  FlaskConical, 
  Calculator,
  ClipboardCheck,
  Package,
  FileText,
  PenTool,
  Award,
  Layers,
  Cpu,
  Workflow,
  Atom,
  Bot,
  Database
} from 'lucide-react';

import AIFormulator from './components/AIFormulator';
import AccountMenu from './components/AccountMenu';
import ChemicalEncyclopedia from './components/ChemicalEncyclopedia';
import FormulationLibrary from './components/FormulationLibrary';
import RCCalculators from './components/RCCalculators';
import QCOperations from './components/QCOperations';
import InventoryProduction from './components/InventoryProduction';
import DocsLibrary from './components/DocsLibrary';
import LabNotebook from './components/LabNotebook';
import MathTestSuite from './components/MathTestSuite';
import OnboardingModal from './components/OnboardingModal';
import OfflineIndicator from './components/OfflineIndicator';
import PWAInstallButton from './components/PWAInstallButton';
import { PlayBillingBridge } from './services/playBillingBridge';
import PHEngineView from './components/PHEngineView';
import LabAutomationDashboard from './components/LabAutomationDashboard';
import ClosedLoopDashboard from './components/ClosedLoopDashboard';
import LabOperationsHub from './components/LabOperationsHub';
import { ScienceLabWorkbench } from './components/ScienceLabWorkbench';
import { GeminiChemistryChatModal } from './components/GeminiChemistryChatModal';
import { ScientificRoadmapVault } from './components/ScientificRoadmapVault';

import { ActiveFormulaState } from './types';

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
    scienceLab: "Science Lab",
    scienceLabDesc: "3D Macromolecules, PubChem & Literature",
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
    qcOperationsDesc: "ગુણવत्ता નિયંત્રણ અને સ્થિરતા પરીક્ષણ",
    inventory: "ઇન્વેન્ટરી",
    inventoryDesc: "કાચો માલ સ્ટોક અને ઉત્પાદન લોગ",
    docs: "દસ્તાવેજો અને SDS",
    docsDesc: "તકનીકી બુલેટિન અને સલામતી શીટ્સ",
    labNotebook: "લેบ નોટબુક",
    labNotebookDesc: "પ્રયોગ અને અવલોકન નોંધો",
    validation: "ગણિત પરીક્ષણ",
    validationDesc: "વૈજ્ઞાનिक અલ્ગોરિધમ ચકાસણી",
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
    qcOperationsDesc: "معیار کی جانع اور استحکام ٹیسٹ",
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
    inventory: "ఇన్వెنتరీ",
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
    formulaLibraryDesc: "Recetas maestros verificadas",
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
  | 'science_lab'
  | 'formula_library' 
  | 'chemical_encyclopedia' 
  | 'ph_engine'
  | 'calculators'
  | 'qc_operations'
  | 'inventory'
  | 'docs_library'
  | 'lab_notebook'
  | 'lab_automation'
  | 'lab_operations'
  | 'closed_loop'
  | 'validation_suite'
  | 'scientific_vault';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    initializeDatabaseAndStores();
    PlayBillingBridge.initialize().catch((err) => {
      console.error('[App] Play Billing initialization failed:', err);
    });
    const completed = localStorage.getItem('detergent_onboarding_completed_v3');
    if (!completed) {
      setShowOnboarding(true);
    }
  }, []);

  const handleCloseOnboarding = () => {
    localStorage.setItem('detergent_onboarding_completed_v3', 'true');
    setShowOnboarding(false);
  };

  const [activeTab, setActiveTab] = useState<TabType>('formula_expert');
  const [lang, setLang] = useState<string>('en');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isGlobalChatOpen, setIsGlobalChatOpen] = useState<boolean>(false);

  // Cross-component selected IDs & Single Source of Truth Active Formula State
  const [selectedChemicalId, setSelectedChemicalId] = useState<string | null>(null);
  const [selectedFormulaId, setSelectedFormulaId] = useState<string | null>(null);
  const [scienceQuery, setScienceQuery] = useState<string>('');

  const handleOpenScienceLab = (query?: string) => {
    if (query) {
      setScienceQuery(query);
    }
    setActiveTab('science_lab');
  };

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
              costPerKg: (ing.costPerKg !== undefined && ing.costPerKg !== null && !isNaN(Number(ing.costPerKg)))
                ? Number(ing.costPerKg)
                : null,
              role: ing.role || ing.function || 'Component',
            };
          });
          return {
            id: parsed.id || `active-${Date.now()}`,
            name: parsed.name || parsed.formulaName || "Active Formula",
            productType: parsed.productType || "Liquid Laundry Detergent",
            grade: parsed.grade || "Standard",
            targetCost: (parsed.targetCost !== undefined && parsed.targetCost !== null && !isNaN(Number(parsed.targetCost)))
              ? Number(parsed.targetCost)
              : undefined,
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

  // Primary Core Workstations
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
      id: 'science_lab' as TabType, 
      label: t.scienceLab || "Science Lab", 
      desc: "3D Molecules & PubChem",
      icon: Atom, 
      glow: "from-blue-500/20 to-purple-500/20",
      accent: "text-cyan-400",
      badge: "SCIENCE"
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
    { id: 'science_lab' as TabType, label: t.scienceLab || "Science Lab", icon: Atom, accent: "text-cyan-400" },
    { id: 'calculators' as TabType, label: t.calculators, icon: Calculator, accent: "text-blue-400" },
    { id: 'qc_operations' as TabType, label: t.qcOperations, icon: ClipboardCheck, accent: "text-emerald-400" },
    { id: 'inventory' as TabType, label: t.inventory, icon: Package, accent: "text-cyan-400" },
    { id: 'docs_library' as TabType, label: t.docs, icon: FileText, accent: "text-indigo-400" },
    { id: 'lab_notebook' as TabType, label: t.labNotebook, icon: PenTool, accent: "text-rose-400" },
    { id: 'lab_automation' as TabType, label: "Lab Automation", icon: Cpu, accent: "text-amber-400" },
    { id: 'lab_operations' as TabType, label: "Lab-to-Production", icon: FlaskConical, accent: "text-cyan-400" },
    { id: 'closed_loop' as TabType, label: "Closed-Loop R&D", icon: Workflow, accent: "text-teal-400" },
    { id: 'validation_suite' as TabType, label: t.validation, icon: Award, accent: "text-purple-400" },
    { id: 'scientific_vault' as TabType, label: "Evidence Vault & Roadmap", icon: Database, accent: "text-amber-400" },
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

        {/* Right: Active Formula Quick Badge & Language Selector */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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

          {/* Gemini Chemistry Bot Quick Launcher Button in Header */}
          <button
            type="button"
            onClick={() => setIsGlobalChatOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:from-purple-800/80 hover:to-indigo-800/80 border border-purple-500/40 text-xs font-bold text-purple-200 hover:text-white transition shadow-sm cursor-pointer shrink-0"
            title="Ask Gemini Cleaning Chemistry Bot"
          >
            <Bot size={14} className="text-purple-300" />
            <span className="hidden sm:inline">AI Chemistry Bot</span>
          </button>

          {/* PWA Install Button & User Account Menu */}
          <PWAInstallButton />
          <AccountMenu />
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

          {activeTab === 'science_lab' && (
            <ScienceLabWorkbench initialChemicalQuery={scienceQuery} />
          )}

          {activeTab === 'chemical_encyclopedia' && (
            <ChemicalEncyclopedia 
              lang={lang as any} 
              translations={TRANSLATIONS} 
              selectedChemicalId={selectedChemicalId}
              onSelectChemical={(id: string) => setSelectedChemicalId(id)}
              onInspectScience={(q: string) => handleOpenScienceLab(q)}
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

          {activeTab === 'lab_automation' && (
            <LabAutomationDashboard />
          )}

          {activeTab === 'lab_operations' && (
            <LabOperationsHub />
          )}

          {activeTab === 'closed_loop' && (
            <ClosedLoopDashboard />
          )}

          {activeTab === 'validation_suite' && (
            <MathTestSuite />
          )}

          {activeTab === 'scientific_vault' && (
            <ScientificRoadmapVault />
          )}

        </div>
      </main>

      {/* Global Onboarding Overlay */}
      <OnboardingModal isOpen={showOnboarding} onClose={handleCloseOnboarding} />

      {/* Real-time Connectivity Indicator */}
      <OfflineIndicator />

      {/* FLOATING ACTION BUTTON: GEMINI CHEMISTRY BOT */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsGlobalChatOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-cyan-950/80 border border-cyan-400/40 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          title="Open Gemini Cleaning Chemistry Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white animate-bounce" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#070b18]" />
          </div>
          <div className="flex flex-col text-left">
            <span className="leading-tight">Ask Chemistry AI</span>
            <span className="text-[9px] font-mono font-medium text-cyan-200">
              {activeFormula ? `Formula Attached (${activeFormula.name.slice(0, 15)})` : 'Gemini 3.8 Flash'}
            </span>
          </div>
        </button>
      </div>

      {/* GLOBAL GEMINI CHEMISTRY CHATBOT MODAL */}
      <GeminiChemistryChatModal
        isOpen={isGlobalChatOpen}
        onClose={() => setIsGlobalChatOpen(false)}
        formulaContext={activeFormula ? {
          formulaName: activeFormula.name,
          productCategory: activeFormula.category || activeFormula.productType,
          productType: activeFormula.productType,
          batchSizeKg: activeFormula.batchSizeKg || activeFormula.batchSize,
          ingredients: activeFormula.ingredients?.map(i => ({
            name: i.name,
            percentage: Number(i.percentage || (i as any).percent) || 0,
            activeMatterPct: i.activeMatterPct,
            role: i.role,
            costPerKg: i.costPerKg
          })),
          properties: {
            pH: (activeFormula as any).targetPH
          }
        } : null}
        lang={lang}
      />

    </div>
  );
}
