# ArtAround Navigator

App di visita museale in **React + Vite**. È il secondo front-end del progetto:
il [Marketplace](../marketplace) serve agli autori per costruire i contenuti,
il Navigator serve al visitatore mentre è **dentro** il museo.

Pensata prima di tutto per lo smartphone (una colonna, comandi grandi, si usa
camminando) ma pienamente utilizzabile da desktop: non è un'app mobile
incorniciata in mezzo allo schermo, è la stessa app che oltre il breakpoint
ridistribuisce il contenuto sullo spazio disponibile. Vedi
[Comportamento responsive](#comportamento-responsive).

Tutti i dati arrivano dalle **API REST** del server Express/MongoDB del
progetto, via **Axios**. Nell'app non esistono contenuti locali.

---

## Avvio

```bash
npm install
```

Il server Express deve essere in esecuzione (`cd ../server && npm run dev`) con
MongoDB attivo e il database popolato (`npm run seed`).

Per provare la **visita guidata** serve anche lo scenario didattico:

```bash
npm run seed:live
```

Crea un docente (`docente` / `docente123`), un'opera privata e una visita
guidata con quiz sulla Pinacoteca.

```bash
npm run dev
```

L'app parte su <http://localhost:5174>.

### Configurazione

L'unica variabile è l'indirizzo delle API. Copia `.env.example` in `.env` se il
server non è sulla porta di default:

```
VITE_API_URL=http://localhost:3000/api
```

Il valore predefinito è `http://localhost:3000/api`, coerente con la `PORT`
definita in `server/.env`.

### Script

| Comando | Effetto |
|---|---|
| `npm run dev` | Sviluppo con hot reload sulla porta 5174 |
| `npm run build` | Build di produzione in `dist/` |
| `npm run preview` | Serve la build di produzione |
| `npm run lint` | ESLint (regole React + hooks) |

---

## Come si usa

1. **Accesso** — con account (`visitor`) oppure come **ospite**, senza registrarsi.
2. **Scelta del museo** fra quelli pubblicati.
3. **Scelta del percorso**: una visita guidata, oppure l'ascolto libero di tutte
   le opere.
4. **Visita**: per ogni tappa l'app mostra prima *dove si trova l'opera e come
   arrivarci*, poi — a conferma avvenuta — i suoi contenuti.
5. In qualsiasi momento: mappa dei piani e ricerca servizi, catalogo delle
   opere, riconoscimento di un'opera tramite codice.

### Livelli di approfondimento

Il cuore dell'app. Ogni opera ha nel database una matrice di testi
`texts[{ tone, duration, text }]`:

- **`tone`** → *livello* (Bambini · Semplice · Intermedio · Avanzato):
  cambia il registro del racconto. Comandi: «Non capisco», «Troppo semplice».
- **`duration`** → *lunghezza* (Breve · Medio · Esteso): cambia quanto il
  racconto è ampio. Comandi: «Dimmi di più», «Dimmi di meno».

La matrice nel database è **sparsa**: quasi nessuna opera ha tutte le 4×3
combinazioni. L'app non nasconde il problema né lascia comandi senza effetto:

- `resolveText()` sceglie sempre la variante più vicina a quella richiesta
  (il tono pesa più della lunghezza, perché cambia il tono di voce del racconto);
- quando la variante servita non è quella chiesta, un avviso sotto al testo lo
  dice esplicitamente;
- «Dimmi di più» cerca prima un'altra lunghezza per lo stesso livello; se
  l'autore non l'ha scritta, ripiega sulla variante adiacente per lunghezza
  anche se appartiene a un altro livello, avvisando del cambio.

### Audioguida e voce

Non esistono file audio: l'audioguida è la **sintesi vocale del browser**
(`SpeechSynthesis`) che legge il testo dell'opera al livello scelto, con
controlli di riproduzione e velocità. Dove la sintesi non è disponibile,
la barra mostra il tempo di lettura stimato e il testo resta a schermo.

I **comandi vocali** usano `SpeechRecognition` dove supportato. Sono comunque
tutti disponibili come pulsanti nell'overlay: in un museo affollato — o su un
browser senza l'API, o col microfono negato — l'app resta completamente usabile.

### Comportamento responsive

Tre fasce, un solo codice: cambia la disposizione, non i componenti.

| | **< 640 px** — smartphone | **640–1023 px** — tablet, finestre strette | **≥ 1024 px** — desktop |
|---|---|---|---|
| Navigazione | barra in basso, a portata di pollice | barra in basso | colonna a sinistra, con museo, tema e scorciatoie |
| Testo | colonna piena | colonna centrata a 640 px | colonna di lettura affiancata all'immagine |
| Liste (musei, opere, visite) | una colonna | griglia a 2 colonne | griglia che si adatta alla larghezza |
| Visita | blocchi impilati | blocchi impilati | due colonne: immagine e comandi a sinistra, racconto a destra |
| Scheda museo e opera | copertina in alto, testo sotto | idem | immagine a tutta altezza a sinistra, scheda scorrevole a destra |
| Mappa | a tutta larghezza | a tutta larghezza | a tutta larghezza, servizi in un cassetto laterale |
| Servizi, comandi vocali | pannello dal basso | pannello dal basso | cassetto laterale, comandi su 4 colonne |

Due principi:

- **Le misure di lettura restano fisse.** Una riga di testo si ferma attorno ai
  65 caratteri anche su uno schermo da 1920 px. Ogni schermata dichiara la
  propria misura (`reading`, `wide`, `full`) e intestazione, corpo e footer la
  ereditano dalla stessa variabile CSS, quindi restano allineati fra loro.
- **L'ordine nel DOM non cambia mai.** Su desktop la visita usa una griglia ad
  aree e la navigazione un `order` negativo: chi naviga con tastiera o screen
  reader incontra sempre il contenuto nell'ordine di lettura mobile.

Su desktop la tastiera è l'equivalente dei comandi grandi:

| Tasto | Azione |
|---|---|
| <kbd>→</kbd> · <kbd>←</kbd> | Tappa successiva · precedente |
| <kbd>↑</kbd> · <kbd>↓</kbd> | Racconto più esteso · più conciso |
| <kbd>Spazio</kbd> | Ascolta / pausa |
| <kbd>R</kbd> | Riascolta dall'inizio |
| <kbd>V</kbd> | Apri l'assistente vocale |
| <kbd>Esc</kbd> | Chiudi pannelli e modali |

Le scorciatoie si disattivano mentre si scrive in un campo e mentre è aperto un
overlay, per non rubare tasti a chi sta digitando.

### Visita guidata da un docente

Un docente conduce la classe: tutti gli auricolari ricevono la stessa opera
nello stesso momento, e lui vede chi è collegato e cosa sta chiedendo.

#### Il ruolo `docente`

Ruolo a sé, distinto da `admin` e `author`. Nasce da un'idea semplice: chi
porta una classe al museo non è chi cura il museo. Prepara materiale proprio e
percorsi propri, e non deve poter toccare — né vedere modificabile — nulla di
ciò che appartiene all'istituzione.

| | admin | author | **docente** | visitor |
|---|:--:|:--:|:--:|:--:|
| Creare o modificare musei | ✓ | ✓¹ | — | — |
| Modificare la mappa | ✓ | ✓¹ | — | — |
| Opere del museo | ✓ | ✓¹ | sola lettura | sola lettura |
| Proprie schede didattiche | ✓ | ✓ | ✓ sempre private | — |
| Visite | ✓ sempre libere | ✓¹ sempre libere | ✓ sempre guidate e private | — |
| Condurre una visita dal vivo | ✓ | ✓¹ | ✓ solo le proprie | — |
| Gestire gli utenti | ✓ | — | — | — |

¹ solo nei musei a cui un amministratore le ha dato accesso.

Un docente **non ha bisogno di essere abilitata museo per museo**: li vede
tutti in sola lettura e prepara visite dove vuole. Non serve il permesso di un
amministratore per portare la classe da qualche parte, visto che comunque non
può modificare nulla.

**Privato significa privato.** Un'opera o una visita con `visibility: "privata"`
la vede soltanto chi l'ha creata — nemmeno gli amministratori. È la condizione
perché il materiale di classe di un docente sia davvero suo. Raggiunge gli
studenti solo attraverso la visita che lo include, dove arriva già popolato dal
server.

Nel Marketplace il ruolo si riflette nell'interfaccia: al docente non
compaiono Map Editor e Gestione utenti, il selettore museo perde i comandi di
creazione e modifica, e il campo *Visibilità* dell'opera è bloccato su «privata».

Sul **catalogo delle opere** la distinzione non è fra ciò che vede e ciò che non
vede, ma fra ciò che può modificare e ciò che no: l'Item Manager le mostra
**tutte** le opere del museo — le servono per consultarle e per comporre i
percorsi — e quelle che non le appartengono portano l'etichetta «Del museo» al
posto dei comandi di modifica. L'elenco delle **visite** invece mostra solo le
sue: lì tutto è modificabile e un percorso altrui sarebbe solo un'illusione.

**Preparazione** (Marketplace). Il docente crea una visita, sceglie le tappe —
anche opere marcate **private**, che restano fuori dal catalogo pubblico — e
scrive le domande del quiz.

La **modalità non si sceglie**: discende dal ruolo, e la impone il server. Le
visite di un docente sono sempre *guidate* e hanno il quiz; quelle di admin e
autori sono sempre *libere* e il quiz viene scartato, perché non ci sarebbe
nessuno a somministrarlo. Nell'editor la modalità compare come etichetta, non
come campo: una scelta che può avere un solo esito non è una scelta.

**Conduzione** (Navigator, `/musei/:slug/sessioni`). Attivando la visita il
server genera un **codice di sei cifre**, es. *428 517*. È tutto
ciò che la classe deve digitare: si scrive come si pronuncia, maiuscole e
accenti non contano.

**Partecipazione** (Navigator, `/partecipa`). Lo studente digita il nome della
visita e il proprio nome. Nessuna registrazione: il nome serve al docente per
riconoscerlo nell'elenco e resta legato al dispositivo per tutta la sessione.

Durante la visita:

| Chi | Può |
|---|---|
| Docente | avanzare e tornare fra le tappe, saltare a una tappa qualsiasi, vedere chi è collegato, leggere in tempo reale chi ha chiesto cosa, avviare il quiz, chiudere la sessione |
| Studente | cambiare **livello** e **lunghezza** del racconto, riascoltare, mettere in pausa |

Lo studente **non può spostarsi fra le opere**: non è un pulsante disabilitato,
è che non esiste una rotta per farlo. Il server accetta il cambio di tappa solo
da chi conduce la sessione, e ogni tentativo altrui riceve un 403.

Ogni richiesta dello studente («più semplice», «più esteso») viene registrata e
compare subito nel monitor del docente, con nome, tipo e tappa.

**Quiz e voti.** Il docente apre le domande una alla volta e vede la
distribuzione delle risposte mentre arrivano. Lo studente risponde una volta
sola e non scopre subito se ha indovinato — l'esito arriva a fine quiz, per non
distrarlo dalla domanda successiva. Il punteggio si calcola dalle risposte
(la correzione avviene sul server: l'indice della risposta esatta non viaggia
mai verso il client prima che abbia risposto) e propone un voto in decimi, che
il docente può correggere. **Ogni voto raggiunge solo lo studente a cui
appartiene**: sullo stream dei compagni non transita.

#### Come funziona la sincronia

**Server-Sent Events.** Il server tiene aperta una risposta HTTP per ogni
partecipante e vi scrive gli aggiornamenti: quando il docente cambia tappa,
tutti si allineano nello stesso istante senza interrogare il server a
intervalli. Il traffico inverso resta REST/Axios come nel resto dell'app.

`EventSource` non permette di impostare header, quindi lo stream si autentica
con una **streamKey**: un identificativo opaco, generato all'ingresso, valido
solo per quella sessione e revocato chiudendola. Non è la credenziale
dell'account, che non compare mai in un URL.

Se la rete cade, `EventSource` riconnette da solo e l'app rilegge lo stato con
`/state`: nel frattempo il docente può essere andata avanti, e lo studente si
ritrova sulla tappa giusta senza rientrare.

Il registro delle connessioni aperte vive in memoria nel processo Node
(`server/live/hub.js`). Va bene per un'istanza sola, come in questo progetto;
con più istanze servirebbe un bus condiviso (per esempio Redis pub/sub) al
posto della `Map`.

### Mappa e percorsi

La pianta è quella reale salvata dagli autori nel Marketplace
(`Museum.floors[].cells[]`, in forma **sparsa**: compaiono solo le celle non
vuote, tutto il resto è pavimento).

- Il percorso verso un'opera o un servizio è calcolato con una **BFS** che
  aggira i muri — non una linea retta che attraverserebbe le pareti.
- I servizi vengono cercati **su tutti i piani**: nei musei reali toilette e bar
  stanno spesso solo al piano d'ingresso, mentre il visitatore è altrove. Se il
  servizio è su un altro piano la mappa ci si sposta da sola e il percorso parte
  dall'ingresso di quel piano (la mappa non modella scale e ascensori).
- **Posizionamento**: non c'è localizzazione indoor. La posizione nota è
  l'ingresso del museo finché il visitatore non conferma «Sono arrivato» su una
  tappa; da lì tutte le distanze vengono ricalcolate. È il motivo per cui la
  conferma di arrivo non è una formalità.

---

## Rapporto con il server

L'app usa le API esistenti, **senza modifiche ai modelli**:

| Chiamata | Uso nel Navigator |
|---|---|
| `POST /api/auth/login` · `/register` | Accesso e registrazione (ruolo `visitor`) |
| `POST /api/auth/guest` | Modalità ospite |
| `GET /api/auth/me` | Validazione del token salvato all'avvio |
| `GET /api/museums` | Elenco musei |
| `GET /api/museums/:slug` | Scheda del museo **e pianta** (`floors[].cells[]`) |
| `GET /api/museums/:slug/items` | Opere, con la matrice `texts[]` |
| `GET /api/museums/:slug/visits` | Percorsi guidati, con `items[]` già popolati |
| `POST /api/sessions` · `GET /api/sessions` | Docente: apre e ritrova le proprie sessioni |
| `GET /api/sessions/:code/monitor` | Docente: partecipanti, richieste, risposte, voti |
| `PATCH /api/sessions/:code` | Docente: tappa, stato, domanda corrente |
| `POST /api/sessions/:code/grades` | Docente: calcola o corregge i voti |
| `POST /api/sessions/:code/join` | Studente: entra con codice e proprio nome |
| `GET /api/sessions/:code/stream` | Stream SSE dello stato condiviso |
| `GET /api/sessions/:code/state` | Riallineamento dopo un'interruzione |
| `POST /api/sessions/:code/events` | Studente: segnala una richiesta al docente |
| `POST /api/sessions/:code/answers` | Studente: risponde a una domanda |

### Modifiche al server

**Prima consegna — `POST /api/auth/guest`.** Tutte le rotte `/api/museums/*`
richiedono un JWT, quindi anche l'ospite deve averne uno. L'endpoint rilascia un
token per un account condiviso `ospite` con ruolo `visitor`, creato al primo
utilizzo con una password casuale non utilizzabile per il login. Il middleware
`canAccessMuseum` già consentiva ai `visitor` la lettura di qualsiasi museo.

**Visita guidata.** L'estensione non era realizzabile senza estendere il
modello dei dati. Tutte le aggiunte sono retro-compatibili: i documenti
esistenti restano validi e il Marketplace continua a funzionare.

| Dove | Aggiunta |
|---|---|
| `Item` | `visibility: "pubblica" \| "privata"` (default *pubblica*) |
| `Visit` | `mode: "libera" \| "guidata"` (default *libera*), `quiz[]` |
| `Session` | modello nuovo: sessione live, partecipanti, richieste, risposte, voti |
| `items.controller` | filtra le opere private per chi non cura il museo |
| `live/hub.js` | registro delle connessioni SSE aperte |
| `live/codeName.js` | generatore dei nomi mnemonici |
| `sessions.*` | rotte e controller della visita guidata |

### Cosa il server non memorizza (e l'app deriva)

Il Navigator non inventa campi che il database non ha:

| Informazione mostrata | Da dove viene |
|---|---|
| Posizione, piano e sala di un'opera | Cella `type: "item"` con `itemId` corrispondente in `Museum.floors[]` |
| Durata di una visita | Somma dei tempi di lettura stimati + margine di osservazione per tappa |
| Livelli di una visita | Unione dei `tone` scritti per le sue opere |
| Tempo di ascolto di un testo | Conteggio parole (≈155 parole/minuto) |
| Distanze in metri | Passi della BFS × lato cella (1,5 m) |
| Avanzamento in una visita libera | Stato locale, persistito in `localStorage` |

Nella visita **guidata** è l'opposto: la tappa corrente vive sul server
(`Session.stopIndex`), perché è condivisa da tutta la classe e decisa da una
persona sola.

Un'opera **non collocata** sulla pianta (nei dati di esempio ce n'è una) resta
del tutto ascoltabile: viene semplicemente saltata la fase di avvicinamento.

---

## Struttura

```
navigator/
├── index.html                  Entry HTML + tema applicato prima del primo paint
├── vite.config.js              Alias "@" → src/, porta 5174
├── eslint.config.js
└── src/
    ├── main.jsx · App.jsx      Bootstrap e composizione dei provider
    │
    ├── app/                    Routing
    │   ├── AppRoutes.jsx       Mappa delle rotte
    │   └── RequireAuth.jsx     Guardia delle rotte autenticate
    │
    ├── api/                    Layer HTTP — l'unico che conosce gli endpoint
    │   ├── client.js           Istanza Axios: token, errori, 401
    │   ├── auth.api.js · museums.api.js · items.api.js · visits.api.js
    │   └── index.js
    │
    ├── context/                Stato condiviso
    │   ├── ThemeContext.jsx    Tema chiaro/scuro persistito
    │   ├── AuthContext.jsx     Sessione: login, registrazione, ospite
    │   ├── ToastContext.jsx    Notifiche effimere
    │   ├── MuseumContext.jsx   Museo attivo: dati + indici derivati
    │   ├── TourContext.jsx     Visita libera: tappe, livello, posizione
    │   └── LiveSessionContext.jsx  Visita guidata: stato deciso dal docente
    │
    ├── hooks/
    │   ├── useAsync.js         Fetch con stato loading/error/reload
    │   ├── useSpeech.js        Audioguida (SpeechSynthesis + fallback)
    │   ├── useVoiceRecognition.js  Comandi vocali (SpeechRecognition)
    │   ├── useKeyboardShortcuts.js Scorciatoie da tastiera (desktop)
    │   ├── useSessionStream.js Connessione SSE alla visita guidata
    │   └── useMapNavigation.js Zoom, pan e pizzico sulla pianta
    │
    ├── lib/                    Logica di dominio, senza React
    │   ├── content.js          Selezione dei testi da Item.texts
    │   ├── museumMap.js        Lettura di floors[], BFS, ricerca servizi
    │   ├── format.js · storage.js
    │
    ├── constants/
    │   ├── schema.js           Enum allineati ai modelli Mongoose
    │   ├── config.js           API, storage, rotte, preferenze
    │   └── voiceCommands.js    Catalogo comandi + riconoscimento frasi
    │
    ├── components/             Componenti riusabili
    │   ├── ui/                 Icon, Button, BigButton, Pill, ArtImage,
    │   │                       ProgressBar, Toast, Sheet, ConfirmDialog,
    │   │                       StateView, Overlay, ThemeToggle
    │   ├── layout/             AppShell, Screen, MainNav, Logo
    │   ├── map/                MuseumMap, FloorTabs, MapLegend
    │   ├── audio/              AudioPlayer
    │   └── voice/              VoiceButton, VoiceOverlay
    │
    ├── features/               Una cartella per area funzionale
    │   ├── live/               Visita guidata — studente: JoinScreen,
    │   │                       LiveScreen, QuizPanel
    │   ├── teach/              Visita guidata — docente: SessionsScreen,
    │   │                       ConsoleScreen
    │   ├── onboarding/         SplashScreen, LoginScreen
    │   ├── museums/            MuseumsScreen, MuseumDetailScreen,
    │   │                       MuseumLayout, TabsLayout
    │   ├── visits/             VisitsScreen
    │   ├── tour/               TourScreen, ArrivalPanel, ArtworkPanel,
    │   │                       useTourCommands
    │   ├── artworks/           ArtworksScreen, ArtworkDetailScreen
    │   └── map/                MapScreen
    │
    └── styles/
        ├── tokens.css          Design token, temi chiaro e scuro
        └── base.css            Reset, tipografia, animazioni
```

### Convenzioni

- **CSS Modules** (`Componente.module.css`) accanto al componente. I colori
  passano sempre dalle variabili di `tokens.css`: nessun valore esadecimale
  sparso nei componenti, così il tema chiaro funziona senza codice dedicato.
- **`lib/` non importa React.** Selezione dei testi e calcolo dei percorsi sono
  funzioni pure, isolate dall'interfaccia.
- **`api/` è l'unico strato che conosce gli endpoint.** I componenti non
  chiamano mai direttamente Axios.
- **`constants/schema.js` rispecchia i modelli Mongoose.** Se cambia un `enum`
  in `server/models/`, si aggiorna lì e in un posto solo.
- **Un comando, un percorso.** Voce, pulsanti e tastiera passano tutti da
  `useTourCommands`: «Dimmi di più» fa esattamente la stessa cosa comunque venga
  invocato.
- **Due breakpoint, sempre gli stessi:** 640 px e 1024 px. Non esistono
  componenti "desktop": la differenza vive nelle media query dei CSS Modules,
  mai in misurazioni della finestra in JavaScript.

### Rotte

| Rotta | Schermata |
|---|---|
| `/` | Splash (verifica del token salvato) |
| `/accedi` | Login · registrazione · ospite |
| `/musei` | Elenco musei |
| `/musei/:slug` | Scheda del museo |
| `/musei/:slug/visite` | Scelta del percorso |
| `/musei/:slug/visita` | Visita in corso |
| `/musei/:slug/opere` | Catalogo delle opere |
| `/musei/:slug/opere/:itemId` | Scheda dell'opera |
| `/musei/:slug/mappa` | Pianta e servizi (`?servizio=bagno` apre un percorso) |
| `/partecipa` | Studente: entra in una visita guidata |
| `/sessione/:code` | Studente: visita guidata in corso |
| `/musei/:slug/sessioni` | Docente: attiva una visita guidata |
| `/musei/:slug/sessioni/:code` | Docente: console di conduzione |

---

## Accessibilità e comportamento

- **Nessun vicolo cieco.** Da ogni schermata si torna indietro e da ogni
  schermata di primo livello si raggiunge il pannello account, con l'identità
  corrente e l'uscita. Il tema resta al dispositivo, tutto il resto — token,
  utente, percorso in corso, partecipazione a una visita guidata — viene
  cancellato all'uscita, perché è legato a chi era collegato.
- Comandi principali alti almeno 54 px, usabili senza guardare lo schermo.
- `aria-label` sui controlli a sola icona, `role="status"` sui toast,
  `role="progressbar"` sulle barre di avanzamento.
- Su desktop la visita è percorribile interamente da tastiera; l'ordine di
  tabulazione segue sempre il DOM, che resta quello di lettura mobile.
- Chiusura con `Esc` e tocco sullo sfondo per modali e pannelli.
- Rispetto di `prefers-reduced-motion`.
- Tema scuro come default: in museo la luce è bassa e uno schermo chiaro
  disturba gli altri visitatori.
- La visita in corso sopravvive alla chiusura dell'app o al blocco schermo.
