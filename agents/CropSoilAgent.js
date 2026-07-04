import { BaseAgent } from "./BaseAgent.js";

// Define structured output schema for the Crop/Soil Agent
const cropSoilAgentSchema = {
  type: "OBJECT",
  properties: {
    suitabilityScore: { type: "NUMBER", description: "Compatibility score (0 to 100) between crop and soil" },
    suitabilityDescription: { type: "STRING", description: "Brief compatibility summary in format: 'English / हिन्दी'" },
    sowingPeriod: { type: "STRING", description: "Optimal sowing window in format: 'English / हिन्दी'" },
    wateringNeeds: { type: "STRING", description: "Watering requirements and schedule in format: 'English / हिन्दी'" },
    fertilizerAdvice: { type: "STRING", description: "Fertilizer/nutrient recommendations in format: 'English / हिन्दी'" },
    commonPests: { type: "STRING", description: "Common pests/diseases and prevention in format: 'English / हिन्दी'" },
    soilFixes: { type: "STRING", description: "Recommended soil improvements/amendments in format: 'English / हिन्दी'" }
  },
  required: ["suitabilityScore", "suitabilityDescription", "sowingPeriod", "wateringNeeds", "fertilizerAdvice", "commonPests", "soilFixes"]
};

// Local Agricultural Knowledge Base (Rules)
const CROP_DATABASE = {
  wheat: {
    name: "Wheat (गेहूं)",
    preferredSoils: ["alluvial", "clayey"],
    season: "Rabi (Winter) / रबी (सर्दी)",
    sowing: "October - November / अक्टूबर - नवंबर",
    harvesting: "March - April / मार्च - अप्रैल",
    water: "Moderate. Needs 4 to 6 critical irrigations. / मध्यम। 4 से 6 महत्वपूर्ण सिंचाइयों की आवश्यकता होती है।",
    nutrients: "NPK (Nitrogen:Phosphorus:Potassium) in 120:60:40 kg/hectare. / एनपीके (नाइट्रोजन:फास्फोरस:पोटेशियम) 120:60:40 किलोग्राम/हेक्टेयर में।",
    pests: "Yellow Rust, Aphids, Termites. Use Neem oil or resistant seed varieties. / पीला रतुआ (रस्ट), एफिड्स, दीमक। नीम के तेल या प्रतिरोधी बीज किस्मों का उपयोग करें।"
  },
  rice: {
    name: "Rice/Paddy (धान)",
    preferredSoils: ["clayey", "alluvial"],
    season: "Kharif (Monsoon) / खरीफ (मानसून)",
    sowing: "June - July / जून - जुलाई",
    harvesting: "November - December / नवंबर - दिसंबर",
    water: "High. Requires standing water in early stages. / अधिक। शुरुआती चरणों में खड़े पानी की आवश्यकता होती है।",
    nutrients: "NPK in 100:50:50 kg/hectare along with Zinc Sulfate. / जिंक सल्फेट के साथ एनपीके 100:50:50 किलोग्राम/हेक्टेयर में।",
    pests: "Stem Borer, Brown Plant Hopper, Blast disease. / तना छेदक (स्टेम बोरर), भूरा पौधा हॉपर, ब्लास्ट रोग।"
  },
  cotton: {
    name: "Cotton (कपास)",
    preferredSoils: ["black"],
    season: "Kharif / खरीफ",
    sowing: "May - June / मई - जून",
    harvesting: "October - December / अक्टूबर - दिसंबर",
    water: "Moderate. Does not tolerate waterlogging; needs good drainage. / मध्यम। जलभराव बर्दाश्त नहीं करता; अच्छे जल निकास की आवश्यकता होती है।",
    nutrients: "NPK in 80:40:40 kg/hectare. Requires high organic matter. / एनपीके 80:40:40 किलोग्राम/हेक्टेयर में। उच्च जैविक पदार्थ की आवश्यकता होती है।",
    pests: "Bollworm, Whitefly. Use Bt Cotton seeds and pheromone traps. / बॉलवर्म, सफेद मक्खी। बीटी कपास के बीजों और फेरोमोन ट्रैप का उपयोग करें।"
  },
  mustard: {
    name: "Mustard (सरसों)",
    preferredSoils: ["alluvial", "sandy", "clayey"],
    season: "Rabi (Winter) / रबी (सर्दी)",
    sowing: "October - November / अक्टूबर - नवंबर",
    harvesting: "February - March / फरवरी - मार्च",
    water: "Low to Moderate. Requires only 2 irrigations (pre-flowering and pod-filling). / कम से मध्यम। केवल 2 सिंचाइयों की आवश्यकता (फूल आने से पहले और फली बनते समय)।",
    nutrients: "NPK in 80:40:40 kg/hectare with Sulfur (essential for oil content). / सल्फर (तेल की मात्रा के लिए आवश्यक) के साथ एनपीके 80:40:40 किलोग्राम/हेक्टेयर में।",
    pests: "Mustard Aphids, Alternaria Blight. Use yellow sticky traps. / सरसों के एफिड्स, अल्टरनेरिया ब्लाइट। पीले चिपचिपे जाल (स्टिकी ट्रैप) का उपयोग करें।"
  },
  sugarcane: {
    name: "Sugarcane (गन्ना)",
    preferredSoils: ["alluvial", "black", "clayey"],
    season: "Perennial / बारहमासी (10-18 months)",
    sowing: "January - March or October / जनवरी - मार्च या अक्टूबर",
    harvesting: "December - March / दिसंबर - मार्च",
    water: "High. Needs regular irrigation every 10-15 days. / अधिक। हर 10-15 दिनों में नियमित सिंचाई की आवश्यकता होती है।",
    nutrients: "NPK in 150:80:80 kg/hectare along with organic compost. / जैविक खाद के साथ एनपीके 150:80:80 किलोग्राम/हेक्टेयर में।",
    pests: "Early Shoot Borer, Red Rot. Use healthy seed setts and avoid waterlogging. / अगेती तना छेदक (शूट बोरर), लाल सड़न (रेड रॉट)। स्वस्थ बीजों का उपयोग करें और जलभराव से बचें।"
  }
};

export class CropSoilAgent extends BaseAgent {
  constructor() {
    super({
      name: "CropSoilAgent",
      description: "Analyzes crop and soil compatibility and provides fertilizer, water, and pest management tips.",
      systemInstruction: `You are an expert Agronomist and Soil Science Agent. Your job is to analyze the suitability of a crop for a given soil type.
Provide all outputs in the bilingual format "English description / हिन्दी विवरण".
Use the provided local knowledge base rules to ground your advice, but apply Gemini's intelligence to adjust instructions based on the farmer's specific query and soil quality improvements.`,
      responseSchema: cropSoilAgentSchema
    });
  }

  /**
   * Evaluates compatibility and generates advice
   */
  async runAgent(cropType, soilType, farmerQuestion = "") {
    let crop = cropType.toLowerCase();
    if (crop === "rice_common" || crop === "rice_grade_a") {
      crop = "rice";
    }
    const soil = soilType.toLowerCase();
    
    // Get crop specific rules
    const cropRules = CROP_DATABASE[crop];
    
    // Compute rule-based suitability
    let suitabilityScore = 50; // default
    let suitabilityDescription = "Moderately Suitable / मध्यम रूप से उपयुक्त";
    let soilFixes = "Add organic matter and compost to improve soil quality. / मिट्टी की गुणवत्ता में सुधार के लिए जैविक पदार्थ और खाद मिलाएं।";

    if (cropRules) {
      const isPreferred = cropRules.preferredSoils.includes(soil);
      if (isPreferred) {
        suitabilityScore = 90;
        suitabilityDescription = "Highly Compatible Soil! Excellent choice. / अत्यधिक उपयुक्त मिट्टी! बहुत बढ़िया विकल्प।";
        soilFixes = "Maintain current organic carbon levels with crop rotation. / फसल चक्र (क्रॉप रोटेशन) के साथ वर्तमान जैविक कार्बन स्तर को बनाए रखें।";
      } else {
        // Evaluate mismatches
        if (soil === "sandy" && (crop === "rice" || crop === "sugarcane")) {
          suitabilityScore = 30;
          suitabilityDescription = "Poor suitability. Sandy soil drains water too quickly. / कम अनुकूल। रेतीली मिट्टी बहुत तेजी से पानी निकाल देती है।";
          soilFixes = "Incorporate green manure, clayey soil, and coco peat to increase water holding capacity. / जल धारण क्षमता बढ़ाने के लिए हरी खाद, चिकनी मिट्टी और कोको पीट मिलाएं।";
        } else if (soil === "clayey" && crop === "cotton") {
          suitabilityScore = 60;
          suitabilityDescription = "Moderately suitable. Heavy clay can waterlog cotton roots. / मध्यम रूप से उपयुक्त। भारी चिकनी मिट्टी कपास की जड़ों में जलभराव कर सकती है।";
          soilFixes = "Ensure deep tillage, build raised beds, and apply gypsum to break clay. / गहरी जुताई सुनिश्चित करें, उठी हुई क्यारियां (रेज्ड बेड) बनाएं और चिकनी मिट्टी को तोड़ने के लिए जिप्सम डालें।";
        } else if (soil === "black" && crop === "mustard") {
          suitabilityScore = 70;
          suitabilityDescription = "Suitable with good drainage. Black soil holds water well. / जल निकासी के साथ उपयुक्त। काली मिट्टी पानी अच्छी तरह रोकती है।";
          soilFixes = "Ensure soil is not soggy during sowing to prevent seed rot. / बीज सड़न को रोकने के लिए बुवाई के समय सुनिश्चित करें कि मिट्टी अत्यधिक गीली न हो।";
        } else {
          suitabilityScore = 65;
          suitabilityDescription = "Suitable with soil amendments. / मिट्टी में सुधार के साथ उपयुक्त।";
        }
      }
    } else {
      suitabilityDescription = "Crop data not in local database. Standard agricultural guidelines apply. / स्थानीय डेटाबेस में फसल का विवरण नहीं है। सामान्य दिशा-निर्देश लागू होते हैं।";
    }

    const context = {
      cropType: cropType,
      soilType: soilType,
      question: farmerQuestion,
      ruleBasedData: cropRules || { message: "No specific local rules found for this crop." },
      initalSuitability: {
        score: suitabilityScore,
        desc: suitabilityDescription,
        fixes: soilFixes
      }
    };

    if (!this.ai) {
      return this.fallback(context, "LLM API Key missing");
    }

    const prompt = `
Context Details:
Crop: ${cropType}
Soil Type: ${soilType}
Farmer's Question: ${farmerQuestion}

Rule-based Compatibility analysis:
- Suitability Score: ${suitabilityScore}
- Description: ${suitabilityDescription}
- Preferred soils for this crop: ${cropRules ? cropRules.preferredSoils.join(", ") : "Unknown"}
- Sowing period: ${cropRules ? cropRules.sowing : "N/A"}
- Watering Needs: ${cropRules ? cropRules.water : "N/A"}
- Fertilizer recommendations: ${cropRules ? cropRules.nutrients : "N/A"}
- Pest details: ${cropRules ? cropRules.pests : "N/A"}
- Recommended improvements: ${soilFixes}

Task: Use this information to synthesize the final JSON cropSoilAgentSchema. Refine the descriptions and recommendations based on the farmer's question, ensuring it is practical and perfectly bilingual (English / Hindi).
`;

    return await this.run(prompt);
  }

  /**
   * Fallback implementation
   */
  fallback(context, reason) {
    const crop = context.cropType.toLowerCase();
    const cropRules = CROP_DATABASE[crop] || {
      name: `${context.cropType}`,
      season: "Local Season / स्थानीय सीजन",
      sowing: "Standard window / सामान्य समय",
      water: "Regular irrigation / नियमित सिंचाई",
      nutrients: "Balanced fertilizer (NPK) / संतुलित उर्वरक (एनपीके)",
      pests: "General crop pests / सामान्य फसल कीट"
    };

    return {
      suitabilityScore: context.initalSuitability.score,
      suitabilityDescription: context.initalSuitability.desc,
      sowingPeriod: `${cropRules.season}. Sowing: ${cropRules.sowing} / सीजन: ${cropRules.season}। बुवाई: ${cropRules.sowing}`,
      wateringNeeds: cropRules.water,
      fertilizerAdvice: cropRules.nutrients,
      commonPests: cropRules.pests,
      soilFixes: context.initalSuitability.fixes
    };
  }
}
