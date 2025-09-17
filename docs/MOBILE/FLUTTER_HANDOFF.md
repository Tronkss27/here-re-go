## Handoff a Flutter (contratti invariati da `openapi.json`)

Questa guida rende l’app Flutter interoperabile con l’attuale backend senza modifiche ai contratti. Tutte le chiamate REST derivano da `openapi.json`.

### Struttura cartelle consigliata
```
lib/
  app.dart
  main_dev.dart
  main_staging.dart
  main_prod.dart
  core/
    config/
      app_config.dart
    network/
      dio_client.dart
      interceptors/
        auth_interceptor.dart
        tenant_interceptor.dart
        logging_interceptor.dart
        retry_interceptor.dart
    storage/
      secure_storage.dart
    routing/
      router.dart
    i18n/
      l10n.dart
    theme/
      theme.dart
    utils/
      result.dart
  api/
    generated/   # codice generato da OpenAPI
    client.dart  # wrapper per configurazione comune
  features/
    auth/
    venues/
    announcements/
    bookings/
    analytics/
    offers/
    global_matches/
    admin/
  widgets/
    atoms/
    molecules/
    organisms/
```

### State management (scelta: Riverpod)
- Motivi: tip-safe, semplice da testare, granularità dei rebuild, ottimo per architetture modulari.
- Dipendenze: `flutter_riverpod`.
- Pattern: repository (usa client generato), notifier (stato `AsyncValue<T>`), widget che consuma provider.

### Client HTTP tipizzato da `openapi.json`
Generator consigliato: OpenAPI Generator `dart-dio-next` (robusto, supporta `dio`).

Prerequisiti:
```bash
brew install openjdk
npm i -g @openapitools/openapi-generator-cli
```

Generazione (eseguita dentro il progetto Flutter):
```bash
openapi-generator-cli generate \
  -i ../SPOrTS/openapi.json \
  -g dart-dio-next \
  -o lib/api/generated \
  --additional-properties=pubName=sports_api,nullableFields=true
```

Dipendenze `pubspec.yaml`:
```yaml
dependencies:
  dio: ^5.7.0
  flutter_riverpod: ^2.5.1
  intl: ^0.19.0
  flutter_localizations:
    sdk: flutter
dev_dependencies:
  build_runner: any
```

Integrazione `dio` e generator:
```dart
// api/client.dart
import 'package:dio/dio.dart';
import '../core/config/app_config.dart';

Dio buildDio() { /* vedi CONFIG_GUIDE */ }

// Esempio uso con un service generato
// final api = DefaultApi(buildDio(), basePath: AppConfig.apiBaseUrl);
```

### Error handling, retry, caching, offline-first
- Error handling: normalizzare errori HTTP in un tipo `Failure` (es. network, 4xx validazione, 401/auth, 5xx server). Mostrare messaggi locali, non stacktrace.
- Retry: backoff esponenziale con jitter; evitare retry su 4xx (tranne 408/429 con attese).
- Caching: `dio_cache_interceptor` (+ Hive storage) per GET pubblici. Escludere analytics/admin sensibili; usare `no-store`.
- Offline-first minimo: cache stale-while-revalidate per liste pubbliche (venues, matches); coda locale per eventi analytics; flush quando online.

### i18n, theming, accessibilità
- i18n: `intl` + ARB, `flutter_localizations` in `MaterialApp`. Nome file: `app_en.arb`, `app_it.arb`.
- Theming: Material 3, light/dark, contrast ratio AA. Tokens coerenti con brand neutro (shadcn-like).
- A11y: Semantics, tap target ≥ 44px, supporto screen reader, font scaling, focus visibile.

### Routing
- Preferire `go_router` o `Routemaster` per dichiarativo; deep link sanitizzati.

### Note multi-tenant
- Allegare `X-Tenant-ID` a tutte le chiamate admin e agli eventi analytics per coerenza.
- Gestire selezione tenant in app se multi-tenant dinamico.

### Contratti invariati
- Tutte le API sono derivate da `openapi.json`: non introdurre client “fatti a mano” non tipizzati.


