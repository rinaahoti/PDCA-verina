import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppRouter } from './router'
import './styles/global.css'
import './i18n'; 
import { LanguageProvider } from './contexts/LanguageContext'

document.title = "VIRENA – PDCA";

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <LanguageProvider>
            <AppRouter />
        </LanguageProvider>
    </React.StrictMode>,
)
