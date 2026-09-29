// ═══════════════════════════════════════════════════════════════
// HUB SSE — canale di push verso i partecipanti di una sessione.
//
// Server-Sent Events: una normale risposta HTTP tenuta aperta, su cui il
// server scrive gli aggiornamenti. Il traffico inverso (lo studente che
// chiede un testo diverso, il docente che avanza) resta REST.
//
// Il registro delle connessioni è in memoria: vale finché il processo è
// uno solo, come in questo progetto. Con più istanze servirebbe un bus
// condiviso (Redis pub/sub) al posto della Map.
// ═══════════════════════════════════════════════════════════════

/** code sessione → Set di connessioni aperte */
const channels = new Map();

/** Intervallo del commento di keep-alive: molti proxy chiudono a 60 s di silenzio. */
const HEARTBEAT_MS = 25000;

function write(res, event, data) {
  try {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    return true;
  } catch {
    // Connessione già caduta: verrà rimossa dal chiamante.
    return false;
  }
}

/**
 * Registra una risposta HTTP come iscritto al canale della sessione.
 *
 * @param {string} code        codice della sessione
 * @param {object} res         risposta Express, già con gli header SSE
 * @param {object} meta        { participantId, role } per il conteggio online
 * @param {Function} onClose   invocato quando la connessione si chiude
 * @returns {Function} funzione per disiscriversi
 */
function subscribe(code, res, meta, onClose) {
  if (!channels.has(code)) channels.set(code, new Set());
  const client = { res, ...meta };
  channels.get(code).add(client);

  const heartbeat = setInterval(() => {
    try {
      res.write(": keep-alive\n\n");
    } catch {
      clearInterval(heartbeat);
    }
  }, HEARTBEAT_MS);

  const unsubscribe = () => {
    clearInterval(heartbeat);
    const set = channels.get(code);
    if (set) {
      set.delete(client);
      if (set.size === 0) channels.delete(code);
    }
    onClose?.(meta);
  };

  res.on("close", unsubscribe);
  return unsubscribe;
}

/**
 * Invia un evento agli iscritti di una sessione.
 *
 * @param {string|object} target  destinatari: "docente"/"studente" per ruolo,
 *   oppure { role, participantId } per un singolo partecipante. Omesso = tutti.
 *   Il filtro sul partecipante serve ai dati personali — il voto di uno
 *   studente non deve transitare sugli stream dei compagni.
 */
function publish(code, event, data, target = null) {
  const set = channels.get(code);
  if (!set) return 0;

  const filter = typeof target === "string" ? { role: target } : target || {};

  let sent = 0;
  for (const client of [...set]) {
    if (filter.role && client.role !== filter.role) continue;
    if (filter.participantId && String(client.participantId) !== String(filter.participantId)) {
      continue;
    }
    if (write(client.res, event, data)) sent += 1;
    else set.delete(client);
  }
  return sent;
}

/** Identificativi dei partecipanti con una connessione aperta. */
function onlineParticipants(code) {
  const set = channels.get(code);
  if (!set) return [];
  return [...set].map((c) => String(c.participantId));
}

/** Header e preambolo richiesti da una risposta SSE. */
function openStream(res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    // Disattiva il buffering di nginx, che altrimenti tratterrebbe gli eventi
    "X-Accel-Buffering": "no",
  });
  res.write(": connesso\n\n");
  res.flushHeaders?.();
}

module.exports = { subscribe, publish, onlineParticipants, openStream };
