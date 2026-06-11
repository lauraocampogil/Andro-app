# Andro

### _Color the world by running_

Een gamified hardloop-app die elke race ter wereld verandert in een verzamelbaar kaart.
Loop races, scan je fysieke kaarten en kleur jouw 3D-wereldbol race per keer.

[Expo]
[React Native]
[TypeScript]
[Supabase]

Final Work Laura Ocampo 3A MCT, Web & Mobile Development Erasmushogeschool Brussel

---

## Over het project

**Andro** lost een echt probleem op: 60% van de beginnende hardlopers haakt af binnen drie maanden, en bestaande apps zijn te technisch of te competitief. Andro draait het om geen leaderboards, maar **avontuur, exploratie en verzamelen**.

Het kernidee: je wereldbol begint volledig grijs. Elke race die je loopt levert een unieke fysieke verzamelkaart op, die je in de app scant via een QR-code. Daardoor kleurt het land op je persoonlijke 3D-globe, en wordt de kaart toegevoegd aan je digitale museum dat anderen kunnen bezoeken.

De mascotte heet **Andro**: een kawaii-astronaut met de aarde als hoofd want wie de wereld wil kleuren, moet de wereld eerst leren kennen.

### Kernfuncties

| Functie                 | Beschrijving                                               |
| ----------------------- | ---------------------------------------------------------- |
| **3D-wereldkaart**      | Roteerbare globe die kleurt naarmate je races voltooit     |
| **Race-discovery**      | Pins, filters en details voor races wereldwijd             |
| **In-app inschrijving** | Boeken en betalen rechtstreeks in de app                   |
| **Card-scanning**       | QR-scan met feestelijke animatie                           |
| **Digitaal museum**     | 3D-galerij van je collectie, bezoekbaar door anderen       |
| **Profiel & community** | Statistieken, badges en team-challenges (geen ranglijsten) |

---

## Tech stack

### Frontend

- **[React Native](https://reactnative.dev)** cross-platform native apps (iOS + Android) vanuit codebase
- **[Expo](https://expo.dev)** development tooling, build- en update-infrastructuur
- **[TypeScript](https://www.typescriptlang.org)** statisch getypeerde JavaScript
- **[Expo Router](https://docs.expo.dev/router/introduction/)** file-based routing en navigatie

### State & opslag

- **[Zustand](https://zustand-demo.pmnd.rs/)** lichte state management
- **[AsyncStorage](https://react-native-async-storage.github.io/async-storage/)** lokale persistente opslag

### Backend

- **[Supabase](https://supabase.com)** PostgreSQL-database, authenticatie, storage en realtime API
  - Row Level Security (RLS) voor privacy en toegangscontrole per rij

### UI & media

- **[Lucide React Native](https://lucide.dev)** iconenset
- **[expo-camera](https://docs.expo.dev/versions/latest/sdk/camera/)** QR-code scanner voor verzamelkaarten
- **[expo-location](https://docs.expo.dev/versions/latest/sdk/location/)** GPS voor race-suggesties en Travel Mode
- **[expo-linear-gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)** cosmische achtergronden
- **[expo-image](https://docs.expo.dev/versions/latest/sdk/image/)** performante afbeeldingen en GIF-animaties
- **[expo-sharing](https://docs.expo.dev/versions/latest/sdk/sharing/)**

### 3D Globe

- **[Three.js Documentation](https://threejs.org/docs/)** Core 3D library gebruikt voor de interactive globe.
- **[@react-three/fiber](https://r3f.docs.pmnd.rs/getting-started/introduction)** React-renderer voor Three.js.
- **[Natural Earth Data](https://www.naturalearthdata.com/)** Open-source GeoJSON-dataset met landsgrenzen die wordt gebruikt voor het weergeven van de wereldbol.
- **[earcut](https://github.com/mapbox/earcut)** Polygon-triangulatiebibliotheek die wordt gebruikt om GeoJSON-polygonen om te zetten in driehoeken voor 3D-weergave.

### Animaties

- **[React Native Reanimated 3](https://docs.swmansion.com/react-native-reanimated/)** Gebruikt voor de kaartomdraai-animatie, de pop-up bij het vrijspelen van een continent en de rotatie van de wereldbol.
- **[React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)** Gebruikt voor pinch-to-zoom- en pan-gebaren op racekaarten.

### AI-assets (buiten de codebase)

- **Gemini Pro** generatie van kaartartwork en mascot-frames
- **Veo 3** animaties van Andro (green-screen workflow)
- **Photoshop / Capcut** post-productie en green-screen removal
  **(https://gemini.google.com/app/fc71d4d2b632cc80)**
  **(https://gemini.google.com/app/e933802e62a0aeae)**
  **(https://gemini.google.com/app/1a625970be373791)**
  **(https://gemini.google.com/app/1cb227533ee8be64)**
  **(https://gemini.google.com/app/f1083294a56fe694)**
  **(https://gemini.google.com/app/714929b1c55d14ab)**

### AI Tools Used

- **[Claude Anthropic](https://claude.ai/chat/a0092a98-8a70-49d1-9bf2-fef493cb111f)** Debugging van probleem in community.tsx.

---

### Vereisten

- **[Node.js](https://nodejs.org)** LTS (v20 of nieuwer) + npm
- **[Expo Go](https://expo.dev/go)** op je telefoon, of een iOS-simulator / Android-emulator
- **[Git](https://git-scm.com)**

### Installatie

```bash
# 1. Clone de repository
git clone https://github.com/lauraocampogil/Andro-app.git
cd andro-app

# 2. Installeer dependencies
npm install

# 3. Maak een .env-bestand aan (zie hieronder)
cp .env.example .env

# 4. Start de development server
npx expo start
```

Scan daarna de QR-code met **Expo Go** (Android) of de camera-app (iOS), of druk op `i` / `a` voor de simulator/emulator.

### Omgevingsvariabelen

Maak een `.env`-bestand aan in de root met je Supabase-sleutels:

```env
EXPO_PUBLIC_SUPABASE_URL=https://<jouw-project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<jouw-anon-key>
```

---

## Projectstructuur

```
andro/
├── app/                    # Schermen & navigatie (Expo Router)
│   ├── (auth)/             # welcome, sign-up, sign-in, concept, permissions
│   ├── (tabs)/             # home, races, scan, museum, profile
│   └── _layout.tsx         # root layout + auth guard
├── components/             # Herbruikbare UI-componenten
│   ├── Globe3D/            # 3D-wereldkaart
│   ├── AllContinentsPopup/ # Animatie voor alle continenten
│   └── ...
├── lib/                    # Logica & datatoegang
│   ├── supabase.ts         # Supabase-client
│   └── challenges.ts       # challenge-logica
├── hooks/                  # Eigen React-hooks (useLocation, useAuth, ...)
├── store/                  # Zustand stores
├── types/                  # Gedeelde TypeScript-types
├── constants/              # Kleuren, theme tokens, config
├── assets/                 # Mascotte, kaartartwork, fonts, animaties
├── app.json                # Expo-configuratie
└── .env                    # Omgevingsvariabelen (niet in versiebeheer)
```

### Naamgevingsconventies

- **Componenten** → PascalCase (`RaceCard.tsx`)
- **Hooks** → camelCase met `use`-prefix (`useLocation.ts`)
- **Logica/helpers** → camelCase (`challenges.ts`)
- **Types/interfaces** → beschrijvend, enkelvoud (`SuggestedChallenge`)

---

## Database (Supabase)

Meest belangrijke tabellen:

| Tabel        | Beschrijving                                       |
| ------------ | -------------------------------------------------- |
| `profiles`   | Gebruikersprofielen, instellingen, privacy         |
| `races`      | Racegegevens: type, afstand, locatie, datum, prijs |
| `cards`      | Verzamelkaarten: artwork, zeldzaamheid, QR-code    |
| `user_cards` | Koppeltabel: welke gebruiker welke kaart scande    |

---

## Documentatie

- **Gebruikersdocumentatie** handleiding voor de eindgebruiker
- **Onderhoudsdocumentatie** technische gids voor beheer en doorontwikkeling
- **Testverslag** test- en kwaliteitsrapport
- **Bronnenlijst** geraadpleegde bronnen (APA)

Alle deliverables zitten in de bronbestanden van het Final Work.

---

## Auteur

**Laura Ocampo**
3A Multimedia & Creative Technology
Web & Mobile Development
Erasmushogeschool Brussel
Begeleider: Kobe Vermeire

---

## Licentie

Dit project werd ontwikkeld als academisch Final Work. Alle rechten op het concept, de mascotte Andro en de visuele identiteit behoren toe aan de auteur.
