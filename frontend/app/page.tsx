"use client";

import React, { useState, useEffect } from "react";
import {
  Sprout,
  CloudRain,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  MapPin,
  Globe,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Mic
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from "recharts";

// 1. Bilingual dictionary for immediate local transitions
const TRANSLATIONS = {
  en: {
    title: "KisanMitra",
    subtitle: "Farmer's Friend AI Multi-Agent System",
    selectCrop: "Select Crop",
    selectSoil: "Select Soil Type",
    enterLocation: "Enter Mandi Location / Region",
    customQ: "Ask a Specific Question (Optional)",
    askButton: "Get Smart Agricultural Decision",
    loading: "Orchestrating AI Agents...",
    transparencyTitle: "Transparency Panel: Agent Breakdown",
    weatherAgent: "Weather Agent Report",
    cropAgent: "Crop & Soil Suitability Advice",
    marketAgent: "Market Price & Mandi Trends",
    currentPrice: "Current Mandi Rate",
    mspPrice: "Govt MSP Rate",
    projection: "7-Day Projection",
    decision: "Final Unified Recommendation",
    reason: "Key Reason",
    sellRec: "SELL NOW",
    holdRec: "HOLD / WAIT",
    reset: "Start Over",
    quickQ: "Quick Common Questions",
    placeholderQ: "e.g., Should I harvest now since cloud cover is increasing?",
    suitability: "Soil Suitability",
    fertilizer: "Nutrient Advice",
    watering: "Irrigation Info",
    pests: "Pest Threat",
    recom: "Mandi Recommendation",
    trend: "Trend Sentiment",
    quickQ1: "Should I sell now or wait for a price hike?",
    quickQ2: "Heavy rain is forecast. Should I harvest immediately?",
    quickQ3: "Which fertilizer should I apply this week?",
    quickQ4: "Is my soil good for this crop?",
    connectingBackend: "Connecting to KisanMitra backend..."
  },
  hi: {
    title: "किसानमित्र",
    subtitle: "बहु-एजेंट एआई कृषि निर्णय प्रणाली",
    selectCrop: "फसल चुनें",
    selectSoil: "मिट्टी का प्रकार चुनें",
    enterLocation: "मंडी क्षेत्र / स्थान दर्ज करें",
    customQ: "कोई विशेष प्रश्न पूछें (वैकल्पिक)",
    askButton: "स्मार्ट निर्णय प्राप्त करें",
    loading: "कृषि एजेंटों से परामर्श लिया जा रहा है...",
    transparencyTitle: "पारदर्शिता पैनल: विशेषज्ञों की व्यक्तिगत रिपोर्ट",
    weatherAgent: "मौसम एजेंट की रिपोर्ट",
    cropAgent: "फसल और मिट्टी उपयुक्तता सलाह",
    marketAgent: "मंडी मूल्य और बाजार विश्लेषण",
    currentPrice: "वर्तमान मंडी दर",
    mspPrice: "सरकारी न्यूनतम समर्थन मूल्य (MSP)",
    projection: "7-दिनों का पूर्वानुमान",
    decision: "अंतिम कार्य योजना",
    reason: "मुख्य कारण",
    sellRec: "अभी बेचें (SELL)",
    holdRec: "रोकें / प्रतीक्षा करें (HOLD)",
    reset: "फिर से शुरू करें",
    quickQ: "सामान्य त्वरित प्रश्न",
    placeholderQ: "जैसे: क्या बादल छाने पर मुझे अभी कटाई कर लेनी चाहिए?",
    suitability: "मिट्टी उपयुक्तता",
    fertilizer: "उर्वरक सलाह",
    watering: "सिंचाई निर्देश",
    pests: "कीट खतरा",
    recom: "मंडी सिफारिश",
    trend: "बाजार का रुख",
    quickQ1: "क्या मुझे अभी बेचना चाहिए या दाम बढ़ने का इंतजार करना चाहिए?",
    quickQ2: "भारी बारिश का अनुमान है। क्या मुझे तुरंत कटाई करनी चाहिए?",
    quickQ3: "इस सप्ताह मुझे कौन सा उर्वरक डालना चाहिए?",
    quickQ4: "क्या मेरी मिट्टी इस फसल के लिए सही है?",
    connectingBackend: "किसानमित्र बैकएंड से जुड़ रहा है..."
  }
};

const CROPS = [
  { id: "wheat", nameEn: "Wheat", nameHi: "गेहूं", emoji: "🌾" },
  { id: "rice_common", nameEn: "Rice/Paddy (Common)", nameHi: "धान / चावल (सामान्य)", emoji: "🍚" },
  { id: "rice_grade_a", nameEn: "Rice/Paddy (Grade A)", nameHi: "धान / चावल (ग्रेड ए)", emoji: "🍚" },
  { id: "cotton", nameEn: "Cotton", nameHi: "कपास", emoji: "🪵" },
  { id: "mustard", nameEn: "Mustard", nameHi: "सरसों", emoji: "🌼" },
  { id: "sugarcane", nameEn: "Sugarcane", nameHi: "गन्ना", emoji: "🎋" }
];

const SOILS = [
  { id: "alluvial", nameEn: "Alluvial Soil", nameHi: "जलोढ़ मिट्टी" },
  { id: "black", nameEn: "Black Soil", nameHi: "काली मिट्टी" },
  { id: "red", nameEn: "Red Soil", nameHi: "लाल मिट्टी" },
  { id: "sandy", nameEn: "Sandy Soil", nameHi: "रेतीली मिट्टी" },
  { id: "clayey", nameEn: "Clayey Soil", nameHi: "चिकनी मिट्टी" }
];

const LOCATIONS = [
  { id: "ludhiana", name: "Ludhiana, Punjab" },
  { id: "jaipur", name: "Jaipur, Rajasthan" },
  { id: "lucknow", name: "Lucknow, Uttar Pradesh" },
  { id: "pune", name: "Pune, Maharashtra" },
  { id: "rohtak", name: "Rohtak, Haryana" },
  { id: "patna", name: "Patna, Bihar" }
];

const LOADING_STAGES = [
  { id: 1, en: "Initializing multi-agent network...", hi: "बहु-एजेंट नेटवर्क प्रारंभ किया जा रहा है..." },
  { id: 2, en: "Weather Agent calling Open-Meteo API via MCP...", hi: "मौसम एजेंट Open-Meteo से पूर्वानुमान ले रहा है..." },
  { id: 3, en: "Crop/Soil Agent evaluating biological compatibility...", hi: "फसल/मिट्टी एजेंट जैविक अनुकूलता का मूल्यांकन कर रहा है..." },
  { id: 4, en: "Market Agent analyzing mandi price trends and MSP...", hi: "बाजार एजेंट मंडी दरों और एमएसपी का विश्लेषण कर रहा है..." },
  { id: 5, en: "Orchestrator synthesising final recommendation...", hi: "मुख्य समन्वयक अंतिम निर्णय तैयार कर रहा है..." }
];

export default function Home() {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [cropType, setCropType] = useState("wheat");
  const [soilType, setSoilType] = useState("alluvial");
  const [location, setLocation] = useState("Jaipur, Rajasthan");
  const [customQuestion, setCustomQuestion] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(LOADING_STAGES[0]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cycle through loading steps to provide a realistic agent coordination feel
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      let stageIndex = 0;
      setLoadingStage(LOADING_STAGES[0]);
      interval = setInterval(() => {
        stageIndex = (stageIndex + 1) % LOADING_STAGES.length;
        setLoadingStage(LOADING_STAGES[stageIndex]);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Cleanup speech recognition on unmount or instance change
  useEffect(() => {
    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, [recognitionInstance]);

  const toggleListening = () => {
    if (isListening && recognitionInstance) {
      recognitionInstance.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(lang === "en"
        ? "Speech recognition is not supported in this browser. Please use Chrome, Safari or Edge."
        : "इस ब्राउज़र में स्पीच रिकग्निशन समर्थित नहीं है। कृपया क्रोम, सफारी या एज का उपयोग करें।"
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = lang === "en" ? "en-IN" : "hi-IN";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      if (event.error === "not-allowed") {
        alert(lang === "en"
          ? "Microphone access blocked. Please enable microphone permissions in browser settings."
          : "माइक्रोफ़ोन एक्सेस ब्लॉक है। कृपया ब्राउज़र सेटिंग्स में अनुमतियों को सक्षम करें।"
        );
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      if (speechToText) {
        setCustomQuestion(speechToText);
      }
    };

    setRecognitionInstance(recognition);
    recognition.start();
  };

  const handleAsk = async (e?: React.FormEvent, questionOverride?: string) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const questionToSend = questionOverride !== undefined ? questionOverride : customQuestion;

    // Basic Input Validation: Limit length and sanitize HTML tags to prevent DoS/XSS injection
    if (questionToSend && questionToSend.length > 300) {
      setError(lang === "en"
        ? "Security Validation: Question exceeds 300 character limit."
        : "सुरक्षा सत्यापन: प्रश्न 300 वर्णों की सीमा से अधिक है।"
      );
      setLoading(false);
      return;
    }

    const sanitizedQuestion = questionToSend
      ? questionToSend.replace(/<\/?[^>]+(>|$)/g, "").trim()
      : "";

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiBaseUrl}/api/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          cropType,
          soilType,
          location,
          question: sanitizedQuestion
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned code ${response.status}. Make sure backend is running.`);
      }

      const data = await response.json();
      setResult(data);

      // Generate Recharts data using 30-day history and 7-day projection
      if (data?.transparencyData?.market) {
        const market = data.transparencyData.market;
        const hist = market.historicalPrices || [];
        const proj = market.projectedPrices || [];
        
        const formatted = [];
        // Last 10 days of history for visual density
        const startDay = Math.max(0, hist.length - 15);
        for (let i = startDay; i < hist.length; i++) {
          formatted.push({
            name: `${lang === "en" ? "Day" : "दिन"} -${hist.length - 1 - i}`,
            price: hist[i],
            type: "Historical"
          });
        }
        // Today
        const lastHistPrice = hist[hist.length - 1] || market.currentPrice;
        
        // Next 7 days
        for (let i = 0; i < proj.length; i++) {
          formatted.push({
            name: `${lang === "en" ? "Proj" : "पूर्वानुमान"} +${i + 1}`,
            price: proj[i],
            type: "Projected"
          });
        }
        setChartData(formatted);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  const selectQuickQuestion = (q: string) => {
    setCustomQuestion(q);
    handleAsk(undefined, q);
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setCustomQuestion("");
  };

  // Safe split helper for bilingual outputs
  const splitText = (text: string, targetLang: "en" | "hi") => {
    if (!text) return "";
    const parts = text.split("/");
    if (parts.length < 2) return text;
    return targetLang === "en" ? parts[0].trim() : parts[1].trim();
  };

  const selectedCropObj = CROPS.find((c) => c.id === cropType);
  const cropDisplayName = selectedCropObj ? (lang === "en" ? selectedCropObj.nameEn : selectedCropObj.nameHi) : cropType;

  const t = TRANSLATIONS[lang];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-slate-100 font-sans selection:bg-emerald-600 selection:text-white">
      {/* 1. Header Navigation */}
      <header className="border-b border-emerald-900/50 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
              <Sprout className="w-7 h-7 text-slate-950" />
            </div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent tracking-tight">
                {t.title}
              </h1>
              <p className="text-[10px] text-emerald-400/80 uppercase tracking-widest font-semibold">{t.subtitle}</p>
            </div>
          </div>

          {/* Bilingual Language Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-800/40 bg-emerald-950/50 hover:bg-emerald-900/50 transition-all text-xs font-bold text-emerald-300 shadow-inner"
            >
              <Globe className="w-4 h-4" />
              <span>{lang === "en" ? "हिन्दी (HI)" : "English (EN)"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Dashboard Layout */}
      <main className="max-w-7xl mx-auto px-4 py-6 md:py-10">
        {!result && !loading && (
          <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
            {/* Logo / Welcome Area */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Kaggle Agents for Good Capstone</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-slate-100 tracking-tight leading-none">
                {lang === "en" ? "Agri-Decisions Made Simple" : "कृषि निर्णय अब हुए आसान"}
              </h2>
              <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto">
                {lang === "en"
                  ? "Get instant, integrated advisories combining real-time weather, soil suitability, and mandi price trend analysis."
                  : "वास्तविक समय के मौसम, मिट्टी की उपयुक्तता और मंडी भाव के विश्लेषण के साथ तुरंत एकीकृत सलाह प्राप्त करें।"}
              </p>
            </div>

            {/* Input Form Card */}
            <div className="bg-slate-900/60 border border-emerald-900/40 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-2xl space-y-6">
              
              {/* CROP SELECTOR */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">{t.selectCrop}</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {CROPS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCropType(c.id)}
                      className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                        cropType === c.id
                          ? "bg-gradient-to-b from-emerald-500/20 to-teal-500/10 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/10 scale-[1.03]"
                          : "border-slate-800 bg-slate-950/40 hover:border-emerald-800/30 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span className="text-3xl">{c.emoji}</span>
                      <span className="text-xs font-bold leading-tight">
                        {lang === "en" ? c.nameEn : c.nameHi}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SOIL SELECTOR */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">{t.selectSoil}</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {SOILS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSoilType(s.id)}
                      className={`py-3 px-2 rounded-xl border text-center text-xs font-bold transition-all ${
                        soilType === s.id
                          ? "bg-emerald-950/80 border-emerald-500/70 text-emerald-300 shadow-inner"
                          : "border-slate-800/80 bg-slate-950/30 hover:border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {lang === "en" ? s.nameEn : s.nameHi}
                    </button>
                  ))}
                </div>
              </div>

              {/* LOCATION INPUT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">{t.enterLocation}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-emerald-500/70" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/70 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all font-semibold"
                    />
                  </div>
                </div>

                {/* QUICK LOCATION CHIPS */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">{lang === "en" ? "Select Preset Region" : "पूर्व-निर्धारित क्षेत्र चुनें"}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {LOCATIONS.map((loc) => (
                      <button
                        key={loc.id}
                        onClick={() => setLocation(loc.name)}
                        className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-all ${
                          location === loc.name
                            ? "bg-teal-500/10 border-teal-400/80 text-teal-300"
                            : "bg-slate-950/30 border-slate-800 text-slate-400 hover:bg-slate-950/50"
                        }`}
                      >
                        {loc.name.split(",")[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CUSTOM QUESTION */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">{t.customQ}</label>
                <div className="relative">
                  <HelpCircle className="absolute left-3 top-3.5 w-4 h-4 text-emerald-500/70" />
                  <input
                    type="text"
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder={isListening ? (lang === "en" ? "Listening..." : "सुन रहा हूँ...") : t.placeholderQ}
                    className="w-full pl-9 pr-12 py-3 rounded-xl border border-slate-800 bg-slate-950/70 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`absolute right-3 top-2.5 p-1.5 rounded-lg transition-all ${
                      isListening
                        ? "bg-rose-500 text-slate-950 animate-pulse hover:bg-rose-600"
                        : "text-emerald-400 hover:bg-emerald-950/50 hover:text-emerald-300"
                    }`}
                    title={lang === "en" ? "Voice Input" : "आवाज इनपुट"}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
                {isListening && (
                  <p className="text-[10px] text-rose-400 font-bold animate-pulse">
                    🎤 {lang === "en" ? "Listening... Speak now" : "सुन रहा हूँ... अब बोलें"}
                  </p>
                )}
              </div>

              {/* SUBMIT BUTTON */}
              <button
                onClick={(e) => handleAsk(e)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-all transform hover:scale-[1.01] hover:shadow-xl hover:shadow-emerald-500/10 flex items-center justify-center gap-2"
              >
                <span>{t.askButton}</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            </div>

            {/* QUICK QUESTIONS PANEL */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{t.quickQ}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[t.quickQ1, t.quickQ2, t.quickQ3, t.quickQ4].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectQuickQuestion(q)}
                    className="p-3 text-left rounded-xl bg-slate-950/30 border border-slate-800/80 hover:bg-slate-950/60 hover:border-emerald-800/30 text-xs text-slate-400 hover:text-emerald-300 transition-all leading-snug"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. Loading Screen with Agent Progress */}
        {loading && (
          <div className="max-w-xl mx-auto py-20 text-center space-y-8 animate-pulse">
            <div className="relative inline-flex">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
              <Sprout className="w-8 h-8 text-emerald-400 absolute inset-0 m-auto animate-bounce" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-slate-100">{t.loading}</h3>
              <div className="px-4 py-2 rounded-xl bg-slate-950/50 border border-emerald-950 text-emerald-400 text-xs inline-block font-semibold">
                {lang === "en" ? loadingStage.en : loadingStage.hi}
              </div>
            </div>
            {/* Visual Agent Pipeline */}
            <div className="flex items-center justify-center gap-2.5 max-w-sm mx-auto">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                    loadingStage.id >= step ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md shadow-emerald-400/20" : "bg-slate-800"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* 4. Display Error Panel */}
        {error && (
          <div className="max-w-xl mx-auto bg-rose-950/20 border border-rose-900/50 p-6 rounded-2xl space-y-4 text-center">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-rose-300">{lang === "en" ? "Connection Failed" : "कनेक्शन विफल रहा"}</h3>
              <p className="text-xs text-rose-400/80 leading-relaxed font-semibold">{t.connectingBackend}</p>
              <p className="text-xs text-slate-400 bg-slate-950/50 p-3 rounded-lg border border-slate-800 font-mono mt-2 select-all">
                {error}
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={(e) => handleAsk(e)}
                className="px-4 py-2 bg-rose-900/30 border border-rose-800 hover:bg-rose-900/50 text-xs font-bold rounded-lg text-rose-200"
              >
                {lang === "en" ? "Retry Call" : "पुनः प्रयास करें"}
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-slate-300"
              >
                {t.reset}
              </button>
            </div>
          </div>
        )}

        {/* 5. Main Results Rendering */}
        {result && !loading && (
          <div className="space-y-8 animate-fade-in">
            {/* Top Info Banner */}
            <div className="flex items-center justify-between bg-slate-950/50 border border-slate-800 p-4 rounded-2xl text-xs md:text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-emerald-400 uppercase">{lang === "en" ? "Query Details:" : "पूछताछ विवरण:"}</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-semibold">{cropDisplayName}</span>
                <span className="text-slate-600">•</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-semibold uppercase">{soilType}</span>
                <span className="text-slate-600">•</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-semibold">{result.location}</span>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-all text-slate-200 border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t.reset}</span>
              </button>
            </div>

            {/* A. ORCHESTRATOR RECOMMENDATION CARD */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-emerald-500/40 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Decision Badge */}
                <div className="md:col-span-1 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.decision}</span>
                  
                  {(() => {
                    const rec = result.orchestratorResponse.finalDecision[lang].toLowerCase();
                    const isSell = rec.includes("sell") || rec.includes("बेचें");
                    const isHold = rec.includes("hold") || rec.includes("रोकें") || rec.includes("प्रतीक्षा");
                    
                    let colorClass = "from-amber-500/20 to-yellow-600/10 border-amber-500/50 text-amber-300";
                    let text = t.holdRec;
                    if (isSell) {
                      colorClass = "from-emerald-500/20 to-teal-600/10 border-emerald-500/50 text-emerald-300";
                      text = t.sellRec;
                    } else if (!isHold) {
                      colorClass = "from-sky-500/20 to-blue-600/10 border-sky-500/50 text-sky-300";
                      text = result.orchestratorResponse.finalDecision[lang].toUpperCase();
                    }

                    return (
                      <div className={`px-5 py-3 rounded-full border bg-gradient-to-b ${colorClass} text-sm font-black tracking-wide shadow-md`}>
                        {text}
                      </div>
                    );
                  })()}
                  
                  <span className="text-xs font-bold text-slate-300 mt-1">
                    {result.orchestratorResponse.finalDecision[lang]}
                  </span>
                </div>

                {/* Reason Explanation */}
                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-bold text-emerald-400">{t.reason}</h3>
                  </div>
                  <p className="text-base md:text-xl font-bold leading-relaxed text-slate-100">
                    "{result.orchestratorResponse.oneLineReason[lang]}"
                  </p>
                  {customQuestion && (
                    <div className="mt-4 pt-3 border-t border-slate-900 flex gap-2 text-xs font-semibold text-slate-400">
                      <span>{lang === "en" ? "For Question:" : "प्रश्न के लिए:"}</span>
                      <span className="italic text-slate-300">"{customQuestion}"</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* B. TRANSPARENCY PANEL BAR */}
            <div className="space-y-4">
              <button
                onClick={() => setIsPanelOpen(!isPanelOpen)}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 text-left font-bold text-sm uppercase tracking-wide text-emerald-400 hover:bg-slate-900/80 transition-all shadow"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>{t.transparencyTitle}</span>
                </div>
                {isPanelOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isPanelOpen && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                  
                  {/* CARD 1: WEATHER AGENT */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-lg flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <CloudRain className="w-5 h-5 text-blue-400" />
                          </div>
                          <h4 className="font-extrabold text-sm text-slate-200">{t.weatherAgent}</h4>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-400">WeatherAgent</span>
                      </div>
                      
                      {/* Weather Specifics */}
                      <div className="grid grid-cols-2 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-950">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">{lang === "en" ? "Temperature" : "तापमान"}</span>
                          <span className="text-lg font-extrabold text-slate-100">{result.transparencyData.weather.currentTemp}°C</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">{lang === "en" ? "Condition" : "स्थिति"}</span>
                          <span className="text-xs font-extrabold text-slate-200 line-clamp-1">
                            {splitText(result.transparencyData.weather.condition, lang)}
                          </span>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-slate-900/50">
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">{lang === "en" ? "Weekly Rain Prob" : "साप्ताहिक बारिश की संभावना"}</span>
                          <span className="text-xs font-extrabold text-blue-300">
                            {result.transparencyData.weather.precipitationProbability}% {lang === "en" ? "maximum risk" : "अधिकतम जोखिम"}
                          </span>
                        </div>
                      </div>

                      {/* Advisory Paragraph */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-emerald-400 block uppercase font-bold">{lang === "en" ? "Advisory Summary" : "सलाह सारांश"}</span>
                        <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                          {splitText(result.transparencyData.weather.advisory, lang)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Raw Summary */}
                    <div className="pt-4 border-t border-slate-800/50 text-[10px] text-slate-500 italic">
                      {lang === "en" ? "Weather assessment generated by WeatherAgent via Open-Meteo." : "मौसम एजेंट द्वारा Open-Meteo के माध्यम से जनरेट की गई रिपोर्ट।"}
                    </div>
                  </div>

                  {/* CARD 2: CROP / SOIL AGENT */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-lg flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                            <Sprout className="w-5 h-5 text-emerald-400" />
                          </div>
                          <h4 className="font-extrabold text-sm text-slate-200">{t.cropAgent}</h4>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-900 text-emerald-400">CropSoilAgent</span>
                      </div>

                      {/* Compatibility Gauge Row */}
                      <div className="flex items-center gap-4 bg-slate-950/40 p-3 rounded-xl border border-slate-950">
                        <div className="relative w-14 h-14 flex items-center justify-center rounded-full bg-slate-900 border-2 border-emerald-500/20">
                          <span className="text-sm font-black text-emerald-300">{result.transparencyData.cropSoil.suitabilityScore}%</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">{t.suitability}</span>
                          <p className="text-xs font-extrabold text-slate-100 leading-tight">
                            {splitText(result.transparencyData.cropSoil.suitabilityDescription, lang)}
                          </p>
                        </div>
                      </div>

                      {/* Agriculture Details */}
                      <div className="space-y-3.5">
                        <div>
                          <span className="text-[10px] text-emerald-400 block uppercase font-bold">{t.watering}</span>
                          <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                            {splitText(result.transparencyData.cropSoil.wateringNeeds, lang)}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-400 block uppercase font-bold">{t.fertilizer}</span>
                          <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                            {splitText(result.transparencyData.cropSoil.fertilizerAdvice, lang)}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-500 block uppercase font-bold">{t.pests}</span>
                          <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                            {splitText(result.transparencyData.cropSoil.commonPests, lang)}
                          </p>
                        </div>
                        {result.transparencyData.cropSoil.soilFixes && (
                          <div className="bg-emerald-500/5 p-2.5 rounded-lg border border-emerald-500/10">
                            <span className="text-[10px] text-emerald-400 block uppercase font-bold">{lang === "en" ? "Soil Improvement" : "मिट्टी सुधार"}</span>
                            <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                              {splitText(result.transparencyData.cropSoil.soilFixes, lang)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800/50 text-[10px] text-slate-500 italic">
                      {lang === "en" ? "Soil rules-grounded assessment." : "मृदा विज्ञान नियमों पर आधारित मूल्यांकन।"}
                    </div>
                  </div>

                  {/* CARD 3: MARKET PRICE AGENT */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-lg flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                            <ShoppingBag className="w-5 h-5 text-amber-400" />
                          </div>
                          <h4 className="font-extrabold text-sm text-slate-200">{t.marketAgent}</h4>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-950 border border-amber-900 text-amber-400">MarketAgent</span>
                      </div>

                      {/* Mandi Metrics */}
                      <div className="grid grid-cols-2 gap-2.5 bg-slate-950/40 p-3 rounded-xl border border-slate-950">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">{t.currentPrice}</span>
                          <span className="text-base font-black text-slate-100">₹{simFormat(result.transparencyData.market.currentPrice)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">{t.projection}</span>
                          
                          {(() => {
                            const delta = result.transparencyData.market.projectedPrice7Days - result.transparencyData.market.currentPrice;
                            const isPositive = delta >= 0;
                            const percent = Math.abs(Math.round((delta / result.transparencyData.market.currentPrice) * 100));

                            return (
                              <div className="flex flex-col">
                                <span className="text-base font-black text-slate-100">₹{simFormat(result.transparencyData.market.projectedPrice7Days)}</span>
                                <span className={`text-[10px] font-black inline-flex items-center ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                                  {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                  {percent}% ({isPositive ? (lang === "en" ? "Gain" : "लाभ") : (lang === "en" ? "Drop" : "गिरावट")})
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                        
                        <div className="col-span-2 pt-2 border-t border-slate-900/50 flex justify-between items-center">
                          <div>
                            <span className="text-[10px] text-slate-500 block uppercase font-bold">{t.mspPrice}</span>
                            <span className="text-xs font-bold text-slate-300">₹{simFormat(result.transparencyData.market.mspPrice)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block uppercase font-bold">{t.trend}</span>
                            <span className="text-xs font-extrabold text-teal-400 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {result.transparencyData.market.priceTrend}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Market Advisory Text */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-emerald-400 block uppercase font-bold">{t.recom}</span>
                        <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                          {splitText(result.transparencyData.market.recommendationText, lang)}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800/50 text-[10px] text-slate-500 italic">
                      {lang === "en" ? "Mandi projection simulated relative to regional MSP." : "क्षेत्रीय एमएसपी के सापेक्ष मंडी भाव का सिमुलेशन।"}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* C. VISUAL PRICE CHART CONTAINER */}
            {mounted && chartData.length > 0 && isPanelOpen && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black text-slate-200 uppercase tracking-wider">
                      {lang === "en" ? `${cropDisplayName} Mandi Price Forecast Chart` : `${cropDisplayName} मंडी मूल्य पूर्वानुमान चार्ट`}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {lang === "en"
                        ? "Graph shows the last 15 days of historical mandi prices followed by a 7-day projection."
                        : "यह ग्राफ़ पिछले 15 दिनों के ऐतिहासिक मंडी भाव और उसके बाद 7 दिनों के पूर्वानुमान को दर्शाता है।"}
                    </p>
                  </div>
                  {/* Legend */}
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1 text-slate-400">
                      <span className="w-3 h-3 rounded-sm bg-emerald-500/50 border border-emerald-400" />
                      {lang === "en" ? "Historical Rate" : "ऐतिहासिक मूल्य"}
                    </span>
                    <span className="flex items-center gap-1 text-teal-400">
                      <span className="w-3 h-3 rounded-sm bg-teal-500/20 border border-teal-400 border-dashed" />
                      {lang === "en" ? "7-Day Projected" : "7-दिवसीय पूर्वानुमान"}
                    </span>
                    <span className="flex items-center gap-1 text-red-400">
                      <span className="w-5 border-t border-red-500 border-dashed" />
                      {lang === "en" ? "Government MSP" : "सरकारी एमएसपी"}
                    </span>
                  </div>
                </div>

                {/* Recharts Area Chart */}
                <div className="h-64 md:h-80 w-full bg-slate-950/30 p-3 rounded-2xl border border-slate-950">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        tick={{ fontSize: 10, fontWeight: "bold" }}
                      />
                      <YAxis
                        stroke="#64748b"
                        domain={["auto", "auto"]}
                        tickFormatter={(value) => `₹${value}`}
                        tick={{ fontSize: 10, fontWeight: "bold" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: "12px",
                          color: "#f8fafc",
                          fontSize: "12px",
                          fontWeight: "bold"
                        }}
                        formatter={(value) => [`₹${simFormat(Number(value))}`, lang === "en" ? "Mandi Rate" : "मंडी दर"]}
                      />
                      <ReferenceLine
                        y={result.transparencyData.market.mspPrice}
                        stroke="#ef4444"
                        strokeDasharray="4 4"
                        label={{
                          value: `${lang === "en" ? "MSP" : "एमएसपी"}: ₹${result.transparencyData.market.mspPrice}`,
                          fill: "#f87171",
                          fontSize: 10,
                          fontWeight: "bold",
                          position: "top"
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 6. Footer section */}
      <footer className="border-t border-emerald-950 bg-slate-950/80 py-8 text-center text-xs text-slate-500 font-semibold space-y-2 mt-20">
        <p>🌾 KisanMitra AI — Empowering Indian Farmers with Multi-Agent Decision Intelligence 🌾</p>
        <p>Kaggle "Agents for Good" Capstone Project Submission. Powered by Google ADK Patterns & Gemini.</p>
      </footer>
    </div>
  );
}

// Utility to format price
function simFormat(num: number) {
  return Number(num).toLocaleString('en-IN');
}
