# MIGRATION → Flutter (iOS/Android)

Obiettivo: portare la web app a Flutter nativo mantenendo endpoint, payload e UX equivalenti.

## Target piattaforme
- iOS: iOS 13+ (minSdk iOS 13 per compatibilità ampia)
- Android: minSdk 23+, targetSdk latest stable

## Librerie Flutter proposte
- Routing: `go_router` — semplice, supporto declarativo, deep-link
- Stato: `flutter_riverpod` — tipizzato, testabile, scope chiari
- HTTP/API: `dio` + generatori OpenAPI (o modelli manuali) — robusto, interceptor
- JSON: `json_serializable` — boilerplate ridotto
- UI: Material 3 + `flutter_hooks` opzionale
- Grafici: `syncfusion_flutter_charts` — stabile, aggiornata
- Secure storage: `flutter_secure_storage` — token
- Local storage: `shared_preferences` — piccoli flag
- i18n: `flutter_localizations` + `intl`

## Mapping componenti (Web → Flutter)
- React Router → GoRouter con route nominate
- React Query → Riverpod + cache leggera custom
- Recharts → Syncfusion Charts
- Modali shadcn → `showModalBottomSheet`/`Dialog` Material 3

## Sicurezza e credenziali
- Token JWT in `flutter_secure_storage`
- Header `X-Tenant-ID` inviato ove richiesto
- Gestione 401/403: logout soft + redirect a login

## Rete e offline
- Timeout e retry (Dio – `RetryInterceptor`)
- Schermate fallback offline, retry manuale

## Accessibilità
- Enforced contrast, size dinamici, semantics labels

## Build locale
- iOS: `flutter build ios` (solo simulatore in questa fase)
- Android: `flutter build apk`

## Prossimi step
1. Integrare client tipizzato da `openapi.json`
2. Implementare feature shells (home, venues, venue detail, admin shell)
3. Collegare autenticazione (demo/login) e persistenza token
4. Integrare analytics e calendari admin

## Note
- Nessun cambiamento ai contratti REST
- UI neutra: Material 3 vicino a shadcn
