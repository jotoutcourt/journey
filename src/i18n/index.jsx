import { createContext, useContext, useState } from 'react'
import fr from './fr.js'
import en from './en.js'

const LOCALES = { fr, en }

export const I18nContext = createContext({ locale: 'fr', setLocale: () => {} })

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(
    () => localStorage.getItem('pjt-locale') || 'fr'
  )
  function changeLocale(l) {
    localStorage.setItem('pjt-locale', l)
    setLocale(l)
  }
  return (
    <I18nContext.Provider value={{ locale, setLocale: changeLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

// Hook for UI strings — t('key') or t('key', { var: value })
export function useT() {
  const { locale } = useContext(I18nContext)
  return function t(key, vars) {
    let str = LOCALES[locale]?.[key] ?? LOCALES.fr?.[key] ?? key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replaceAll(`{${k}}`, String(v))
      }
    }
    return str
  }
}

// Hook for current locale and setter
export function useLocale() {
  return useContext(I18nContext)
}

// Hook for translatable fields on data objects
// Returns obj['fieldName_en'] when locale is 'en', else obj['fieldName']
export function useTField() {
  const { locale } = useContext(I18nContext)
  return function tField(obj, field) {
    if (!obj) return undefined
    if (locale !== 'fr') {
      const locKey = `${field}_${locale}`
      if (obj[locKey] != null) return obj[locKey]
    }
    return obj[field]
  }
}
