// server/seed/seed-live.js
// Scenario didattico per l'estensione "visita guidata sincronizzata".
//
// Crea:
//   • un docente (ruolo author) con accesso alla Pinacoteca
//   • un'opera PRIVATA, che non compare nel catalogo pubblico
//   • una visita GUIDATA che include quell'opera, con quiz finale
//
// Uso:
//   node seed/seed-live.js            ← idempotente
//   node seed/seed-live.js --reset    ← rimuove prima lo scenario

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const User = require("../models/User");
const Item = require("../models/Item");
const Visit = require("../models/Visit");
const Session = require("../models/Session");

const MUSEUM = "pinacoteca-bologna";
const TEACHER = { username: "docente", email: "docente@artaround.local", password: "docente123" };
const PRIVATE_TITLE = "Appunti di visita — La luce nel Seicento bolognese";
const VISIT_TITLE = "Classe 3ªB — Luce e colore in Pinacoteca";

const shouldReset = process.argv.includes("--reset");

const privateItem = {
  museumId: MUSEUM,
  title: PRIVATE_TITLE,
  artist: "Materiale didattico",
  period: "Percorso di classe",
  description:
    "Scheda preparata dal docente per la classe: mette a confronto il trattamento della luce in Guido Reni e nei Carracci. Non fa parte del catalogo pubblico del museo.",
  license: "privata",
  visibility: "privata",
  tags: ["didattica", "luce", "seicento"],
  createdBy: TEACHER.username,
  texts: [
    {
      tone: "semplice",
      duration: "breve",
      text: "Guardate da dove arriva la luce in questi dipinti. Non è la luce del sole: è il pittore che decide dove farla cadere, per farci guardare proprio quel punto del quadro.",
    },
    {
      tone: "medio",
      duration: "medio",
      text: "Nel Seicento bolognese la luce smette di essere solo un modo per rendere visibili le figure e diventa uno strumento del racconto. I Carracci la usano per costruire lo spazio in profondità; Guido Reni la impiega per isolare i gesti principali, lasciando il resto in una penombra uniforme. Osservate dove cade la luce più intensa: quasi sempre coincide con il momento decisivo della scena.",
    },
    {
      tone: "avanzato",
      duration: "lungo",
      text: "La riforma carraccesca ridefinisce la funzione del lume nella pittura emiliana: contro l'arbitrio manierista, l'Accademia degli Incamminati recupera un'illuminazione coerente, verificabile sul modello dal vero, che struttura lo spazio per piani successivi. Guido Reni ne deriva una soluzione personale, in cui la sorgente luminosa non è più naturalistica ma normativa: la luce seleziona ciò che deve essere visto e sottrae il resto, costruendo una gerarchia narrativa. È una scelta che si distingue tanto dal tenebrismo caravaggesco — dove l'ombra è dramma — quanto dal luminismo veneto, dove la luce è atmosfera. Nel confronto diretto fra le opere in sala, l'elemento discriminante è la nitidezza del contorno nelle zone illuminate: reniana quando resta disegnativa, caravaggesca quando si dissolve.",
    },
  ],
};

const quiz = [
  {
    text: "Nel Seicento bolognese, a cosa serve principalmente la luce in un dipinto?",
    options: [
      "Solo a rendere visibili le figure",
      "A guidare lo sguardo sul momento decisivo della scena",
      "A indicare l'ora del giorno",
      "A riempire gli spazi vuoti",
    ],
    correctIndex: 1,
  },
  {
    text: "Chi ha dipinto la Strage degli Innocenti conservata in Pinacoteca?",
    options: ["Giotto", "Raffaello", "Guido Reni", "Perugino"],
    correctIndex: 2,
  },
  {
    text: "Che cosa distingue la luce di Guido Reni da quella di Caravaggio?",
    options: [
      "Reni mantiene nitidi i contorni nelle zone illuminate",
      "Reni non usa mai le ombre",
      "Caravaggio dipinge solo di giorno",
      "Non c'è alcuna differenza",
    ],
    correctIndex: 0,
  },
  {
    text: "Il Polittico di Bologna di Giotto è realizzato con quale tecnica?",
    options: ["Olio su tela", "Affresco", "Tempera e oro su tavola", "Acquerello"],
    correctIndex: 2,
  },
];

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connesso\n");

    if (shouldReset) {
      await Session.deleteMany({ teacher: TEACHER.username });
      await Visit.deleteMany({ title: VISIT_TITLE });
      await Item.deleteMany({ title: PRIVATE_TITLE });
      console.log("⚠️  Scenario didattico rimosso\n");
    }

    // ── 1. Docente ────────────────────────────────────────────────
    // Ruolo dedicato: nessun accesso a musei, mappe e opere altrui.
    // Non serve `museumSlugs`: può preparare visite in qualsiasi museo.
    let teacher = await User.findOne({ username: TEACHER.username });
    if (!teacher) {
      teacher = await User.create({
        username: TEACHER.username,
        email: TEACHER.email,
        password: TEACHER.password,
        role: "docente",
      });
      console.log(`✓ Docente creata: ${TEACHER.username} / ${TEACHER.password}`);
    } else if (teacher.role !== "docente") {
      teacher.role = "docente";
      teacher.museumSlugs = [];
      await teacher.save();
      console.log(`✓ Docente aggiornata al ruolo dedicato: ${TEACHER.username}`);
    } else {
      console.log(`ℹ️  Docente già presente: ${TEACHER.username}`);
    }

    // ── 2. Opera privata ──────────────────────────────────────────
    let hidden = await Item.findOne({ title: PRIVATE_TITLE, museumId: MUSEUM });
    if (!hidden) {
      hidden = await Item.create(privateItem);
      console.log("✓ Opera privata creata (non compare nel catalogo pubblico)");
    } else {
      console.log("ℹ️  Opera privata già presente");
    }

    // ── 3. Visita guidata ─────────────────────────────────────────
    const existing = await Visit.findOne({ title: VISIT_TITLE, museumId: MUSEUM });
    if (existing) {
      console.log("ℹ️  Visita guidata già presente");
    } else {
      // Tre opere pubbliche del museo più la scheda privata del docente
      const publicItems = await Item.find({
        museumId: MUSEUM,
        visibility: { $ne: "privata" },
      }).limit(3);

      if (publicItems.length === 0) {
        console.log("✗ Nessuna opera pubblica: esegui prima `npm run seed`");
        return;
      }

      await Visit.create({
        title: VISIT_TITLE,
        description:
          "Percorso preparato per la classe: tre capolavori della Pinacoteca più una scheda di confronto sulla luce, seguito da un quiz di verifica.",
        museumId: MUSEUM,
        createdBy: TEACHER.username,
        mode: "guidata",
        // Privata: è materiale di classe, non un percorso del museo
        visibility: "privata",
        items: [...publicItems.map((i) => i._id), hidden._id],
        quiz,
      });
      console.log(`✓ Visita guidata creata: ${publicItems.length + 1} tappe, ${quiz.length} domande`);
    }

    console.log("\n──────────────────────────────");
    console.log(" Accedi al Navigator come docente:");
    console.log(`   utente:   ${TEACHER.username}`);
    console.log(`   password: ${TEACHER.password}`);
    console.log("──────────────────────────────\n");
  } catch (err) {
    console.error("✗ Errore durante il seed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

main();
