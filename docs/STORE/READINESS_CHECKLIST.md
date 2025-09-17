## Store Readiness Checklist (App Store / Google Play)

Questa checklist è azionabile per la pubblicazione mobile senza modifiche al backend.

### Metadati e legali
- Privacy Policy URL (pubblica, aggiornata)
- Terms of Service URL
- Data Safety (Play) / App Privacy (Apple): raccolta dati (analytics non pubblicitari), finalità, retention
- Contatti supporto (email, sito, form)

### Identità app
- Nome app, sottotitolo, descrizione locale (IT/EN)
- Parole chiave (Apple) / short & full description (Play)
- Categoria primaria/secondaria corretta
- Icone: 1024×1024, adaptive icons (Android), asset iOS multipli
- Screenshot: telefoni e (se supportati) tablet; 5 per locale
- Video preview (opzionale)

### Permessi e conformità
- Dichiarare permessi realmente usati (Notifiche, Localizzazione per mappe)
- Motivazioni chiare (NSLocationWhenInUseUsageDescription, ecc.)
- ATT (iOS) solo se tracciamento pubblicitario; per analytics interni, spiegare nella privacy

### Build e firma
- Android: bundle `.aab`, versionCode/versionName coerenti, signing release (keystore sicuro)
- iOS: archive, provisioning profile distribuzione, certificato, Bundle ID
- Config `--dart-define-from-file` per Staging/Prod (no URL hard-coded)
- Obfuscation/minification se necessario

### Integrazioni tecniche
- Base URL corretta per ambiente Prod
- Certificate pinning (se abilitato) con chiavi aggiornate
- Crash reporting e analytics di prodotto (non PII)
- Deep links/Universal Links impostati e verificati

### Funzionale
- Login/Logout e sessione persistente (Secure Storage)
- Flussi principali: ricerca locali, dettaglio, annunci, prenotazioni, calendario, analytics admin
- Offline minimo: cache liste pubbliche, coda analytics
- Localizzazione IT/EN completa; A11y (contrast, font scaling, semantics)

### QA e test
- Suite integrazione eseguita (vedi `TESTS/INTEGRATION_PLAN.md`)
- Test su reti reali (3G/4G/5G, Wi-Fi pubbliche)
- Test dispositivi: iOS min OS, Android min SDK
- Test regressione su aggiornamento app (migrazione storage)

### Pubblicazione
- Note di rilascio
- Account di test (demo) documentati per review team
- Screenshots e testi conformi alle linee guida di ciascun store

### Post-pubblicazione
- Monitoraggio crash e metriche chiave
- Piano hotfix e rollout graduale (Play staged rollout)


