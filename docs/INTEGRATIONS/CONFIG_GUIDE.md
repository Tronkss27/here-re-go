## Guida Configurazione Client (Flutter)

Obiettivo: leggere configurazioni in modo sicuro senza incorporare segreti, differenziando Dev/Staging/Prod e garantendo multi-tenant coerente.

### Principi
- Nessun segreto hard-coded nell’app. Le chiavi sensibili restano lato backend/infra.
- Config a build-time tramite `--dart-define` o `--dart-define-from-file`.
- Possibile Remote Config per flag non sensibili.

### Variabili raccomandate
- `API_BASE_URL` (es. `https://staging.api.sportsapp.com/api`)
- `TENANT_ID` (default tenant per richieste; es. `default` o specifico)
- `APP_ENV` (`dev` | `staging` | `prod`)
- `HTTP_TIMEOUT_MS` (es. `15000`)
- `CERT_PIN_SHA256` (facolt., pinning)

### File di definizione (consigliato)
Usa i file JSON per ambiente:

`env.dev.json`
```json
{
  "API_BASE_URL": "http://localhost:3001/api",
  "TENANT_ID": "default",
  "APP_ENV": "dev",
  "HTTP_TIMEOUT_MS": "15000"
}
```

`env.staging.json` e `env.prod.json` con i rispettivi URL.

Build Flutter con:
```bash
flutter run --dart-define-from-file=env.dev.json
flutter build apk --dart-define-from-file=env.staging.json
flutter build ipa --dart-define-from-file=env.prod.json
```

In alternativa, usa variabili singole:
```bash
flutter run \
  --dart-define=API_BASE_URL=https://staging.api.sportsapp.com/api \
  --dart-define=TENANT_ID=acme \
  --dart-define=APP_ENV=staging
```

### Lettura in codice (esempio Dart)
```dart
import 'dart:io';

class AppConfig {
  static const apiBaseUrl = String.fromEnvironment('API_BASE_URL');
  static const tenantId = String.fromEnvironment('TENANT_ID', defaultValue: 'default');
  static const appEnv = String.fromEnvironment('APP_ENV', defaultValue: 'dev');
  static const httpTimeoutMs = int.fromEnvironment('HTTP_TIMEOUT_MS', defaultValue: 15000);
}
```

### Sicurezza
- Non inserire API keys terze parti segrete. Se servono, usa backend proxy.
- Conserva JWT in Secure Storage (Keychain/Keystore), non in SharedPreferences.
- Abilita TLS sempre; valuta certificate pinning (`CERT_PIN_SHA256`).

### Differenze Dev / Staging / Prod
- Dev: logging verbose, base URL locale, pinning disabilitato, analytics disattivi.
- Staging: logging medio, pinning opzionale, Feature Flags attivi.
- Prod: logging minimale, pinning attivo (se possibile), crash reporting e analytics attivi.

### Multi-tenant e Headers
- Inserire `X-Tenant-ID: <TENANT_ID>` su chiamate admin e analytics per consistenza.
- Allegare `Authorization: Bearer <JWT>` per endpoint protetti.

### Collegamento con HTTP client
Impostare `baseUrl` e interceptor comuni:
```dart
import 'package:dio/dio.dart';

Dio buildDio() {
  final dio = Dio(BaseOptions(
    baseUrl: AppConfig.apiBaseUrl,
    connectTimeout: Duration(milliseconds: AppConfig.httpTimeoutMs),
    receiveTimeout: Duration(milliseconds: AppConfig.httpTimeoutMs),
  ));
  dio.interceptors.add(InterceptorsWrapper(onRequest: (options, handler) async {
    // Allegare tenant e token
    options.headers['X-Tenant-ID'] = AppConfig.tenantId;
    final token = await loadJwtSecurely();
    if (token != null) options.headers['Authorization'] = 'Bearer $token';
    return handler.next(options);
  }));
  return dio;
}
```

> Nota: non modificare il backend; la coerenza è garantita usando `openapi.json` come sorgente contrattuale e variando solo le ENV lato client.


