# TerminBuddy Mobile — Pokretanje aplikacije

Kratka dokumentacija za pokretanje development builda na fizičkom uređaju (Samsung S23) i emulatoru.

---

## Preduvjeti (jednokratno postavljanje)

### 1. Instalirani alati

- **Node.js** (LTS)
- **Android Studio** (zbog Android SDK-a i ugrađenog JDK-a)
- Ovisnosti projekta: `npm install` u rootu projekta

### 2. Environment varijable (Windows)

Postavljaju se u: Start → "environment variables" → _Edit the system environment variables_ → **Environment Variables** → _User variables_.

| Varijabla           | Vrijednost                                                |
| ------------------- | --------------------------------------------------------- |
| `JAVA_HOME`         | `C:\Program Files\Android\Android Studio\jbr`             |
| `ANDROID_HOME`      | `C:\Users\sajin\AppData\Local\Android\Sdk`                |
| `Path` (dodati red) | `C:\Users\sajin\AppData\Local\Android\Sdk\platform-tools` |

> Nakon promjene varijabli **kompletno zatvoriti VS Code / terminal** (po potrebi restartati računalo) da se promjene primijene.

**Provjera:**

```powershell
echo $env:JAVA_HOME
& "$env:JAVA_HOME\bin\java.exe" -version   # mora biti 17 ili 21
adb --version                              # mora raditi bez greške
```

### 3. .env file

U rootu projekta mora postojati `.env` (nije u gitu):

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://<projekt>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_API_URL=https://<domena-web-aplikacije>
```

### 4. Poznati fixevi u `android/` folderu

Ako se `android/` folder regenerira (`npx expo prebuild --clean`), ove izmjene treba ponoviti:

- **`android/gradle/wrapper/gradle-wrapper.properties`** — Gradle verzija mora biti **8.13** (9.x puca uz foojay-resolver bug):
  ```
  distributionUrl=https\://services.gradle.org/distributions/gradle-8.13-all.zip
  ```
- **`android/local.properties`** — putanja do SDK-a (file nije u gitu, kreirati po potrebi):
  ```
  sdk.dir=C:\\Users\\sajin\\AppData\\Local\\Android\\Sdk
  ```

---

## Pokretanje na fizičkom uređaju (Samsung S23)

### Priprema mobitela (jednokratno)

1. Uključiti **Developer options** (Settings → About phone → 7× tap na Build number)
2. Uključiti **USB debugging** u Developer options
3. Spojiti mobitel kabelom i na popupu _"Allow USB debugging?"_ označiti **Always allow** → **Allow**

### Prvi build (ili nakon dodavanja novog native paketa)

```powershell
# 1. provjeri da adb vidi uređaj (status mora biti "device")
adb devices

# 2. build + instalacija + pokretanje
npx expo run:android
```

- Prvi build traje **5–15 min**, sljedeći su brži (Gradle cache).
- Na kraju se aplikacija automatski instalira i otvori na mobitelu, spojena na Metro bundler.

### Svakodnevni rad (bez ponovnog builda)

Aplikacija ostaje trajno instalirana na mobitelu. Za razvoj:

```powershell
npx expo start --dev-client
```

Zatim otvoriti **TerminBuddy** aplikaciju na mobitelu:

- Ako su mobitel i računalo na **istom WiFi-ju**, app se sama spoji na Metro (kabel nije potreban).
- Alternativno skenirati QR kod iz terminala.

Promjene u JS kodu vide se odmah (hot reload).

> `npx expo run:android` treba ponoviti **samo** kad se instalira novi native paket (`npx expo install ...`) ili promijeni nešto u `app.json` što utječe na native build (scheme, ikone, permisije...).

---

## Pokretanje na emulatoru (Android Studio)

1. Android Studio → **Device Manager** → kreirati/pokrenuti virtualni uređaj (AVD)
2. Kad je emulator upaljen:
   ```powershell
   npx expo run:android
   ```
   Ako su spojeni i emulator i fizički uređaj, Expo pita na koji instalirati.

---

## Production / samostalni APK

Development build zahtijeva Metro server. Za APK koji radi potpuno samostalno (s ugrađenim JS kodom):

```powershell
cd android
./gradlew.bat assembleRelease
```

APK se nalazi u: `android/app/build/outputs/apk/release/`

Taj APK se može instalirati na bilo koji Android uređaj bez računala.

---

## Česti problemi i rješenja

| Greška                                         | Uzrok                                  | Rješenje                                             |
| ---------------------------------------------- | -------------------------------------- | ---------------------------------------------------- |
| `adb: not recognized`                          | platform-tools nije u PATH-u           | Dodati u PATH (vidi Preduvjeti), restartati terminal |
| `Unsupported class file major version XX`      | Prenova Java verzija                   | JAVA_HOME → Android Studio JBR (17/21)               |
| `JvmVendorSpec ... IBM_SEMERU`                 | Gradle 9.x + stari foojay plugin       | Gradle wrapper na **8.13**                           |
| `SDK location not found`                       | Fali `local.properties` / ANDROID_HOME | Kreirati `android/local.properties` (vidi gore)      |
| `adb devices` → `unauthorized`                 | Debugging nije odobren                 | Otključati mobitel, prihvatiti popup                 |
| App: "Unable to connect to development server" | Metro ne radi / različite mreže        | `npx expo start --dev-client`, isti WiFi             |
| Build puca nakon novog paketa                  | Stari Gradle cache                     | `cd android` → `./gradlew.bat clean` → ponovni build |
| Env varijable se ne vide u terminalu           | Terminal otvoren prije promjene        | Kompletno restartati VS Code (ili računalo)          |

---

## Napomene

- **Ne prihvaćati** Android Studio prijedlog "Update Gradle version" — Expo upravlja verzijama; ručni upgrade razbija build.
- `android/` folder je generiran (`npx expo prebuild`). Ako je u `.gitignore`, fixeve iz sekcije _Poznati fixevi_ treba ponoviti nakon svakog regeneriranja.
