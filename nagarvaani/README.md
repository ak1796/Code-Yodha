# NagarVaani - Sovereign Urban Intelligence

## Multilingual Support Configuration

This platform uses `i18next` and `react-i18next` for seamless, real-time language translations across all native interfaces. Currently, we actively support English (`en`), Hindi (`hi`), and Marathi (`mr`).

### How to Add a New Language

1. **Update the UI Switchers**:
   Add the new language code and native language name to any component using a language switcher (e.g., `ComplaintForm.jsx`, `AdminSidebar.jsx`, or `OfficerSidebar.jsx`).
   ```javascript
   const LANGUAGES = [
     { code: 'en', name: 'English' },
     { code: 'hi', name: 'हिन्दी' },
     { code: 'mr', name: 'मराठी' },
     { code: 'gu', name: 'ગુજરાતી' } // <-- Example new language
   ];
   ```

2. **Add translation namespace in `i18n.js`**:
   Open `frontend/src/lib/i18n.js` and locate the `resources` object configuration. Create a new root key matching your language code and copy the exact key-value pairs from the `en` block as your translation template.
   ```javascript
   gu: {
     translation: {
       "Welcome": "સ્વાગતમ",
       "Login": "લૉગિન",
       // ... provide translations for all remaining keys mapped in `en`
     }
   }
   ```

3. **Perform QA Testing**:
   Because localized text length natively varies across Indic scripts, it's strictly recommended to do a full walkthrough in the UI. Specifically, examine tables, heatmaps, and modal forms to ensure longer text strings do not overflow flexbox or grid layouts.
