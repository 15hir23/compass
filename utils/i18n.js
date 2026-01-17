import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Translation data
const translations = {
  en: {
    // Header
    'app.title': 'NiraVastuAI',
    'app.subtitle': 'Vastu science from experts through AI',
    'header.search': 'Search Location',
    'header.selectCompass': 'Select Compasses Type',
    
    // Compass Types
    'compass.normal': 'Normal Compass',
    'compass.normal.subtitle': 'Basic directional guidance',
    'compass.vastu16': '16 Zone Vastu Compass',
    'compass.vastu16.subtitle': 'Traditional 16-zone analysis',
    'compass.vastu32': '32 Zone Vastu Compass',
    'compass.vastu32.subtitle': 'Detailed 32-zone precision',
    'compass.chakra': 'Vastu Chakra',
    'compass.chakra.subtitle': 'Energy center mapping',
    
    // Map View
    'map.loading': 'Loading Map...',
    'map.error': 'Unable to load map',
    'map.cornerSelection.title': 'Adjust Plot Corners',
    'map.cornerSelection.subtitle': 'Drag the 4 red numbered dots to mark your plot boundaries',
    'map.gridActive.title': 'Vastu Grid Active',
    'map.gridActive.subtitle': '81 Padas • Brahmasthan (Sacred Center) highlighted',
    'map.geoCoordinate': 'Geo-Coordinate:',
    'map.latitude': 'Latitude',
    'map.longitude': 'Longitude',
    'map.compassToggle': 'Compass',
    'map.mapView': 'Map',
    'map.satelliteView': 'Satellite',
    'map.mapType': 'Map Type',
    'map.satellite': 'Satellite',
    'map.vastuGrid': 'Vastu Grid',
    'map.selectCorners': 'Select Corners',
    'map.applyGrid': 'Apply Grid',
    'map.clearGrid': 'Clear Grid',
    'map.outerLayer': 'Outer',
    'map.middleLayer': 'Middle',
    'map.centerLayer': 'Center',
    'map.showLabels': 'Show Labels',
    'map.hideLabels': 'Hide Labels',
    'map.showBrahma': 'Show Brahma',
    'map.hideBrahma': 'Hide Brahma',
    'map.download': 'Download',
    'map.recenter': 'Recenter',
    'map.lock': 'Lock',
    'map.unlock': 'Unlock',
    'map.talkToExpert': 'Talk to Expert',
    'map.goToLocation': 'Go to Location',
    
    // Instructions
    'instructions.title': 'How to Use Vastu Compass',
    'instructions.step1': 'Select a compass type from the home screen (Normal, 16 Zone, 32 Zone, or Chakra).',
    'instructions.step2': 'Hold your device flat and allow the compass to calibrate. The red needle will point to magnetic North.',
    'instructions.step3': 'Use the "Search Location" button to find and set a specific location for accurate readings.',
    'instructions.step4': 'Use the "Capture" button to take a photo that will be displayed behind the compass for reference.',
    'instructions.step5': 'Adjust the image size using the +/- buttons to see more or less of your captured image.',
    'instructions.step6': 'The compass uses tilt compensation for maximum accuracy, so it works even when your device is slightly tilted.',
    
    // Footer
    'footer.vastu': 'NiraVastuAI',
    'footer.com': '',
    
    // Buttons & Actions
    'button.googleMap': 'Google map',
    'button.rearCamera': 'Rear Camera',
    'button.capture': 'Capture',
    'button.lastCaptured': 'Last Captured',
    
    // Direction & Info
    'direction.title': 'DIRECTION',
    'info.geoCoordinate': 'Geo-Coordinate:',
    'info.locationPermission': 'Location Permission Required (Click Here)',
    'info.magneticField': 'Magnetic Field:',
    'info.strength': 'Strength',
    'info.currentLocation': 'Current Location',
    'info.useCurrentLocation': 'Use Current Location',
    
    // Gallery
    'gallery.title': 'Captured Images',
    'gallery.noImages': 'No images captured yet',
    
    // Common
    'common.close': '✕',
    'common.back': '←',
    
    // Description & FAQ
    'description.title': 'Understanding Vastu Compass',
    'description.text': 'Your Vastu compass is calculated using **Vedic principles** based on your exact location and device orientation. The system generates **Directional Readings** showing precise cardinal and intercardinal directions, **Zone Analysis** measuring energy flow in different areas, **Grid Mapping** (16, 32, or 81 zones) indicating optimal placement and alignment, and **Expert insights** providing personalized Vastu recommendations based on your complete spatial profile, guided by traditional Vedic wisdom and modern computational accuracy.',
    'faq.title': 'Frequently Asked Questions',
    'faq.q1': 'How accurate is the compass?',
    'faq.a1': 'The compass uses your device\'s built-in magnetometer and accelerometer for high precision directional readings with tilt compensation.',
    'faq.q2': 'What is the difference between 16 and 32 zone compasses?',
    'faq.a2': 'The 16-zone compass provides traditional Vastu analysis, while the 32-zone offers more detailed precision for advanced practitioners.',
    'faq.q3': 'Can I use this for my home or office?',
    'faq.a3': 'Yes! The compass helps you identify optimal directions and zones for rooms, furniture placement, and architectural elements.',
  },
  hi: {
    // Header
    'app.title': 'NiraVastuAI',
    'app.subtitle': 'AI के माध्यम से विशेषज्ञों से वास्तु विज्ञान',
    'header.search': 'स्थान खोजें',
    'header.selectCompass': 'कम्पास प्रकार चुनें',
    
    // Compass Types
    'compass.normal': 'सामान्य कम्पास',
    'compass.normal.subtitle': 'मूल दिशात्मक मार्गदर्शन',
    'compass.vastu16': '16 जोन वास्तु कम्पास',
    'compass.vastu16.subtitle': 'पारंपरिक 16-जोन विश्लेषण',
    'compass.vastu32': '32 जोन वास्तु कम्पास',
    'compass.vastu32.subtitle': 'विस्तृत 32-जोन सटीकता',
    'compass.chakra': 'वास्तु चक्र',
    'compass.chakra.subtitle': 'ऊर्जा केंद्र मानचित्रण',
    
    // Map View
    'map.loading': 'मानचित्र लोड हो रहा है...',
    'map.error': 'मानचित्र लोड करने में असमर्थ',
    'map.cornerSelection.title': 'प्लॉट कोन समायोजित करें',
    'map.cornerSelection.subtitle': 'अपने प्लॉट की सीमाएं चिह्नित करने के लिए 4 लाल नंबर वाले बिंदुओं को खींचें',
    'map.gridActive.title': 'वास्तु ग्रिड सक्रिय',
    'map.gridActive.subtitle': '81 पद • ब्रह्मस्थान (पवित्र केंद्र) हाइलाइट किया गया',
    'map.geoCoordinate': 'भौगोलिक निर्देशांक:',
    'map.latitude': 'अक्षांश',
    'map.longitude': 'देशांतर',
    'map.compassToggle': 'कम्पास',
    'map.mapView': 'मानचित्र',
    'map.satelliteView': 'उपग्रह',
    'map.mapType': 'मानचित्र प्रकार',
    'map.satellite': 'उपग्रह',
    'map.vastuGrid': 'वास्तु ग्रिड',
    'map.selectCorners': 'कोन चुनें',
    'map.applyGrid': 'ग्रिड लागू करें',
    'map.clearGrid': 'ग्रिड साफ करें',
    'map.outerLayer': 'बाहरी',
    'map.middleLayer': 'मध्य',
    'map.centerLayer': 'केंद्र',
    'map.showLabels': 'लेबल दिखाएं',
    'map.hideLabels': 'लेबल छुपाएं',
    'map.showBrahma': 'ब्रह्म दिखाएं',
    'map.hideBrahma': 'ब्रह्म छुपाएं',
    'map.download': 'डाउनलोड',
    'map.recenter': 'केंद्रित करें',
    'map.lock': 'लॉक',
    'map.unlock': 'अनलॉक',
    'map.talkToExpert': 'विशेषज्ञ से बात करें',
    'map.goToLocation': 'स्थान पर जाएं',
    
    // Instructions
    'instructions.title': 'वास्तु कम्पास का उपयोग कैसे करें',
    'instructions.step1': 'होम स्क्रीन से एक कम्पास प्रकार चुनें (सामान्य, 16 जोन, 32 जोन, या चक्र)।',
    'instructions.step2': 'अपने डिवाइस को सपाट रखें और कम्पास को कैलिब्रेट होने दें। लाल सुई चुंबकीय उत्तर की ओर इंगित करेगी।',
    'instructions.step3': 'सटीक रीडिंग के लिए एक विशिष्ट स्थान खोजने और सेट करने के लिए "स्थान खोजें" बटन का उपयोग करें।',
    'instructions.step4': 'संदर्भ के लिए एक फोटो लेने के लिए "कैप्चर" बटन का उपयोग करें जो कम्पास के पीछे प्रदर्शित होगी।',
    'instructions.step5': 'अपनी कैप्चर की गई छवि को अधिक या कम देखने के लिए +/- बटन का उपयोग करके छवि का आकार समायोजित करें।',
    'instructions.step6': 'कम्पास अधिकतम सटीकता के लिए टिल्ट कम्पेंसेशन का उपयोग करता है, इसलिए यह तब भी काम करता है जब आपका डिवाइस थोड़ा झुका हुआ हो।',
    
    // Footer
    'footer.vastu': 'NiraVastuAI',
    'footer.com': '',
    
    // Buttons & Actions
    'button.googleMap': 'गूगल मानचित्र',
    'button.rearCamera': 'रियर कैमरा',
    'button.capture': 'कैप्चर',
    'button.lastCaptured': 'अंतिम कैप्चर',
    
    // Direction & Info
    'direction.title': 'दिशा',
    'info.geoCoordinate': 'भौगोलिक निर्देशांक:',
    'info.locationPermission': 'स्थान अनुमति आवश्यक (यहाँ क्लिक करें)',
    'info.magneticField': 'चुंबकीय क्षेत्र:',
    'info.strength': 'शक्ति',
    'info.currentLocation': 'वर्तमान स्थान',
    'info.useCurrentLocation': 'वर्तमान स्थान का उपयोग करें',
    
    // Gallery
    'gallery.title': 'कैप्चर की गई छवियां',
    'gallery.noImages': 'अभी तक कोई छवि कैप्चर नहीं की गई',
    
    // Common
    'common.close': '✕',
    'common.back': '←',
    
    // Description & FAQ
    'description.title': 'वास्तु कम्पास को समझना',
    'description.text': 'आपका वास्तु कम्पास **वैदिक सिद्धांतों** का उपयोग करके आपके सटीक स्थान और डिवाइस अभिविन्यास के आधार पर गणना की जाती है। सिस्टम **दिशात्मक रीडिंग** उत्पन्न करता है जो सटीक मुख्य और अंतर-मुख्य दिशाओं को दिखाता है, **जोन विश्लेषण** विभिन्न क्षेत्रों में ऊर्जा प्रवाह को मापता है, **ग्रिड मैपिंग** (16, 32, या 81 जोन) इष्टतम स्थान और संरेखण को इंगित करता है, और **विशेषज्ञ अंतर्दृष्टि** आपके पूर्ण स्थानिक प्रोफ़ाइल के आधार पर व्यक्तिगत वास्तु सिफारिशें प्रदान करती है, पारंपरिक वैदिक ज्ञान और आधुनिक कम्प्यूटेशनल सटीकता द्वारा निर्देशित।',
    'faq.title': 'अक्सर पूछे जाने वाले प्रश्न',
    'faq.q1': 'कम्पास कितना सटीक है?',
    'faq.a1': 'कम्पास उच्च सटीकता दिशात्मक रीडिंग के लिए टिल्ट कम्पेंसेशन के साथ आपके डिवाइस के अंतर्निहित मैग्नेटोमीटर और एक्सेलेरोमीटर का उपयोग करता है।',
    'faq.q2': '16 और 32 जोन कम्पास के बीच क्या अंतर है?',
    'faq.a2': '16-जोन कम्पास पारंपरिक वास्तु विश्लेषण प्रदान करता है, जबकि 32-जोन उन्नत चिकित्सकों के लिए अधिक विस्तृत सटीकता प्रदान करता है।',
    'faq.q3': 'क्या मैं इसे अपने घर या कार्यालय के लिए उपयोग कर सकता हूं?',
    'faq.a3': 'हाँ! कम्पास आपको कमरों, फर्नीचर प्लेसमेंट और वास्तुशिल्प तत्वों के लिए इष्टतम दिशाओं और जोन की पहचान करने में मदद करता है।',
  },
};

// Devta name translations
export const devtaTranslations = {
  en: {
    'Nirruti': 'Nirruti',
    'Pitru': 'Pitru',
    'Pitru Gana': 'Pitru Gana',
    'Dauvarika': 'Dauvarika',
    'Dwarika': 'Dwarika',
    'Sugriva': 'Sugriva',
    'Pushpadanta': 'Pushpadanta',
    'Varuna': 'Varuna',
    'Asura': 'Asura',
    'Shosha': 'Shosha',
    'Sosha': 'Sosha',
    'Papayakshma': 'Papayakshma',
    'Mriga': 'Mriga',
    'Putana': 'Putana',
    'Aryaman': 'Aryaman',
    'Vivaswan': 'Vivaswan',
    'Indra': 'Indra',
    'Mitra': 'Mitra',
    'Rudra': 'Rudra',
    'Yaksha': 'Yaksha',
    'Roga': 'Roga',
    'Bhrungraj': 'Bhrungraj',
    'Anjan': 'Anjan',
    'Savita': 'Savita',
    'Brahma': 'Brahma',
    'Satya': 'Satya',
    'Bhringaraj': 'Bhringaraj',
    'Ahi': 'Ahi',
    'Naga': 'Naga',
    'Nag': 'Nag',
    'Vitatha': 'Vitatha',
    'Griharakshita': 'Griharakshita',
    'Yama': 'Yama',
    'Gandharva': 'Gandharva',
    'Brahmasthan': 'Brahmasthan',
    'Bhringraja': 'Bhringraja',
    'Soma': 'Soma',
    'Mukhya': 'Mukhya',
    'Gruhakshata': 'Gruhakshata',
    'Antariksha': 'Antariksha',
    'Prithvidhara': 'Prithvidhara',
    'Parjanya': 'Parjanya',
    'Jayanta': 'Jayanta',
    'Rog': 'Rog',
    'Pusha': 'Pusha',
    'Bhrisha': 'Bhrisha',
    'Bhrusha': 'Bhrusha',
    'Aakash': 'Aakash',
    'Aryama': 'Aryama',
    'Aditi': 'Aditi',
    'Diti': 'Diti',
    'Rajayakshma': 'Rajayakshma',
    'Papa': 'Papa',
    'Bhallata': 'Bhallata',
    'Aap': 'Aap',
    'Agni': 'Agni',
    'Shikhi': 'Shikhi',
    'Mahendra': 'Mahendra',
    'Surya': 'Surya',
    'Shiva': 'Shiva',
    'Rudrajay': 'Rudrajay',
    'Aapvatsa': 'Aapvatsa',
    'Savitra': 'Savitra',
    'Indrajay': 'Indrajay',
    'Svitra': 'Svitra',
    'Bhallat': 'Bhallat',
    'Bhalla': 'Bhalla',
    'Surya': 'Surya',
    'Antariksh': 'Antariksh',
    'Gruhakshat': 'Gruhakshat',
    'Bhujang': 'Bhujang',
    'Papa Yaksha': 'Papa Yaksha',
    'Bhratsata': 'Bhratsata',
  },
  hi: {
    'Nirruti': 'निरृति',
    'Pitru': 'पितृ',
    'Pitru Gana': 'पितृ गण',
    'Dauvarika': 'दौवारिक',
    'Dwarika': 'द्वारिका',
    'Sugriva': 'सुग्रीव',
    'Pushpadanta': 'पुष्पदंत',
    'Varuna': 'वरुण',
    'Asura': 'असुर',
    'Shosha': 'शोष',
    'Sosha': 'शोष',
    'Papayakshma': 'पापयक्ष्मा',
    'Mriga': 'मृग',
    'Putana': 'पूतना',
    'Aryaman': 'अर्यमन',
    'Vivaswan': 'विवस्वान',
    'Indra': 'इंद्र',
    'Mitra': 'मित्र',
    'Rudra': 'रुद्र',
    'Yaksha': 'यक्ष',
    'Roga': 'रोग',
    'Bhrungraj': 'भृंगराज',
    'Anjan': 'अंजन',
    'Savita': 'सविता',
    'Brahma': 'ब्रह्मा',
    'Satya': 'सत्य',
    'Bhringaraj': 'भृंगराज',
    'Ahi': 'अहि',
    'Naga': 'नाग',
    'Nag': 'नाग',
    'Vitatha': 'वितथ',
    'Griharakshita': 'गृहरक्षित',
    'Yama': 'यम',
    'Gandharva': 'गंधर्व',
    'Brahmasthan': 'ब्रह्मस्थान',
    'Bhringraja': 'भृंगराज',
    'Soma': 'सोम',
    'Mukhya': 'मुख्य',
    'Gruhakshata': 'गृहक्षत',
    'Antariksha': 'अंतरिक्ष',
    'Prithvidhara': 'पृथ्वीधर',
    'Parjanya': 'पर्जन्य',
    'Jayanta': 'जयंत',
    'Rog': 'रोग',
    'Pusha': 'पूषा',
    'Bhrisha': 'भृश',
    'Bhrusha': 'भृश',
    'Aakash': 'आकाश',
    'Aryama': 'अर्यमा',
    'Aditi': 'अदिति',
    'Diti': 'दिति',
    'Rajayakshma': 'राजयक्ष्मा',
    'Papa': 'पाप',
    'Bhallata': 'भल्लाट',
    'Aap': 'आप',
    'Agni': 'अग्नि',
    'Shikhi': 'शिखी',
    'Mahendra': 'महेंद्र',
    'Surya': 'सूर्य',
    'Shiva': 'शिव',
    'Rudrajay': 'रुद्रजय',
    'Aapvatsa': 'आपवत्स',
    'Savitra': 'सवित्र',
    'Indrajay': 'इंद्रजय',
    'Svitra': 'स्वित्र',
    'Bhallat': 'भल्लाट',
    'Bhalla': 'भल्ला',
    'Surya': 'सूर्य',
    'Antariksh': 'अंतरिक्ष',
    'Gruhakshat': 'गृहक्षत',
    'Bhujang': 'भुजंग',
    'Papa Yaksha': 'पाप यक्ष',
    'Bhratsata': 'भ्रात्सत',
    'Shikhi': 'शिखी',
  },
};

// Helper function to translate devta names
export function translateDevta(devtaName, language) {
  return devtaTranslations[language]?.[devtaName] || devtaName;
}

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load saved language preference
    AsyncStorage.getItem('app_language').then((savedLang) => {
      if (savedLang && (savedLang === 'en' || savedLang === 'hi')) {
        setLanguage(savedLang);
      }
      setIsLoading(false);
    });
  }, []);

  const changeLanguage = async (lang) => {
    if (lang === 'en' || lang === 'hi') {
      setLanguage(lang);
      await AsyncStorage.setItem('app_language', lang);
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  const translateDevta = (devtaName) => {
    return devtaTranslations[language]?.[devtaName] || devtaName;
  };

  return (
    <I18nContext.Provider value={{ language, changeLanguage, t, translateDevta }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

