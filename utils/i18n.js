import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Translation data
const translations = {
  en: {
    // Header
    'app.title': 'Compass - Vastu',
    'header.search': 'Search Location',
    'header.selectCompass': 'Select Compasses Type',
    
    // Compass Types
    'compass.normal': 'Normal Compass',
    'compass.vastu16': '16 Zone Vastu Compass',
    'compass.vastu32': '32 Zone Vastu Compass',
    'compass.chakra': 'Vastu Chakra',
    
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
    
    // Instructions
    'instructions.title': 'How to Use Vastu Compass',
    'instructions.step1': 'Select a compass type from the home screen (Normal, 16 Zone, 32 Zone, or Chakra).',
    'instructions.step2': 'Hold your device flat and allow the compass to calibrate. The red needle will point to magnetic North.',
    'instructions.step3': 'Use the "Search Location" button to find and set a specific location for accurate readings.',
    'instructions.step4': 'Use the "Capture" button to take a photo that will be displayed behind the compass for reference.',
    'instructions.step5': 'Adjust the image size using the +/- buttons to see more or less of your captured image.',
    'instructions.step6': 'The compass uses tilt compensation for maximum accuracy, so it works even when your device is slightly tilted.',
    
    // Footer
    'footer.vastu': 'Vastu',
    'footer.com': '.com',
    
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
  },
  hi: {
    // Header
    'app.title': 'कम्पास - वास्तु',
    'header.search': 'स्थान खोजें',
    'header.selectCompass': 'कम्पास प्रकार चुनें',
    
    // Compass Types
    'compass.normal': 'सामान्य कम्पास',
    'compass.vastu16': '16 जोन वास्तु कम्पास',
    'compass.vastu32': '32 जोन वास्तु कम्पास',
    'compass.chakra': 'वास्तु चक्र',
    
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
    
    // Instructions
    'instructions.title': 'वास्तु कम्पास का उपयोग कैसे करें',
    'instructions.step1': 'होम स्क्रीन से एक कम्पास प्रकार चुनें (सामान्य, 16 जोन, 32 जोन, या चक्र)।',
    'instructions.step2': 'अपने डिवाइस को सपाट रखें और कम्पास को कैलिब्रेट होने दें। लाल सुई चुंबकीय उत्तर की ओर इंगित करेगी।',
    'instructions.step3': 'सटीक रीडिंग के लिए एक विशिष्ट स्थान खोजने और सेट करने के लिए "स्थान खोजें" बटन का उपयोग करें।',
    'instructions.step4': 'संदर्भ के लिए एक फोटो लेने के लिए "कैप्चर" बटन का उपयोग करें जो कम्पास के पीछे प्रदर्शित होगी।',
    'instructions.step5': 'अपनी कैप्चर की गई छवि को अधिक या कम देखने के लिए +/- बटन का उपयोग करके छवि का आकार समायोजित करें।',
    'instructions.step6': 'कम्पास अधिकतम सटीकता के लिए टिल्ट कम्पेंसेशन का उपयोग करता है, इसलिए यह तब भी काम करता है जब आपका डिवाइस थोड़ा झुका हुआ हो।',
    
    // Footer
    'footer.vastu': 'वास्तु',
    'footer.com': '.com',
    
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
  },
};

// Devta name translations
export const devtaTranslations = {
  en: {
    'Nirruti': 'Nirruti',
    'Pitru': 'Pitru',
    'Dauvarika': 'Dauvarika',
    'Sugriva': 'Sugriva',
    'Pushpadanta': 'Pushpadanta',
    'Varuna': 'Varuna',
    'Asura': 'Asura',
    'Shosha': 'Shosha',
    'Papayakshma': 'Papayakshma',
    'Mriga': 'Mriga',
    'Putana': 'Putana',
    'Aryaman': 'Aryaman',
    'Vivasvan': 'Vivasvan',
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
    'Vayu': 'Vayu',
    'Pusha': 'Pusha',
    'Bhrisha': 'Bhrisha',
    'Aakash': 'Aakash',
    'Aryama': 'Aryama',
    'Aditi': 'Aditi',
    'Diti': 'Diti',
    'Rajayakshma': 'Rajayakshma',
    'Papa': 'Papa',
    'Bhallata': 'Bhallata',
    'Aap': 'Aap',
    'Agni': 'Agni',
    'Isha': 'Isha',
    'Mahendra': 'Mahendra',
    'Surya': 'Surya',
    'Shiva': 'Shiva',
    'Rudrajay': 'Rudrajay',
    'Aapvatsa': 'Aapvatsa',
    'Savitra': 'Savitra',
    'Indrajay': 'Indrajay',
    'Svitra': 'Svitra',
    'Bhallat': 'Bhallat',
    'Aditya': 'Aditya',
    'Antariksh': 'Antariksh',
    'Gruhakshat': 'Gruhakshat',
    'Bhujang': 'Bhujang',
  },
  hi: {
    'Nirruti': 'निरृति',
    'Pitru': 'पितृ',
    'Dauvarika': 'दौवारिक',
    'Sugriva': 'सुग्रीव',
    'Pushpadanta': 'पुष्पदंत',
    'Varuna': 'वरुण',
    'Asura': 'असुर',
    'Shosha': 'शोष',
    'Papayakshma': 'पापयक्ष्मा',
    'Mriga': 'मृग',
    'Putana': 'पूतना',
    'Aryaman': 'अर्यमन',
    'Vivasvan': 'विवस्वान',
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
    'Vayu': 'वायु',
    'Pusha': 'पूषा',
    'Bhrisha': 'भृश',
    'Aakash': 'आकाश',
    'Aryama': 'अर्यमा',
    'Aditi': 'अदिति',
    'Diti': 'दिति',
    'Rajayakshma': 'राजयक्ष्मा',
    'Papa': 'पाप',
    'Bhallata': 'भल्लाट',
    'Aap': 'आप',
    'Agni': 'अग्नि',
    'Isha': 'ईशा',
    'Mahendra': 'महेंद्र',
    'Surya': 'सूर्य',
    'Shiva': 'शिव',
    'Rudrajay': 'रुद्रजय',
    'Aapvatsa': 'आपवत्स',
    'Savitra': 'सवित्र',
    'Indrajay': 'इंद्रजय',
    'Svitra': 'स्वित्र',
    'Bhallat': 'भल्लाट',
    'Aditya': 'आदित्य',
    'Antariksh': 'अंतरिक्ष',
    'Gruhakshat': 'गृहक्षत',
    'Bhujang': 'भुजंग',
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

