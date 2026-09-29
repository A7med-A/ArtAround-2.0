# ArtAround Marketplace — versione plain HTML/JS/CSS

Stessa app di `marketplace_versione finale/` ma **senza Web Components**: solo HTML standard, CSS classico e JavaScript ES modules.

## Differenze chiave rispetto alla versione Web Components

| Aspetto | versione `marketplace_versione finale/` | versione `marketplace-js/` |
|---|---|---|
| **Custom elements** | `<aa-btn>`, `<aa-input>`, `<aa-modal>`, … | tag HTML standard (`<button>`, `<input>`) con classi `.aa-btn`, `.aa-input`, … |
| **Shadow DOM** | sì, ogni componente isola il proprio CSS | no, CSS in fogli condivisi, scoping per prefisso `aa-` |
| **CSS dei componenti** | inline nel template di ogni Web Component | file dedicati in `styles/components/` |
| **Comunicazione padre↔figlio** | CustomEvent + property setter | callback in opzioni del factory + DOM events |
| **Rendering complesso** | classi che estendono `HTMLElement` | factory function `mountXxx(target, opts)` che ritorna un controller con `update()` |
| **Atomi** (button, input, badge) | Custom Element | classe CSS applicata a tag standard |

## Avvio

Stessa procedura della versione originale: serve un server statico (Live Server, `npx serve .`, Express static).

```bash
cd marketplace-js
npx serve .
```

Apri `http://localhost:3000/index.html`. Backend Express atteso su `localhost:3000/api`.

## Struttura

```
marketplace-js/
├── index.html                       Landing pubblica
├── login.html                       Login + Register
├── app.html                         Shell loggata (markup statico)
│
├── styles/
│   ├── tokens.css                   Design tokens dark/light
│   ├── base.css                     Reset + tipografia
│   ├── layout/
│   │   └── app-shell.css            Layout della shell
│   ├── pages/
│   │   ├── landing.css
│   │   └── login.css
│   └── components/                  CSS dei "componenti"
│       ├── atoms.css                btn, badge, input, select, toggle, spinner, toast, icon
│       ├── modals.css               overlay + dialog + form layout
│       ├── cards.css                item-card, visit-card, stop-row, empty-state
│       ├── sidebar.css              sidebar + topbar + museum selector + theme toggle
│       ├── editors.css              tag-input, text-variant-editor, visit-edit-panel
│       └── map.css                  toolbar, floor-tabs, map-grid, cell-detail-panel
│
└── js/
    ├── bootstrap/
    │   └── theme-init.js            no-flash sincrono
    │
    ├── pages/                       Entry point per ogni HTML
    │   ├── landing.js
    │   ├── auth.js
    │   └── app.js
    │
    ├── core/                        Identico alla versione originale
    │   ├── config.js · theme.js · http.js
    │   ├── auth.js · store.js
    │
    ├── services/                    Identico
    │   ├── museums.service.js
    │   ├── items.service.js
    │   └── visits.service.js
    │
    ├── utils/                       Quasi identico
    │   ├── dom.js                   ($, $$, escapeHtml, fromHtml + re-export di toast)
    │   ├── schema.js · validators.js · map.js
    │
    ├── ui/                          Sostituisce js/components/
    │   ├── icon.js                  iconHTML(name, opts) → stringa <svg>
    │   ├── toast.js                 toast(msg, variant)
    │   ├── modal.js                 openModal({ title, bodyHTML, width, onClose })
    │   ├── confirm-modal.js         openConfirm({ ... onConfirm })
    │   ├── theme-toggle.js          mountThemeToggle(target)
    │   ├── topbar.js                mountTopbar(target)
    │   ├── sidebar.js               mountSidebar(target) — include drawer mobile
    │   ├── museum-selector.js       mountMuseumSelector(target)
    │   ├── museum-modals.js         openMuseumCreateModal / openMuseumEditModal
    │   ├── item-card.js             itemCardHTML(item) → string
    │   ├── item-edit-modal.js       openItemEditModal({ data, onSave })
    │   ├── tag-input.js             mountTagInput(target, { value, onChange })
    │   ├── text-variant-editor.js   mountTextVariantEditor(target, { value, onChange })
    │   ├── visit-card.js            visitCardHTML(visit) → string
    │   ├── visit-edit-panel.js      mountVisitEditPanel(target, { ... })
    │   ├── item-picker-modal.js     openItemPickerModal({ items, onPicked })
    │   ├── stop-row.js              stopRowHTML({ item, index, total }) → string
    │   ├── map-toolbar.js           mountMapToolbar(target, state, handlers)
    │   ├── floor-tabs.js            mountFloorTabs(target, state, handlers)
    │   ├── map-grid.js              mountMapGrid(target, state, handlers)
    │   └── cell-detail-panel.js     mountCellDetailPanel(target, state, handlers)
    │
    └── views/                       Identica responsabilità della versione originale
        ├── items.view.js            Item Manager
        ├── visits.view.js           Visit Editor
        └── map.view.js              Map Editor
```

## Convenzioni di "componente"

I componenti sono di tre famiglie:

### 1. Atomi — solo CSS

Bottoni, badge, input, toggle, spinner, divider: **non** hanno una funzione JS. Si usano come tag standard con classi documentate in `styles/components/atoms.css`.

```html
<button class="aa-btn aa-btn--primary">
  <svg class="aa-icon">…</svg>
  <span>Salva</span>
</button>

<input class="aa-input" type="text" placeholder="Titolo" />

<span class="aa-badge aa-badge--success">Pubblicato</span>
```

### 2. Render helper — funzione che ritorna stringa HTML

Per componenti stateless (cards, righe ripetute): una funzione `xxxHTML(data)` che ritorna l'HTML come stringa. Viene poi inserita in template letterali e gestita via event delegation dal contenitore.

```js
// item-card.js
export function itemCardHTML(item) {
  return `<article class="aa-item-card" data-id="${item._id}">…</article>`;
}

// items.view.js
container.innerHTML = items.map(itemCardHTML).join("");
container.addEventListener("click", (e) => {
  const card = e.target.closest(".aa-item-card");
  if (!card) return;
  const action = e.target.closest("[data-action]")?.dataset.action;
  // ... gestisco l'azione
});
```

### 3. Mount controller — funzione che monta DOM e ritorna `{ update, … }`

Per componenti stateful (sidebar, topbar, modali, picker, editor di mappa). Una funzione `mountXxx(target, opts)` che:
1. accetta un nodo DOM dove montare;
2. installa listener;
3. ritorna un piccolo oggetto controller con metodi `update(partial)`, `close()`, `setValue()` ecc.

```js
const grid = mountMapGrid(container, { floor, tool, zoom }, {
  onCellPaint: (xy) => { … },
  onCellSelect: (xy) => { … },
});
// dopo aver cambiato lo stato:
grid.update({ floor: nuovoFloor, zoom: 1.2 });
```

Per le modali, `openModal()` e `openConfirm()` ritornano un controller con `close()` e un riferimento al `body` per inserire contenuto dinamico.

## Cosa è rimasto identico

- **`core/`** (config, theme, http, auth, store) — file copiati 1:1
- **`services/`** — file copiati 1:1
- **`utils/`** — `escapeHtml`, `validateItem`, `clampDim`, `resizeFloor`, ecc. invariati. `dom.js` re-esporta `toast` da `ui/toast.js` per non rompere import esistenti.
- **`tokens.css`**, **`base.css`** — invariati
- **`pages/landing.css`**, **`pages/login.css`**, **`layout/app-shell.css`** — invariati

## Convenzioni di caricamento per ogni pagina

Stesso pattern della versione originale:

```html
<head>
  <script src="js/bootstrap/theme-init.js"></script>     <!-- sync, no flash -->
  <link rel="stylesheet" href="styles/tokens.css" />
  <link rel="stylesheet" href="styles/base.css" />
  <link rel="stylesheet" href="styles/components/atoms.css" />
  <link rel="stylesheet" href="styles/<dir>/<page>.css" />
</head>
<body>
  <!-- markup -->
  <script type="module" src="js/pages/<entry>.js"></script>
</body>
```

`app.html` carica in più tutti i fogli `styles/components/*.css`.

## Funzionalità (uguali alla versione originale)

- **Item Manager** — lista filtrabile, modale create/edit con varianti tono×durata e tag
- **Visit Editor** — pannello full-screen con metadati + tappe ordinate + item picker multi-select
- **Map Editor** — multi-floor, paint-and-drag, undo/redo, zoom, resize piani, salvataggio
- **Multi-museo** — dropdown con creazione e modifica musei
- **Tema dark/light** — toggle persistito in localStorage
- **Responsive mobile** — sidebar a drawer off-canvas, layout a colonna
