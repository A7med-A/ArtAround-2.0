# ArtAround 2.0

Piattaforma completa per la valorizzazione dei contenuti museali: autori curano
i propri musei da un pannello dedicato, i visitatori vivono la visita in
un'app pensata per lo smartphone, un backend unico serve entrambi.

Progetto universitario — Tecnologie Web, A.A. 2025/26.

---

## 🏛️ I tre progetti

Il repository ospita tre applicazioni indipendenti che condividono un solo
backend e una sola base dati MongoDB.

| Cartella | Cos'è | Stack |
|---|---|---|
| [`server/`](./server) | API REST + autenticazione + logica di dominio | Node.js · Express · MongoDB (Mongoose) |
| [`marketplace/`](./marketplace) | Pannello degli **autori e amministratori**: creazione musei, opere, visite, mappa | HTML + CSS + JavaScript ES modules (nessun framework) |
| [`navigator/`](./navigator) | App di visita per il **visitatore**, mobile-first ma anche desktop | React 18 · Vite · Axios · React Router |

Le due app front-end sono servite separatamente da un web server statico; il
backend è comune ed è l'unico che parla con MongoDB.

```
                ┌─────────────────────────────┐
                │        MongoDB              │
                │  museums · items · visits   │
                │  users · sessions           │
                └──────────────┬──────────────┘
                               │ Mongoose
                    ┌──────────┴──────────┐
                    │      server/         │
                    │   Express · JWT      │
                    │   /api/*             │
                    └──────┬───────┬───────┘
                           │       │
           REST · JSON · Bearer JWT
                           │       │
              ┌────────────┘       └────────────┐
              ▼                                 ▼
     ┌───────────────────┐            ┌───────────────────┐
     │   marketplace/    │            │    navigator/     │
     │   Vanilla JS      │            │   React + Vite    │
     │   Autori & Admin  │            │   Visitatori      │
     └───────────────────┘            └───────────────────┘
```

---

## 👤 Ruoli e permessi

L'applicazione distingue quattro tipi di account. Il backend è l'unica fonte di
verità: i due front-end mostrano/nascondono l'UI in base al ruolo, ma ogni
richiesta è validata di nuovo lato server.

|  | admin | author | docente | visitor |
|---|:--:|:--:|:--:|:--:|
| Creare e modificare musei | ✓ | ✓¹ | — | — |
| Modificare la mappa di un museo | ✓ | ✓¹ | — | — |
| CRUD opere e visite del museo | ✓ | ✓¹ | — | — |
| Preparare visite guidate private | ✓ | ✓ | ✓ | — |
| Condurre una visita guidata dal vivo | ✓ | ✓¹ | ✓ | — |
| Gestione utenti (concedere/revocare accessi) | ✓ | — | — | — |
| Visitare musei e ascoltare opere | ✓ | ✓ | ✓ | ✓ |

¹ solo nei musei a cui un amministratore ha dato accesso esplicito.

**Guest mode**: il Navigator può essere usato anche senza account
(le richieste GET pubbliche non richiedono token). La registrazione serve solo
per riprendere una visita da un altro dispositivo o partecipare a una visita
guidata dal vivo.

---

## 🚀 Setup

### Prerequisiti

- **Node.js** ≥ 18
- **MongoDB** in locale (o URI remoto) — servizio attivo su `mongodb://localhost:27017`
- Un browser moderno (Chrome / Edge / Firefox / Safari) per il front-end

### 1. Backend

```bash
cd server
npm install
```

Crea un file `server/.env` (non è versionato):

```
MONGO_URI=mongodb://localhost:27017/artaround
PORT=3000
JWT_SECRET=cambia-questo-in-una-stringa-lunga-e-casuale
```

Popola il database con dati di esempio:

```bash
npm run seed         # museo dimostrativo + opere + visite pubbliche
npm run seed:live    # + scenario didattico (docente + visita guidata privata)
```

Avvia il server:

```bash
npm run dev          # con nodemon, hot reload
# oppure
npm start            # produzione
```

Il server ascolta su `http://localhost:3000/api`.

### 2. Marketplace (autori / admin)

È un'app statica, non c'è build: bastano tre file HTML + gli asset.

```bash
cd marketplace
# Aprire index.html con qualunque server statico:
npx serve .
# oppure la Live Server di VS Code, oppure Python:
python -m http.server 5500
```

Apri poi `http://localhost:5500/index.html` (o la porta che il tuo server ha
scelto). Da qui l'utente si registra come `author` o `admin` e comincia a
costruire i contenuti.

### 3. Navigator (visitatori)

```bash
cd navigator
npm install
cp .env.example .env    # imposta VITE_API_URL se il server non è su :3000
npm run dev
```

L'app parte su `http://localhost:5174`.

Per provarla dallo smartphone in LAN, cerca l'IP del PC nella console di Vite e
apri quello (es. `http://192.168.1.42:5174`) dal telefono connesso alla stessa
rete.

---

## 🗂️ Struttura del repository

```
ArtAround-2.0/
├── README.md                    ← sei qui
├── .gitattributes
├── .gitignore
│
├── server/                      Backend Express
│   ├── index.js
│   ├── db.js
│   ├── package.json
│   ├── models/                  Schemi Mongoose
│   │   ├── User.js              admin | author | docente | visitor
│   │   ├── Museum.js            slug, floors[], cells[]
│   │   ├── Item.js              texts[] (tone × duration)
│   │   ├── Visit.js             items[], visibility (pubblica | privata | guidata)
│   │   └── Session.js           visite guidate live
│   ├── controllers/             Logica degli endpoint
│   ├── routes/                  /auth · /users · /museums · /sessions
│   ├── middleware/              requireAuth, requireAdmin, canAccessMuseum
│   ├── lib/                     Utility condivise
│   ├── live/                    Coordinamento delle visite live
│   └── seed/
│       ├── seed.js              Musei, opere, visite dimostrative
│       └── seed-live.js         Scenario didattico (docente + classe)
│
├── marketplace/                 Front-end autori & admin
│   ├── index.html               Landing
│   ├── login.html               Login + registrazione
│   ├── app.html                 Shell loggata (SPA client-side)
│   ├── styles/                  CSS scomposto per ruolo
│   ├── assets/                  Immagini, icone
│   └── js/
│       ├── core/                Config, auth, http client, store
│       ├── services/            Chiamate API per risorsa
│       ├── ui/                  Moduli UI (sidebar, topbar, modali, editor mappa…)
│       ├── views/               Pagine (items, visits, map, users)
│       └── utils/               Helpers (dom, schema, validators, map)
│
└── navigator/                   Front-end visitatori (React + Vite)
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── eslint.config.js
    ├── .env.example
    └── src/
        ├── main.jsx             Entry
        ├── App.jsx              Provider stack + router
        ├── app/                 Routing e guardie
        ├── api/                 Client Axios + endpoint per risorsa
        ├── context/             Auth, tema, notifiche, visita corrente
        ├── hooks/               TTS, voce, mappa
        ├── lib/                 Logica di dominio (pathfinding, resolveText…)
        ├── constants/           Schema condiviso col server
        ├── components/          UI riusabile (ui/ · layout/ · map/ · sheets/)
        ├── pages/               Screen (Login, Museums, Visits, Map, Artwork…)
        └── styles/              Design tokens dark/light + base
```

---

## 🔑 Cosa fanno le due app

### `marketplace` — l'editor

Autori e amministratori entrano da qui.

- **Amministratore**: crea musei, dà accesso agli autori, gestisce tutti gli
  account. Vede tutto.
- **Autore**: modifica solo i musei a cui l'admin gli ha dato accesso. Ha 4
  strumenti:
  - **Item Manager** — crea opere con più varianti di testo (per tono e
    durata) e tag.
  - **Visit Editor** — costruisce visite scegliendo item, riordinandoli e
    scrivendo la descrizione del percorso.
  - **Map Editor** — disegna piante multipiano con celle tipizzate (muro,
    opera, ingresso, uscita, bagno, bar). Le opere sulla mappa sono
    collegate a un `Item`.
  - **Gestione utenti** (solo admin): concessione/revoca accessi ai musei.

Tutte le pagine sono renderizzate lato client con moduli ES puri; niente build,
niente framework.

### `navigator` — la visita

Il visitatore lo usa dentro il museo.

- **Login o guest**: si può entrare senza account.
- **Museo → visita → opere**: sequenza guidata. Ogni tappa mostra prima *dove
  si trova l'opera e come raggiungerla*, poi il contenuto.
- **Testo adattivo**: la stessa opera ha più varianti; l'app sceglie quella
  giusta in base al **livello** (Bambini / Semplice / Intermedio / Avanzato) e
  alla **lunghezza** (Breve / Medio / Esteso). L'utente cambia registro con
  bottoni («più semplice», «dimmi di più») o a voce.
- **Audioguida via TTS**: sintesi vocale del browser, con controlli play /
  pausa / velocità.
- **Comandi vocali**: dove `SpeechRecognition` è disponibile; altrimenti gli
  stessi comandi sono su bottone.
- **Mappa interattiva**: pianta del piano corrente con posizione,
  destinazione, servizi (bagno, bar, uscita), zoom e pan.
- **Visite guidate live** (per docenti): il docente sincronizza la classe sulla
  stessa opera dallo stesso microfono.

React + Vite; mobile-first ma il layout si ridistribuisce su desktop.

---

## 🌐 API principali

Riassunto rapido; ogni endpoint di scrittura richiede l'header
`Authorization: Bearer <JWT>`.

```
POST   /api/auth/register       Registra un account (role: admin|author|docente|visitor)
POST   /api/auth/login          Ritorna { token, user }
GET    /api/auth/me             Info sull'utente corrente

GET    /api/users               Solo admin
POST   /api/users/:id/grant     Solo admin — museumSlug body
POST   /api/users/:id/revoke    Solo admin
DELETE /api/users/:id           Solo admin

GET    /api/museums             Filtrato per ruolo
GET    /api/museums/:slug
POST   /api/museums             Solo admin
PUT    /api/museums/:slug       Admin sempre, author se autorizzato
PATCH  /api/museums/:slug
DELETE /api/museums/:slug       Solo admin

GET    /api/museums/:slug/items
POST   /api/museums/:slug/items
PUT    /api/museums/:slug/items/:id
DELETE /api/museums/:slug/items/:id

GET    /api/museums/:slug/visits
POST   /api/museums/:slug/visits
PUT    /api/museums/:slug/visits/:id
DELETE /api/museums/:slug/visits/:id

POST   /api/sessions            Crea una sessione live di visita guidata
GET    /api/sessions/:code      Info + stato di una sessione
POST   /api/sessions/:code/*    Comandi del docente (next, prev, jump…)
```

---

## 🎨 Stack tecnologico

**Backend**
- Node.js ≥ 18 + Express 5
- MongoDB con Mongoose
- JWT (jsonwebtoken) per l'autenticazione
- Nodemon in sviluppo

**Marketplace**
- HTML5 + CSS3 + JavaScript ES2022 (moduli nativi)
- Nessun framework né bundler: tutto è servito staticamente
- CSS suddiviso per pagina e ruolo, design tokens dark/light

**Navigator**
- React 18 + Vite 6
- React Router 6 per il routing client-side
- Axios per le chiamate REST
- ESLint (React + hooks)
- Web APIs: `SpeechSynthesis` (audioguida), `SpeechRecognition` (comandi voce)
- CSS Modules + design tokens (coerenti col Marketplace)

---

## 🗃️ Dati di esempio

Dopo `npm run seed` in `server/`:

- 1 museo di prova (Pinacoteca) con pianta a due piani, opere, visite
  pubbliche.
- Account demo — usati solo come esempi, ricreali con la registrazione:
  `admin` / `admin123` — amministratore
  `autore1` / `autore123` — autore assegnato al museo di prova

Dopo `npm run seed:live` aggiunge:

- `docente` / `docente123` — account di tipo `docente`
- Una visita guidata con quiz sulla Pinacoteca (privata).

---

## 📦 Deploy — note rapide

Non è predisposto un deploy chiavi in mano; ogni pezzo è indipendente e si può
ospitare separatamente.

- **Server**: qualunque runtime Node (Render, Railway, Fly.io, Heroku, VPS).
  Ricorda di impostare `MONGO_URI`, `PORT`, `JWT_SECRET` come variabili
  d'ambiente.
- **Marketplace**: qualunque hosting statico (Netlify, GitHub Pages, S3+CF,
  Vercel). Nessuna build necessaria; l'URL delle API va aggiornato in
  `marketplace/js/core/config.js`.
- **Navigator**: `npm run build` produce `dist/`, deployabile su qualunque
  hosting statico. La variabile `VITE_API_URL` è letta a build-time.

Ricorda di aggiornare il `CORS` in `server/index.js` con gli origin di
produzione.

---

## 📄 Licenza

Progetto universitario, senza licenza open per default.

---

## 👤 Autore

Ahmed Ayad — Progetto universitario, corso di Tecnologie Web, A.A. 2025/26.
