'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type LangCode = 'en'|'hi'|'mr'|'ta'|'te'|'bn'|'gu'|'kn';

export const LANGUAGES: Record<LangCode, string> = {
  en: 'English', hi: 'हिंदी', mr: 'मराठी', ta: 'தமிழ்',
  te: 'తెలుగు', bn: 'বাংলা', gu: 'ગુજરાતી', kn: 'ಕನ್ನಡ',
};

type Dict = Record<string, string>;

const TRANSLATIONS: Record<LangCode, Dict> = {
  en: {
    home:'Home', dashboard:'Dashboard', needs:'Needs', volunteers:'Volunteers',
    assignments:'Assignments', ingest:'Ingest Data', report_need:'+ Report Need',
    search:'Search', filter:'Filter', clear:'Clear', submit:'Submit',
    register:'Register', back:'← Back', loading:'Loading…', error:'Error',
    find_matches:'Find AI Matches', assign:'Assign This Volunteer', assigned:'✓ Assigned',
    validate_ai:'🤖 Validate with AI', ask_sevabot:'💬 Ask SevaBot',
    show_volunteers:'Show Volunteers', critical:'Critical', high:'High',
    moderate:'Moderate', low:'Low', total_needs:'Total Needs',
    active_needs:'Active Needs', matched:'Matched', volunteers_active:'Volunteers Active',
    needs_by_category:'Needs by Category', live_activity:'⚡ Live Activity',
    community_needs:'Community Needs', report_a_need:'Report a Community Need',
    volunteer_register:'Volunteer Registration', assignments_board:'Assignments Board',
    ingest_hub:'Data Ingestion Hub', whatsapp_tab:'WhatsApp', csv_tab:'CSV Upload',
    text_tab:'Raw Text / AI', name:'Name', phone:'Phone', location:'Location',
    skills:'Skills', languages_spoken:'Languages', experience:'Experience',
    has_vehicle:'Has Vehicle', urgency:'Urgency', type:'Type', status:'Status',
    affected:'Affected', description:'Description', title:'Title',
    no_results:'No results found.', cancel:'Cancel', complete:'Mark Complete',
    pending:'Pending', active:'Active', completed:'Completed',
  },
  hi: {
    home:'होम', dashboard:'डैशबोर्ड', needs:'जरूरतें', volunteers:'स्वयंसेवक',
    assignments:'असाइनमेंट', ingest:'डेटा जोड़ें', report_need:'+ जरूरत बताएं',
    search:'खोजें', filter:'फ़िल्टर', clear:'साफ करें', submit:'जमा करें',
    register:'पंजीकरण', back:'← वापस', loading:'लोड हो रहा है…', error:'त्रुटि',
    find_matches:'AI मिलान खोजें', assign:'स्वयंसेवक नियुक्त करें', assigned:'✓ नियुक्त',
    validate_ai:'🤖 AI से सत्यापित करें', ask_sevabot:'💬 SevaBot से पूछें',
    show_volunteers:'स्वयंसेवक दिखाएं', critical:'अत्यंत जरूरी', high:'उच्च',
    moderate:'मध्यम', low:'कम', total_needs:'कुल जरूरतें',
    active_needs:'सक्रिय जरूरतें', matched:'मिलान', volunteers_active:'सक्रिय स्वयंसेवक',
    needs_by_category:'श्रेणी अनुसार', live_activity:'⚡ लाइव गतिविधि',
    community_needs:'सामुदायिक जरूरतें', report_a_need:'जरूरत रिपोर्ट करें',
    volunteer_register:'स्वयंसेवक पंजीकरण', assignments_board:'असाइनमेंट बोर्ड',
    ingest_hub:'डेटा प्रविष्टि केंद्र', whatsapp_tab:'WhatsApp', csv_tab:'CSV अपलोड',
    text_tab:'सीधा पाठ / AI', name:'नाम', phone:'फ़ोन', location:'स्थान',
    skills:'कौशल', languages_spoken:'भाषाएँ', experience:'अनुभव',
    has_vehicle:'वाहन है', urgency:'तात्कालिकता', type:'प्रकार', status:'स्थिति',
    affected:'प्रभावित', description:'विवरण', title:'शीर्षक',
    no_results:'कोई परिणाम नहीं मिला।', cancel:'रद्द', complete:'पूर्ण करें',
    pending:'लंबित', active:'सक्रिय', completed:'पूर्ण',
  },
  mr: {
    home:'मुख्यपृष्ठ', dashboard:'डॅशबोर्ड', needs:'गरजा', volunteers:'स्वयंसेवक',
    assignments:'नेमणुका', ingest:'डेटा जोडा', report_need:'+ गरज नोंदवा',
    search:'शोधा', filter:'फिल्टर', clear:'साफ करा', submit:'सबमिट करा',
    register:'नोंदणी', back:'← मागे', loading:'लोड होत आहे…', error:'त्रुटी',
    find_matches:'AI जुळणी शोधा', assign:'स्वयंसेवक नेमा', assigned:'✓ नेमले',
    validate_ai:'🤖 AI ने तपासा', ask_sevabot:'💬 SevaBot ला विचारा',
    show_volunteers:'स्वयंसेवक दाखवा', critical:'अत्यंत तातडीचे', high:'उच्च',
    moderate:'मध्यम', low:'कमी', total_needs:'एकूण गरजा',
    active_needs:'सक्रिय गरजा', matched:'जुळलेल्या', volunteers_active:'सक्रिय स्वयंसेवक',
    needs_by_category:'श्रेणीनुसार', live_activity:'⚡ थेट क्रियाकलाप',
    community_needs:'सामुदायिक गरजा', report_a_need:'गरज नोंदवा',
    volunteer_register:'स्वयंसेवक नोंदणी', assignments_board:'नेमणूक बोर्ड',
    ingest_hub:'डेटा प्रवेश केंद्र', whatsapp_tab:'WhatsApp', csv_tab:'CSV अपलोड',
    text_tab:'थेट मजकूर / AI', name:'नाव', phone:'फोन', location:'स्थान',
    skills:'कौशल्ये', languages_spoken:'भाषा', experience:'अनुभव',
    has_vehicle:'वाहन आहे', urgency:'तातडी', type:'प्रकार', status:'स्थिती',
    affected:'प्रभावित', description:'वर्णन', title:'शीर्षक',
    no_results:'कोणतेही निकाल नाहीत।', cancel:'रद्द करा', complete:'पूर्ण करा',
    pending:'प्रलंबित', active:'सक्रिय', completed:'पूर्ण',
  },
  ta: {
    home:'முகப்பு', dashboard:'டாஷ்போர்டு', needs:'தேவைகள்', volunteers:'தன்னார்வலர்கள்',
    assignments:'பணிகள்', ingest:'தரவு சேர்', report_need:'+ தேவை தெரிவி',
    search:'தேடு', filter:'வடிகட்டு', clear:'அழி', submit:'சமர்ப்பி',
    register:'பதிவு', back:'← திரும்பு', loading:'ஏற்றுகிறது…', error:'பிழை',
    find_matches:'AI பொருத்தங்கள்', assign:'தன்னார்வலரை நியமி', assigned:'✓ நியமிக்கப்பட்டது',
    validate_ai:'🤖 AIயால் சரிபார்', ask_sevabot:'💬 SevaBot கேள்',
    show_volunteers:'தன்னார்வலர்கள் காட்டு', critical:'மிக அவசரம்', high:'அதிகம்',
    moderate:'மிதமான', low:'குறைவு', total_needs:'மொத்த தேவைகள்',
    active_needs:'செயலில் தேவைகள்', matched:'பொருந்தியவை', volunteers_active:'செயலில் தன்னார்வலர்கள்',
    needs_by_category:'வகைவாரியாக', live_activity:'⚡ நேரடி செயல்பாடு',
    community_needs:'சமூக தேவைகள்', report_a_need:'தேவை தெரிவி',
    volunteer_register:'தன்னார்வலர் பதிவு', assignments_board:'பணி பலகை',
    ingest_hub:'தரவு உள்ளீட்டு மையம்', whatsapp_tab:'WhatsApp', csv_tab:'CSV பதிவேற்றம்',
    text_tab:'நேரடி உரை / AI', name:'பெயர்', phone:'தொலைபேசி', location:'இடம்',
    skills:'திறன்கள்', languages_spoken:'மொழிகள்', experience:'அனுபவம்',
    has_vehicle:'வாகனம் உள்ளது', urgency:'அவசரம்', type:'வகை', status:'நிலை',
    affected:'பாதிக்கப்பட்டவர்கள்', description:'விளக்கம்', title:'தலைப்பு',
    no_results:'முடிவுகள் இல்லை.', cancel:'ரத்து', complete:'முடி',
    pending:'நிலுவை', active:'செயலில்', completed:'முடிந்தது',
  },
  te: {
    home:'హోమ్', dashboard:'డాష్‌బోర్డ్', needs:'అవసరాలు', volunteers:'స్వచ్ఛంద సేవకులు',
    assignments:'అసైన్‌మెంట్లు', ingest:'డేటా జోడించు', report_need:'+ అవసరం తెలియజేయి',
    search:'వెతుకు', filter:'వడపోత', clear:'క్లియర్', submit:'సమర్పించు',
    register:'నమోదు', back:'← వెనుక', loading:'లోడవుతోంది…', error:'లోపం',
    find_matches:'AI సరిపోలికలు', assign:'స్వచ్ఛంద సేవకుడిని నియమించు', assigned:'✓ నియమించబడింది',
    validate_ai:'🤖 AIతో ధృవీకరించు', ask_sevabot:'💬 SevaBot అడుగు',
    show_volunteers:'స్వచ్ఛంద సేవకులు చూపు', critical:'అత్యవసరం', high:'అధికం',
    moderate:'మధ్యస్థం', low:'తక్కువ', total_needs:'మొత్తం అవసరాలు',
    active_needs:'చురుకైన అవసరాలు', matched:'సరిపోలినవి', volunteers_active:'చురుకైన సేవకులు',
    needs_by_category:'వర్గం ప్రకారం', live_activity:'⚡ లైవ్ కార్యకలాపం',
    community_needs:'సాముదాయిక అవసరాలు', report_a_need:'అవసరం నివేదించు',
    volunteer_register:'స్వచ్ఛంద సేవకుడు నమోదు', assignments_board:'అసైన్‌మెంట్ బోర్డ్',
    ingest_hub:'డేటా ఇన్‌పుట్ కేంద్రం', whatsapp_tab:'WhatsApp', csv_tab:'CSV అప్‌లోడ్',
    text_tab:'నేరుగా వచనం / AI', name:'పేరు', phone:'ఫోన్', location:'స్థానం',
    skills:'నైపుణ్యాలు', languages_spoken:'భాషలు', experience:'అనుభవం',
    has_vehicle:'వాహనం ఉంది', urgency:'అత్యవసరత', type:'రకం', status:'స్థితి',
    affected:'ప్రభావితమైనవారు', description:'వివరణ', title:'శీర్షిక',
    no_results:'ఫలితాలు లేవు.', cancel:'రద్దు చేయి', complete:'పూర్తి చేయి',
    pending:'పెండింగ్', active:'చురుకైన', completed:'పూర్తయింది',
  },
  bn: {
    home:'হোম', dashboard:'ড্যাশবোর্ড', needs:'প্রয়োজনীয়তা', volunteers:'স্বেচ্ছাসেবক',
    assignments:'নিয়োগ', ingest:'তথ্য যোগ করুন', report_need:'+ প্রয়োজন জানান',
    search:'খুঁজুন', filter:'ফিল্টার', clear:'মুছুন', submit:'জমা দিন',
    register:'নিবন্ধন', back:'← পিছনে', loading:'লোড হচ্ছে…', error:'ত্রুটি',
    find_matches:'AI মিল খুঁজুন', assign:'স্বেচ্ছাসেবক নিয়োগ করুন', assigned:'✓ নিযুক্ত',
    validate_ai:'🤖 AI দিয়ে যাচাই করুন', ask_sevabot:'💬 SevaBot জিজ্ঞাসা করুন',
    show_volunteers:'স্বেচ্ছাসেবক দেখান', critical:'অত্যন্ত জরুরি', high:'উচ্চ',
    moderate:'মাঝারি', low:'কম', total_needs:'মোট প্রয়োজন',
    active_needs:'সক্রিয় প্রয়োজন', matched:'মিলিয়েছে', volunteers_active:'সক্রিয় স্বেচ্ছাসেবক',
    needs_by_category:'বিভাগ অনুসারে', live_activity:'⚡ লাইভ কার্যকলাপ',
    community_needs:'সামুদায়িক প্রয়োজন', report_a_need:'প্রয়োজন জানান',
    volunteer_register:'স্বেচ্ছাসেবক নিবন্ধন', assignments_board:'নিয়োগ বোর্ড',
    ingest_hub:'ডেটা প্রবেশ কেন্দ্র', whatsapp_tab:'WhatsApp', csv_tab:'CSV আপলোড',
    text_tab:'সরাসরি পাঠ্য / AI', name:'নাম', phone:'ফোন', location:'অবস্থান',
    skills:'দক্ষতা', languages_spoken:'ভাষা', experience:'অভিজ্ঞতা',
    has_vehicle:'গাড়ি আছে', urgency:'জরুরিতা', type:'ধরন', status:'অবস্থা',
    affected:'প্রভাবিত', description:'বিবরণ', title:'শিরোনাম',
    no_results:'কোনো ফলাফল নেই।', cancel:'বাতিল', complete:'সম্পন্ন করুন',
    pending:'মুলতুবি', active:'সক্রিয়', completed:'সম্পন্ন',
  },
  gu: {
    home:'હોમ', dashboard:'ડૅશબૉર્ડ', needs:'જરૂરિયાતો', volunteers:'સ્વયંસેવકો',
    assignments:'સોંપણીઓ', ingest:'ડેટા ઉમેરો', report_need:'+ જરૂર જણાવો',
    search:'શોધો', filter:'ફિલ્ટર', clear:'સાફ', submit:'સબમિટ',
    register:'નોંધણી', back:'← પાછળ', loading:'લૉડ થઈ રહ્યું છે…', error:'ભૂલ',
    find_matches:'AI મેળ શોધો', assign:'સ્વયંસેવક નિયુક્ત કરો', assigned:'✓ નિયુક્ત',
    validate_ai:'🤖 AI વડે ચકાસો', ask_sevabot:'💬 SevaBot પૂછો',
    show_volunteers:'સ્વયંસેવકો બતાવો', critical:'અત્યંત જરૂરી', high:'ઉચ્ચ',
    moderate:'મધ્યમ', low:'ઓછો', total_needs:'કુલ જરૂરિયાતો',
    active_needs:'સક્રિય જરૂરિયાતો', matched:'મળેલ', volunteers_active:'સક્રિય સ્વયંસેવકો',
    needs_by_category:'શ્રેણી અનુસાર', live_activity:'⚡ લાઇવ પ્રવૃત્તિ',
    community_needs:'સામુદાયિક જરૂરિયાતો', report_a_need:'જરૂરિયાત જણાવો',
    volunteer_register:'સ્વયંસેવક નોંધણી', assignments_board:'સોંપણી બૉર્ડ',
    ingest_hub:'ડેટા એન્ટ્રી કેન્દ્ર', whatsapp_tab:'WhatsApp', csv_tab:'CSV અપલોડ',
    text_tab:'સીધો ટેક્સ્ટ / AI', name:'નામ', phone:'ફોન', location:'સ્થળ',
    skills:'કૌશل્ય', languages_spoken:'ભાષાઓ', experience:'અનુભવ',
    has_vehicle:'વાહન છે', urgency:'તાત્કાલિકતા', type:'પ્રકાર', status:'સ્થિતિ',
    affected:'પ્રભાવિત', description:'વર્ણન', title:'શીર્ષક',
    no_results:'કોઈ પરિણામ નથી.', cancel:'રદ', complete:'પૂર્ણ કરો',
    pending:'બાકી', active:'સક્રિય', completed:'પૂર્ણ',
  },
  kn: {
    home:'ಮುಖಪುಟ', dashboard:'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', needs:'ಅಗತ್ಯಗಳು', volunteers:'ಸ್ವಯಂಸೇವಕರು',
    assignments:'ನಿಯೋಜನೆಗಳು', ingest:'ಡೇಟಾ ಸೇರಿಸಿ', report_need:'+ ಅಗತ್ಯ ತಿಳಿಸಿ',
    search:'ಹುಡುಕಿ', filter:'ಫಿಲ್ಟರ್', clear:'ತೆರವು', submit:'ಸಲ್ಲಿಸಿ',
    register:'ನೋಂದಣಿ', back:'← ಹಿಂದೆ', loading:'ಲೋಡ್ ಆಗುತ್ತಿದೆ…', error:'ದೋಷ',
    find_matches:'AI ಹೊಂದಾಣಿಕೆ ಹುಡುಕಿ', assign:'ಸ್ವಯಂಸೇವಕ ನೇಮಿಸಿ', assigned:'✓ ನೇಮಿಸಲಾಗಿದೆ',
    validate_ai:'🤖 AIಯಿಂದ ಪರಿಶೀಲಿಸಿ', ask_sevabot:'💬 SevaBot ಕೇಳಿ',
    show_volunteers:'ಸ್ವಯಂಸೇವಕರು ತೋರಿಸಿ', critical:'ಅತ್ಯಂತ ತುರ್ತು', high:'ಹೆಚ್ಚು',
    moderate:'ಮಧ್ಯಮ', low:'ಕಡಿಮೆ', total_needs:'ಒಟ್ಟು ಅಗತ್ಯಗಳು',
    active_needs:'ಸಕ್ರಿಯ ಅಗತ್ಯಗಳು', matched:'ಹೊಂದಾಣಿಕೆಯಾದ', volunteers_active:'ಸಕ್ರಿಯ ಸ್ವಯಂಸೇವಕರು',
    needs_by_category:'ವರ್ಗದ ಪ್ರಕಾರ', live_activity:'⚡ ನೇರ ಚಟುವಟಿಕೆ',
    community_needs:'ಸಮುದಾಯ ಅಗತ್ಯಗಳು', report_a_need:'ಅಗತ್ಯ ವರದಿ ಮಾಡಿ',
    volunteer_register:'ಸ್ವಯಂಸೇವಕ ನೋಂದಣಿ', assignments_board:'ನಿಯೋಜನೆ ಬೋರ್ಡ್',
    ingest_hub:'ಡೇಟಾ ಇನ್‌ಪುಟ್ ಕೇಂದ್ರ', whatsapp_tab:'WhatsApp', csv_tab:'CSV ಅಪ್‌ಲೋಡ್',
    text_tab:'ನೇರ ಪಠ್ಯ / AI', name:'ಹೆಸರು', phone:'ಫೋನ್', location:'ಸ್ಥಳ',
    skills:'ಕೌಶಲ್ಯಗಳು', languages_spoken:'ಭಾಷೆಗಳು', experience:'ಅನುಭವ',
    has_vehicle:'ವಾಹನ ಇದೆ', urgency:'ತುರ್ತು', type:'ಪ್ರಕಾರ', status:'ಸ್ಥಿತಿ',
    affected:'ಪ್ರಭಾವಿತ', description:'ವಿವರಣೆ', title:'ಶೀರ್ಷಿಕೆ',
    no_results:'ಯಾವುದೇ ಫಲಿತಾಂಶಗಳಿಲ್ಲ.', cancel:'ರದ್ದು', complete:'ಪೂರ್ಣಗೊಳಿಸಿ',
    pending:'ಬಾಕಿ', active:'ಸಕ್ರಿಯ', completed:'ಪೂರ್ಣ',
  },
};

interface I18nContextValue {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (key: string) => string;
}

import React from 'react';
export const I18nContext = createContext<I18nContextValue>({
  lang: 'en', setLang: () => {}, t: (k) => k,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>('en');

  useEffect(() => {
    const saved = localStorage.getItem('seva_lang') as LangCode | null;
    if (saved && TRANSLATIONS[saved]) setLangState(saved);
  }, []);

  const setLang = (l: LangCode) => {
    setLangState(l);
    localStorage.setItem('seva_lang', l);
  };

  const t = (key: string) =>
    TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS['en']?.[key] ?? key;

  return React.createElement(I18nContext.Provider, { value: { lang, setLang, t } }, children);
}

export const useLanguage = () => useContext(I18nContext);
