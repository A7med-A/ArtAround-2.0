// server/seed/seed.js
// Uso:
//   node seed/seed.js            ← aggiunge solo se non esiste (idempotente)
//   node seed/seed.js --reset    ← svuota prima di seedare

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const Museum = require("../models/Museum");
const Item = require("../models/Item");
const Visit = require("../models/Visit");

const shouldReset = process.argv.includes("--reset");

/* ═══════════════════════════════════════════════════════════════════
 *  DATI — PINACOTECA NAZIONALE DI BOLOGNA
 * ═══════════════════════════════════════════════════════════════════ */
const pinacotecaData = {
  museum: {
    name: "Pinacoteca Nazionale di Bologna",
    slug: "pinacoteca-bologna",
    description:
      "La Pinacoteca Nazionale di Bologna conserva opere di pittura bolognese ed emiliana dal '200 al '700, con capolavori di Raffaello, Parmigianino, Guido Reni e i Carracci.",
    address: "Via delle Belle Arti 56, Bologna",
    createdBy: "autore1",
    logoUrl: "/museums/pinacoteca-bologna/logo.png",
    coverImageUrl: "/museums/pinacoteca-bologna/cover.jpg",
  },
  floors: [
    { order: 0, name: "Piano Terra", width: 15, height: 10 },
    { order: 1, name: "Primo Piano", width: 20, height: 12 },
  ],
  items: [
    {
      _pos: { floorOrder: 0, x: 7, y: 3 },
      title: "Polittico di Bologna",
      artist: "Giotto di Bondone",
      period: "1328-1334 circa",
      description:
        "Polittico a tempera e oro su tavola realizzato da Giotto per la chiesa di Santa Maria degli Angeli a Bologna.",
      imageUrl: "",
      license: "CC0",
      tags: ["medioevo", "gotico", "polittico"],
      createdBy: "autore1",
      texts: [
        {
          tone: "semplice",
          duration: "breve",
          text: "Questo polittico di Giotto è del Trecento. È dipinto su tavole di legno con oro e colori a tempera, e rappresenta la Madonna con il Bambino e alcuni santi.",
        },
        {
          tone: "medio",
          duration: "medio",
          text: "Il Polittico di Bologna fu realizzato da Giotto intorno al 1330 per la chiesa di Santa Maria degli Angeli. Composto da cinque pannelli, mostra al centro la Madonna con il Bambino circondata da quattro santi. Le figure hanno volumi solidi e volti espressivi, caratteristiche dell'innovazione giottesca.",
        },
        {
          tone: "avanzato",
          duration: "lungo",
          text: "Il Polittico di Bologna, databile tra il 1328 e il 1334, costituisce una delle opere più significative della maturità di Giotto. L'articolazione in cinque scomparti — con la Madonna col Bambino al centro, affiancata dai santi Pietro, Gabriele, Michele e Paolo — riprende un modello tipicamente trecentesco, ma viene rivoluzionato dall'impianto plastico e dalla resa psicologica dei volti. La critica ha recentemente rivalutato il ruolo della bottega nella stesura pittorica, pur confermando l'invenzione e la direzione di Giotto.",
        },
      ],
    },
    {
      _pos: { floorOrder: 1, x: 5, y: 3 },
      title: "Estasi di Santa Cecilia",
      artist: "Raffaello Sanzio",
      period: "1515-1517",
      description:
        "Capolavoro tardo di Raffaello, l'Estasi di Santa Cecilia raffigura la santa patrona della musica rapita in estasi divina mentre ascolta un coro angelico.",
      imageUrl: "",
      license: "CC0",
      tags: ["rinascimento", "raffaello", "religioso"],
      createdBy: "autore1",
      texts: [
        {
          tone: "infantile",
          duration: "breve",
          text: "Santa Cecilia è la santa della musica. In questo quadro sta ascoltando un coro di angeli in cielo. Ai suoi piedi ci sono strumenti musicali rotti, perché la musica degli angeli è molto più bella.",
        },
        {
          tone: "semplice",
          duration: "breve",
          text: "Raffaello dipinge Santa Cecilia, patrona della musica, mentre ascolta rapita il coro degli angeli. Gli strumenti ai suoi piedi sono spezzati: davanti alla musica celeste quella terrena tace.",
        },
        {
          tone: "medio",
          duration: "medio",
          text: "L'Estasi di Santa Cecilia fu dipinta da Raffaello tra il 1515 e il 1517. La santa, patrona della musica, è rappresentata mentre ascolta un coro di angeli in paradiso. Ai suoi piedi strumenti musicali spezzati simboleggiano il silenzio della musica terrena di fronte a quella divina. Accanto a lei, quattro santi: Paolo, Giovanni Evangelista, Agostino e Maria Maddalena.",
        },
        {
          tone: "avanzato",
          duration: "lungo",
          text: "Commissionata nel 1514 per la cappella di Elena Duglioli dall'Olio nella chiesa di San Giovanni in Monte, l'Estasi di Santa Cecilia rappresenta una delle più profonde riflessioni di Raffaello sul rapporto tra arte, musica e divinità. La composizione piramidale e la gestualità dei santi, specialmente l'espressione rapita di Cecilia, testimoniano l'influenza della cultura neoplatonica. Gli strumenti frantumati ai piedi della santa — un organetto portativo, tamburelli, flauti — simboleggiano il superamento della musica terrena di fronte all'armonia celeste. L'opera influenzò profondamente pittori successivi come Annibale Carracci e Guido Reni.",
        },
      ],
    },
    {
      _pos: { floorOrder: 1, x: 10, y: 3 },
      title: "Madonna degli Scalzi",
      artist: "Pietro Vannucci detto il Perugino",
      period: "1505 circa",
      description:
        "Pala d'altare del Perugino, maestro di Raffaello, con la Madonna in trono affiancata da santi in un paesaggio umbro.",
      imageUrl: "",
      license: "CC-BY",
      tags: ["rinascimento", "umbria", "pala d'altare"],
      createdBy: "autore1",
      texts: [
        {
          tone: "semplice",
          duration: "breve",
          text: "Il Perugino fu il maestro di Raffaello. Qui dipinge la Madonna con il Bambino in trono, con due santi ai lati e uno sfondo di colline.",
        },
        {
          tone: "medio",
          duration: "medio",
          text: "La Madonna degli Scalzi fu realizzata dal Perugino intorno al 1505 per la chiesa di Santa Maria degli Scalzi a Bologna. Mostra la Madonna in trono con il Bambino, affiancata dai santi Giovanni Evangelista e Girolamo. La composizione è tipica del Perugino: equilibrata, serena, con figure idealizzate e paesaggio collinare dolce sullo sfondo.",
        },
        {
          tone: "avanzato",
          duration: "lungo",
          text: "La pala degli Scalzi costituisce un'opera chiave del periodo bolognese del Perugino, figura di riferimento per la pittura rinascimentale umbra e maestro diretto di Raffaello. Il dialogo spaziale tra i personaggi — la Madonna in trono al centro, i santi Giovanni e Girolamo ai lati — si svolge in un paesaggio collinare rarefatto, tipico del linguaggio peruginesco, dove la purezza delle linee e la delicatezza cromatica veicolano un ideale di bellezza contemplativa. L'opera ebbe notevole fortuna critica e influenzò Raffaello giovane nella sua fase perugina.",
        },
      ],
    },
    {
      _pos: { floorOrder: 1, x: 14, y: 3 },
      title: "Madonna col Bambino, Santa Margherita e San Girolamo",
      artist: "Parmigianino",
      period: "1529-1530",
      description:
        "Capolavoro manierista del Parmigianino, con la caratteristica eleganza allungata delle figure e la tavolozza smaltata.",
      imageUrl: "",
      license: "CC-BY",
      tags: ["manierismo", "parmigianino", "cinquecento"],
      createdBy: "autore1",
      texts: [
        {
          tone: "semplice",
          duration: "breve",
          text: "Il Parmigianino era famoso per dipingere figure eleganti e slanciate. In questo quadro la Madonna tiene il Bambino con accanto Santa Margherita e San Girolamo.",
        },
        {
          tone: "medio",
          duration: "medio",
          text: "Questa Madonna col Bambino del Parmigianino, dipinta tra il 1529 e il 1530, mostra lo stile manierista del pittore: figure slanciate, pose eleganti, espressioni raffinate. Accanto alla Madonna, Santa Margherita d'Antiochia e San Girolamo addormentato. I colori sono morbidi e lucidi, quasi smaltati.",
        },
        {
          tone: "avanzato",
          duration: "lungo",
          text: "L'opera, firmata e datata 1529-1530, segna il ritorno di Girolamo Francesco Maria Mazzola detto il Parmigianino a Bologna dopo il soggiorno romano. La raffinata costruzione compositiva — la Madonna inclinata verso il Bambino, Santa Margherita con il suo attributo del drago ai piedi, San Girolamo addormentato in primo piano — sfrutta un complesso gioco di diagonali che esprime il gusto manierista per l'artificio e l'eleganza calcolata. La tavolozza smaltata, le carnagioni perlacee e l'allungamento innaturale delle figure anticipano la successiva Madonna dal collo lungo.",
        },
      ],
    },
    {
      _pos: { floorOrder: 1, x: 5, y: 8 },
      title: "Madonna del Rosario",
      artist: "Ludovico Carracci",
      period: "1594",
      description:
        "Grande pala di Ludovico Carracci, fondatore della riforma pittorica bolognese di fine Cinquecento.",
      imageUrl: "",
      license: "CC0",
      tags: ["barocco", "carracci", "controriforma"],
      createdBy: "autore2",
      texts: [
        {
          tone: "semplice",
          duration: "breve",
          text: "Ludovico Carracci fu uno dei pittori più importanti di Bologna. Qui dipinge la Madonna che dà il rosario ai santi, con intorno piccole scene circolari.",
        },
        {
          tone: "medio",
          duration: "medio",
          text: "La Madonna del Rosario di Ludovico Carracci, del 1594, mostra la Vergine con il Bambino circondata dai quindici misteri del rosario in piccoli riquadri circolari. Ludovico fu, insieme ai cugini Agostino e Annibale, il fondatore della riforma pittorica bolognese che superò gli eccessi del manierismo.",
        },
        {
          tone: "avanzato",
          duration: "lungo",
          text: "Realizzata nel 1594 per la chiesa di San Domenico di Bologna, la Madonna del Rosario di Ludovico Carracci costituisce un manifesto della riforma pittorica proposta dai Carracci in opposizione agli eccessi del tardo manierismo. L'impianto monumentale della composizione, il naturalismo dei volti, la gravitas delle figure e la costruzione in chiaroscuro rispondono alle istanze tridentine di una pittura devozionale accessibile e veritativa. Attorno alla Madonna si dispongono i quindici misteri del rosario in clipei, a testimonianza della sensibilità teologica del committente domenicano.",
        },
      ],
    },
    {
      _pos: { floorOrder: 1, x: 12, y: 8 },
      title: "Strage degli Innocenti",
      artist: "Guido Reni",
      period: "1611",
      description:
        "Uno dei massimi capolavori di Guido Reni, con composizione drammatica risolta in chiave di raffinata classicità.",
      imageUrl: "",
      license: "CC0",
      tags: ["barocco", "reni", "seicento"],
      createdBy: "autore2",
      texts: [
        {
          tone: "infantile",
          duration: "breve",
          text: "Questo è un quadro molto triste. Racconta una brutta storia della Bibbia: un re cattivo vuole fare del male ai bambini e le mamme cercano di salvarli. Gli angeli in alto portano delle palme per ricordare quei bambini.",
        },
        {
          tone: "semplice",
          duration: "breve",
          text: "Guido Reni dipinge un momento tragico del Vangelo: Erode ordina l'uccisione dei bambini e le madri cercano di difenderli. In alto, angeli con palme simboleggiano il martirio.",
        },
        {
          tone: "medio",
          duration: "medio",
          text: "La Strage degli Innocenti di Guido Reni, dipinta nel 1611, raffigura l'episodio evangelico dell'uccisione dei bambini ordinata da Erode. Reni affronta il soggetto tragico con eleganza classica: i gesti delle madri, i corpi dei soldati, gli angeli in cielo con le palme del martirio formano una composizione equilibrata, quasi teatrale.",
        },
        {
          tone: "avanzato",
          duration: "lungo",
          text: "Commissionata nel 1611 per la cappella Berò in San Domenico, la Strage degli Innocenti rappresenta uno dei vertici della prima maturità di Guido Reni. La composizione, costruita su diagonali incrociate, articola il dramma in primo piano — le madri, i soldati, i corpi dei bambini — mentre la zona superiore, con angeli recanti le palme del martirio, trasfigura l'orrore della strage in promessa di salvezza. La tavolozza lucente, il disegno lineare e la compostezza classica, ispirata ai modelli raffaelleschi e alla statuaria antica, costituiscono il tratto distintivo della reniana 'idea del bello'. L'opera fu lodata da Malvasia come manifesto dell'ideale classico bolognese.",
        },
      ],
    },
  ],
  visits: [
    {
      title: "Percorso classico",
      description:
        "Un percorso completo attraverso i capolavori della Pinacoteca, dal Trecento di Giotto al Seicento di Guido Reni.",
      createdBy: "autore1",
      itemIndexes: [0, 1, 2, 3, 4, 5],
    },
    {
      title: "I capolavori in 30 minuti",
      description:
        "Un percorso veloce sui tre capolavori imperdibili della Pinacoteca: Giotto, Raffaello e Guido Reni.",
      createdBy: "autore1",
      itemIndexes: [0, 1, 5],
    },
  ],
};

/* ═══════════════════════════════════════════════════════════════════
 *  DATI — MAMbo (Museo d'Arte Moderna di Bologna)
 * ═══════════════════════════════════════════════════════════════════ */
const mamboData = {
  museum: {
    name: "MAMbo — Museo d'Arte Moderna di Bologna",
    slug: "mambo-bologna",
    description:
      "Il MAMbo è il museo di arte moderna e contemporanea di Bologna. Ospita la collezione civica dal secondo Novecento a oggi e integra il Museo Morandi dedicato al maestro bolognese Giorgio Morandi.",
    address: "Via Don Minzoni 14, Bologna",
    createdBy: "autore2",
    logoUrl: "/museums/mambo-bologna/logo.png",
    coverImageUrl: "/museums/mambo-bologna/cover.jpg",
  },
  floors: [{ order: 0, name: "Piano unico", width: 18, height: 12 }],
  items: [
    {
      _pos: { floorOrder: 0, x: 4, y: 4 },
      title: "Natura morta con bottiglie",
      artist: "Giorgio Morandi",
      period: "1956",
      description:
        "Una delle celebri nature morte di Morandi, con oggetti semplici disposti in silenziose variazioni tonali.",
      imageUrl: "",
      license: "privata",
      tags: ["novecento", "morandi", "natura morta"],
      createdBy: "autore2",
      texts: [
        {
          tone: "infantile",
          duration: "breve",
          text: "Giorgio Morandi era un pittore di Bologna. Dipingeva sempre bottiglie, vasi e scatole. Ti sembrano oggetti noiosi, ma lui li guardava con grande attenzione e ogni volta li dipingeva in modo diverso.",
        },
        {
          tone: "semplice",
          duration: "breve",
          text: "Morandi è famoso per le sue nature morte: bottiglie, vasi, scatole. Usava sempre gli stessi oggetti, cambiando la disposizione e la luce per creare quadri sempre diversi.",
        },
        {
          tone: "medio",
          duration: "medio",
          text: "Giorgio Morandi dipinse questa natura morta nel 1956 nel suo studio di via Fondazza a Bologna. Gli oggetti — bottiglie e contenitori di uso comune — sono disposti con cura su un piano neutro. La pittura è sommessa, tonale, giocata su pochi accordi cromatici: grigi, terre, bianchi leggermente sporchi. È un'arte della contemplazione.",
        },
        {
          tone: "avanzato",
          duration: "lungo",
          text: "Realizzata nel 1956, questa natura morta appartiene al periodo maturo di Giorgio Morandi, quando la sua ricerca raggiunge un grado di rarefazione e introspezione estreme. Gli oggetti — bottiglie, scatole, contenitori — perdono la loro funzione utilitaria per diventare puri elementi compositivi, valori di forma e di luce. La pennellata, vibrante ma trattenuta, costruisce la materia pittorica attraverso leggere modulazioni tonali che rifiutano ogni contrasto, in una poetica del 'silenzio visivo' che dialoga con la tradizione italiana di Piero della Francesca e con le meditazioni spaziali di Cézanne. La scelta di un numero ristretto di oggetti ricorrenti costituisce un esercizio di variazione quasi musicale.",
        },
      ],
    },
    {
      _pos: { floorOrder: 0, x: 9, y: 4 },
      title: "Paesaggio di Grizzana",
      artist: "Giorgio Morandi",
      period: "1942",
      description:
        "Paesaggio collinare dell'Appennino bolognese, dove Morandi si rifugiava durante i mesi estivi.",
      imageUrl: "",
      license: "privata",
      tags: ["novecento", "morandi", "paesaggio"],
      createdBy: "autore2",
      texts: [
        {
          tone: "semplice",
          duration: "breve",
          text: "Morandi non dipingeva solo bottiglie: anche paesaggi. Questo è Grizzana, un paese di montagna vicino a Bologna dove passava l'estate.",
        },
        {
          tone: "medio",
          duration: "medio",
          text: "Questo paesaggio del 1942 mostra Grizzana, piccolo borgo dell'Appennino bolognese dove Morandi si recava ogni estate. Le case, gli alberi, le colline sono ridotti a pure forme geometriche, quasi metafisiche, costruite con tocchi densi e luce chiara.",
        },
        {
          tone: "avanzato",
          duration: "lungo",
          text: "Dipinto nel 1942 durante uno dei soggiorni estivi a Grizzana, questo paesaggio testimonia il dialogo di Morandi con il genius loci dell'Appennino bolognese. La costruzione spaziale, rigorosa e quasi costruttiva, trasforma case e alberi in volumi elementari, in una geometria silenziosa che evoca Cézanne senza mai citarlo letteralmente. La tavolozza, dominata da ocre, terre verdi e grigi luminosi, raggiunge una calibratissima fusione fra natura e forma. Il paesaggio di Grizzana diventerà, nella produzione morandiana, equivalente emotivo e formale della natura morta.",
        },
      ],
    },
    {
      _pos: { floorOrder: 0, x: 14, y: 4 },
      title: "Fiori",
      artist: "Giorgio Morandi",
      period: "1950",
      description:
        "Uno studio di fiori di Morandi, tema ricorrente trattato con la stessa rarefazione delle nature morte.",
      imageUrl: "",
      license: "privata",
      tags: ["novecento", "morandi", "fiori"],
      createdBy: "autore2",
      texts: [
        {
          tone: "semplice",
          duration: "breve",
          text: "Morandi dipingeva anche mazzetti di fiori, ma senza colori vivaci: preferiva toni delicati come beige, rosa tenue e bianco sporco.",
        },
        {
          tone: "medio",
          duration: "medio",
          text: "I Fiori del 1950 rappresentano uno dei temi più intimi di Morandi. Dipinti con tonalità smorzate — beige, rosa polverosi, bianchi sporchi — evocano un'atmosfera di delicatezza e silenzio, molto distante dall'esuberanza decorativa tipica della pittura floreale.",
        },
        {
          tone: "avanzato",
          duration: "lungo",
          text: "La serie dei Fiori, affrontata da Morandi a più riprese lungo tutta la sua carriera, costituisce un capitolo essenziale della sua ricerca. In questo esemplare del 1950 i fiori sono trattati con la stessa tensione contemplativa delle nature morte: sottratti a ogni implicazione simbolica o decorativa, diventano puri corpi di colore immersi nella luce. La tavolozza smorzata — rose spenti, gialli terrosi, grigi perlacei — e la pennellata vibratile costruiscono una presenza fragile, quasi effimera, coerente con la dimensione meditativa che caratterizza l'intera poetica morandiana.",
        },
      ],
    },
    {
      _pos: { floorOrder: 0, x: 9, y: 8 },
      title: "Grande Ferro",
      artist: "Alberto Burri",
      period: "1959",
      description:
        "Opera della serie dei Ferri di Alberto Burri, manifesto dell'Informale italiano che usa la materia industriale come linguaggio.",
      imageUrl: "",
      license: "privata",
      tags: ["contemporanea", "burri", "informale"],
      createdBy: "autore2",
      texts: [
        {
          tone: "infantile",
          duration: "breve",
          text: "Alberto Burri non usava solo colori e pennelli. Usava il ferro, il fuoco, la plastica bruciata. Questa opera è fatta con lastre di ferro saldate insieme, proprio come fa un fabbro!",
        },
        {
          tone: "semplice",
          duration: "breve",
          text: "Burri lavorava direttamente con materiali industriali: ferro, saldature, plastica. Qui ha saldato e piegato lastre di ferro per creare un'opera d'arte.",
        },
        {
          tone: "medio",
          duration: "medio",
          text: "Grande Ferro, realizzato nel 1959, appartiene alla serie dei Ferri di Alberto Burri. L'artista lavora direttamente sulla materia: saldature, arrugginiture, piegature diventano elementi espressivi. È un manifesto dell'Informale materico italiano del dopoguerra.",
        },
        {
          tone: "avanzato",
          duration: "lungo",
          text: "Realizzato nel 1959, Grande Ferro si inserisce nella ricerca di Alberto Burri sulla materia come linguaggio autonomo, che attraversa le diverse serie — Sacchi, Legni, Ferri, Plastiche, Cretti — con coerenza programmatica. La scelta del ferro, materia industriale portatrice di memorie traumatiche (il reduce della Seconda Guerra Mondiale non è mai estraneo alla poetica burriana), viene trattata attraverso saldature, piegature, combustioni che ne rivelano una dimensione lirica e drammatica al tempo stesso. L'opera dialoga con le contemporanee ricerche di Tàpies, Fautrier e Dubuffet, ma se ne distingue per un rigore formale e una gravitas che ha fatto di Burri uno dei protagonisti indiscussi dell'Informale europeo.",
        },
      ],
    },
  ],
  visits: [
    {
      title: "Highlights del MAMbo",
      description:
        "Una visita ai capolavori del MAMbo: tre opere di Morandi e il Grande Ferro di Burri.",
      createdBy: "autore2",
      itemIndexes: [0, 1, 2, 3],
    },
    {
      title: "Focus: Giorgio Morandi",
      description:
        "Tre opere di Giorgio Morandi per scoprire il maestro bolognese della natura morta e del paesaggio.",
      createdBy: "autore2",
      itemIndexes: [0, 1, 2],
    },
  ],
};

/* ═══════════════════════════════════════════════════════════════════
 *  HELPERS
 * ═══════════════════════════════════════════════════════════════════ */

/**
 * Costruisce l'array di piani con le celle:
 *  - ingresso (in basso al centro)
 *  - uscita (in basso a destra)
 *  - muri perimetrali sx e dx
 *  - celle item alle posizioni dichiarate in _pos
 */
function buildFloorsWithCells(floorsDef, itemsData, createdItems) {
  const floors = floorsDef.map((f) => ({ ...f, cells: [] }));

  // Elementi perimetrali e punti di accesso per ogni piano
  for (const f of floors) {
    // Ingresso al centro basso
    f.cells.push({
      x: Math.floor(f.width / 2),
      y: f.height - 1,
      type: "ingresso",
    });

    // Uscita a destra
    f.cells.push({
      x: f.width - 1,
      y: f.height - 1,
      type: "uscita",
    });

    // Muri lato sinistro (ogni 2 celle, per non saturare)
    for (let y = 0; y < f.height - 1; y += 2) {
      f.cells.push({ x: 0, y, type: "muro" });
    }

    // Muri lato destro (saltando uscita)
    for (let y = 0; y < f.height - 2; y += 2) {
      f.cells.push({ x: f.width - 1, y, type: "muro" });
    }
  }

  // Celle item
  itemsData.forEach((itemData, index) => {
    const { floorOrder, x, y } = itemData._pos;
    const floor = floors.find((f) => f.order === floorOrder);
    if (!floor) {
      console.warn(`  ⚠️  Piano ${floorOrder} non trovato per item "${itemData.title}"`);
      return;
    }
    floor.cells.push({
      x,
      y,
      type: "item",
      itemId: createdItems[index]._id,
    });
  });

  return floors;
}

/**
 * Popola il DB per un singolo museo.
 * Idempotente: se il museo con quello slug esiste già, salta tutto.
 */
async function seedMuseum(data) {
  const { museum, floors, items, visits } = data;

  const existing = await Museum.findOne({ slug: museum.slug });
  if (existing) {
    console.log(`  → Museo "${museum.slug}" già presente, salto.`);
    return;
  }

  console.log(`  → Creazione museo "${museum.slug}"...`);

  // 1. Creo gli item (rimuovendo il campo interno _pos)
  const itemsToCreate = items.map(({ _pos, ...rest }) => ({
    ...rest,
    museumId: museum.slug,
  }));
  const createdItems = await Item.insertMany(itemsToCreate);
  console.log(`    ✓ ${createdItems.length} item creati`);

  // 2. Costruisco le floors con cells che puntano agli _id degli item creati
  const floorsWithCells = buildFloorsWithCells(floors, items, createdItems);

  // 3. Creo il museo
  await Museum.create({
    ...museum,
    floors: floorsWithCells,
  });
  console.log(`    ✓ Museo salvato con ${floorsWithCells.length} piano/i`);

  // 4. Creo le visite (mappando gli indici agli _id reali)
  for (const visit of visits) {
    const { itemIndexes, ...rest } = visit;
    await Visit.create({
      ...rest,
      museumId: museum.slug,
      items: itemIndexes.map((i) => createdItems[i]._id),
    });
  }
  console.log(`    ✓ ${visits.length} visite create`);
}

/* ═══════════════════════════════════════════════════════════════════
 *  MAIN
 * ═══════════════════════════════════════════════════════════════════ */
async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connesso\n");

    if (shouldReset) {
      console.log("⚠️  Flag --reset rilevato: svuoto le collections Museum/Item/Visit");
      await Museum.deleteMany({});
      await Item.deleteMany({});
      await Visit.deleteMany({});
      console.log("✓ Collections svuotate\n");
    } else {
      console.log("ℹ️  Modalità additiva (usa --reset per svuotare prima)\n");
    }

    console.log("Seeding Pinacoteca Nazionale di Bologna:");
    await seedMuseum(pinacotecaData);
    console.log("");

    console.log("Seeding MAMbo:");
    await seedMuseum(mamboData);
    console.log("");

    // Statistiche finali
    const [nMuseums, nItems, nVisits] = await Promise.all([
      Museum.countDocuments(),
      Item.countDocuments(),
      Visit.countDocuments(),
    ]);
    console.log("──────────────────────────────");
    console.log(` Stato DB: ${nMuseums} musei · ${nItems} item · ${nVisits} visite`);
    console.log("──────────────────────────────");
    console.log("✓ Seed completato\n");
  } catch (err) {
    console.error("✗ Errore durante il seed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

main();
