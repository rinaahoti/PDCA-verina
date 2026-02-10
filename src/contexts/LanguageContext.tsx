import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

type Language = 'en' | 'de';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, options?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { t, i18n: i18nInstance } = useTranslation();
    const [language, setLanguageState] = useState<Language>((i18nInstance.language as Language) || 'en');

    useEffect(() => {
        // Sync local state if i18n language changes externally (or initial load)
        // Ensure we only support en/de
        const currentParams = i18nInstance.language?.split('-')[0]; // handle 'en-US' etc
        if (currentParams === 'de' || currentParams === 'en') {
            setLanguageState(currentParams as Language);
        }
    }, [i18nInstance.language]);

    const setLanguage = (lang: Language) => {
        i18n.changeLanguage(lang);
        setLanguageState(lang);
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
