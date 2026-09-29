// ═══════════════════════════════════════════════════════════════
// USERS VIEW — Gestione account e accessi (admin only)
//
// Mostra tutti gli utenti, permette all'admin di:
//   - concedere accesso ad uno o più musei a un autore
//   - revocare l'accesso
//   - eliminare un autore (non se stesso)
// ═══════════════════════════════════════════════════════════════

import { store } from "../core/store.js";
import { auth } from "../core/auth.js";
import { usersService } from "../services/users.service.js";
import { toast } from "../ui/toast.js";
import { escapeHtml } from "../utils/dom.js";
import { iconHTML } from "../ui/icon.js";
import { openModal } from "../ui/modal.js";
import { openConfirm } from "../ui/confirm-modal.js";

let _users = [];
let _filter = "";

export async function render() {
  const outlet = document.getElementById("app-outlet");

  // Auth guard lato client (il backend è la fonte di verità)
  if (!auth.isAdmin()) {
    outlet.innerHTML = renderForbidden();
    return;
  }

  outlet.innerHTML = `
    <div class="aa-uv-page">
      <header class="aa-uv-head">
        <div>
          <h1 class="aa-uv-title">Gestione utenti</h1>
          <p class="aa-uv-sub" id="uv-stats">Caricamento…</p>
        </div>
        <div class="aa-search" style="flex:0 0 auto;max-width:320px;width:100%;">
          <span class="aa-search__icon">${iconHTML("search", { size: 14 })}</span>
          <input type="text" id="uv-search" placeholder="Cerca per username, email…" />
        </div>
      </header>
      <div class="aa-uv-list" id="uv-list">
        <div style="display:flex;justify-content:center;padding:60px;"><div class="aa-spinner"></div></div>
      </div>
    </div>

    <style>
      .aa-uv-page { display:flex; flex-direction:column; height:100%; }
      .aa-uv-head {
        padding:24px 28px 20px; border-bottom:1px solid var(--t-border);
        display:flex; align-items:flex-end; justify-content:space-between; gap:16px; flex-wrap:wrap;
      }
      .aa-uv-title { font-family:var(--t-font-display); font-size:28px; font-weight:600; color:var(--t-text); letter-spacing:-0.01em; }
      .aa-uv-sub { font-size:13px; color:var(--t-textSec); margin-top:4px; }
      .aa-uv-list { flex:1; overflow-y:auto; padding:20px 28px; display:flex; flex-direction:column; gap:10px; }

      .aa-user-row {
        background:var(--t-surface);
        border:1px solid var(--t-border);
        border-radius:10px;
        padding:16px 18px;
        display:flex; align-items:flex-start; gap:14px;
        transition:all var(--t-transition);
      }
      .aa-user-row:hover { border-color:var(--t-borderHi); }
      .aa-user-row__body { flex:1; min-width:0; display:flex; flex-direction:column; gap:8px; }
      .aa-user-row__head { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
      .aa-user-row__name {
        font-family:var(--t-font-display); font-size:16px; font-weight:600; color:var(--t-text);
      }
      .aa-user-row__email { font-size:12px; color:var(--t-textMuted); }
      .aa-user-row__access {
        display:flex; gap:6px; flex-wrap:wrap; align-items:center;
        font-size:12px; color:var(--t-textSec);
      }
      .aa-access-chip {
        display:inline-flex; align-items:center; gap:6px;
        background:var(--t-goldBg); border:1px solid var(--t-goldDim);
        color:var(--t-gold); padding:2px 4px 2px 10px; border-radius:14px;
        font-size:12px; font-weight:500;
      }
      .aa-access-chip__x {
        background:none; border:none; cursor:pointer; color:currentColor;
        padding:3px; display:flex; border-radius:50%;
      }
      .aa-access-chip__x:hover { background:rgba(0,0,0,0.1); }
      .aa-user-row__nope {
        font-size:12px; color:var(--t-textMuted); font-style:italic;
      }
      .aa-user-row__actions { display:flex; gap:6px; flex-shrink:0; }

      @media (max-width: 768px) {
        .aa-uv-head { padding:16px 14px; flex-direction:column; align-items:stretch; }
        .aa-uv-list { padding:14px; }
        .aa-user-row { flex-direction:column; }
        .aa-user-row__actions { align-self:flex-end; }
      }
    </style>
  `;

  document.getElementById("uv-search").addEventListener("input", (e) => {
    _filter = e.target.value || "";
    renderList();
  });

  document.getElementById("uv-list").addEventListener("click", (e) => {
    const row = e.target.closest(".aa-user-row");
    if (!row) return;
    const userId = row.dataset.id;
    const u = _users.find((x) => x._id === userId);
    if (!u) return;
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action === "grant") return openGrantModal(u);
    if (action === "delete") return openDeleteUser(u);
    const revoke = e.target.closest("[data-revoke-slug]");
    if (revoke) return revokeAccess(u, revoke.dataset.revokeSlug);
  });

  await loadUsers();
}

async function loadUsers() {
  try {
    _users = (await usersService.list()) || [];
  } catch (err) {
    console.error(err);
    toast(err.message || "Impossibile caricare gli utenti", "danger");
    _users = [];
  }
  renderList();
}

function applyFilter() {
  if (!_filter) return _users;
  const s = _filter.toLowerCase();
  return _users.filter((u) => {
    return (u.username || "").toLowerCase().includes(s) ||
           (u.email || "").toLowerCase().includes(s);
  });
}

function renderList() {
  const list = document.getElementById("uv-list");
  const stats = document.getElementById("uv-stats");
  if (!list || !stats) return;

  const admins = _users.filter((u) => u.role === "admin").length;
  const authors = _users.filter((u) => u.role === "author").length;
  stats.textContent = `${_users.length} account · ${admins} admin · ${authors} autor${authors === 1 ? "e" : "i"}`;

  const filtered = applyFilter();
  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="aa-empty">
        <div class="aa-empty__icon">${iconHTML("users", { size: 22 })}</div>
        <div class="aa-empty__title">${_users.length === 0 ? "Nessun account" : "Nessun risultato"}</div>
        <div class="aa-empty__msg">${_users.length === 0 ? "Quando qualcuno si registra apparirà qui." : "Prova a modificare la ricerca."}</div>
      </div>
    `;
    return;
  }
  list.innerHTML = filtered.map(userRowHTML).join("");
}

function userRowHTML(u) {
  const initial = (u.username || "?")[0].toUpperCase();
  const isMe = auth.currentUser()?._id === u._id;
  const slugs = u.museumSlugs || [];
  const museumsMap = new Map(store.museums.get().map((m) => [m.slug, m]));

  return `
    <div class="aa-user-row" data-id="${escapeHtml(u._id)}">
      <div class="aa-avatar">${initial}</div>
      <div class="aa-user-row__body">
        <div class="aa-user-row__head">
          <span class="aa-user-row__name">${escapeHtml(u.username)}</span>
          ${u.role === "admin"
            ? `<span class="aa-badge aa-badge--gold">Admin</span>`
            : `<span class="aa-badge">Autore</span>`}
          ${isMe ? `<span class="aa-badge aa-badge--success">Tu</span>` : ""}
        </div>
        <div class="aa-user-row__email">${escapeHtml(u.email || "—")}</div>

        ${u.role === "admin" ? `
          <div class="aa-user-row__access">
            ${iconHTML("shield", { size: 12 })}
            <span>Accesso completo a tutti i musei</span>
          </div>
        ` : `
          <div class="aa-user-row__access">
            <span>Musei assegnati:</span>
            ${slugs.length === 0
              ? `<span class="aa-user-row__nope">nessuno</span>`
              : slugs.map((slug) => {
                  const m = museumsMap.get(slug);
                  const name = m ? m.name : slug;
                  return `
                    <span class="aa-access-chip">
                      ${escapeHtml(name)}
                      <button type="button" class="aa-access-chip__x" data-revoke-slug="${escapeHtml(slug)}" title="Revoca accesso">
                        ${iconHTML("close", { size: 10 })}
                      </button>
                    </span>
                  `;
                }).join("")}
          </div>
        `}
      </div>

      <div class="aa-user-row__actions">
        ${u.role === "author" ? `
          <button type="button" class="aa-btn aa-btn--small" data-action="grant">
            ${iconHTML("plus", { size: 13 })}
            <span>Concedi accesso</span>
          </button>
        ` : ""}
        ${!isMe ? `
          <button type="button" class="aa-icon-btn aa-icon-btn--danger" data-action="delete" title="Elimina account">
            ${iconHTML("trash", { size: 14 })}
          </button>
        ` : ""}
      </div>
    </div>
  `;
}

// ─── Azioni ──────────────────────────────────────────────────────

async function revokeAccess(user, slug) {
  const museum = store.museums.get().find((m) => m.slug === slug);
  const name = museum?.name || slug;
  openConfirm({
    title: "Revoca accesso",
    message: `Revocare l'accesso a <strong>${escapeHtml(name)}</strong> per <strong>${escapeHtml(user.username)}</strong>?`,
    confirmLabel: "Revoca",
    danger: true,
    onConfirm: async () => {
      try {
        const updated = await usersService.revoke(user._id, slug);
        _users = _users.map((u) => u._id === updated._id ? updated : u);
        toast(`Accesso a "${name}" revocato`, "success");
        renderList();
      } catch (err) {
        toast(err.message || "Errore nella revoca", "danger");
      }
    },
  });
}

function openGrantModal(user) {
  const allMuseums = store.museums.get();
  const already = new Set(user.museumSlugs || []);
  const available = allMuseums.filter((m) => !already.has(m.slug));

  const m = openModal({
    title: `Concedi accesso a ${user.username}`,
    width: 460,
    bodyHTML: `
      ${available.length === 0 ? `
        <div class="aa-empty">
          <div class="aa-empty__title">Tutti i musei già assegnati</div>
          <div class="aa-empty__msg">${escapeHtml(user.username)} ha già accesso a tutti i musei esistenti.</div>
        </div>
      ` : `
        <p style="font-size:13px;color:var(--t-textSec);line-height:1.5;margin:0 0 16px;">
          Seleziona uno o più musei a cui dare accesso. L'utente potrà modificare item, visite e mappa di quei musei.
        </p>
        <div class="aa-grant-list" style="display:flex;flex-direction:column;gap:6px;max-height:340px;overflow:auto;">
          ${available.map((mu) => `
            <label class="aa-grant-row" data-slug="${escapeHtml(mu.slug)}" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--t-border);border-radius:6px;cursor:pointer;background:var(--t-surfaceEl);">
              <input type="checkbox" value="${escapeHtml(mu.slug)}" style="cursor:pointer;" />
              <div style="flex:1;min-width:0;">
                <div style="font-family:var(--t-font-display);font-size:14px;font-weight:600;color:var(--t-text);">${escapeHtml(mu.name)}</div>
                <div style="font-size:11px;color:var(--t-textMuted);font-family:var(--t-font-mono);">${escapeHtml(mu.slug)}</div>
              </div>
            </label>
          `).join("")}
        </div>
      `}
      <div class="aa-modal-footer">
        <button type="button" class="aa-btn" data-action="cancel">Annulla</button>
        ${available.length > 0 ? `
          <button type="button" class="aa-btn aa-btn--primary" data-action="grant">
            ${iconHTML("plus", { size: 13 })}
            <span>Concedi accesso</span>
          </button>
        ` : ""}
      </div>
    `,
  });

  m.body.querySelector("[data-action='cancel']").addEventListener("click", () => m.close());
  const grantBtn = m.body.querySelector("[data-action='grant']");
  if (grantBtn) {
    grantBtn.addEventListener("click", async () => {
      const selected = Array.from(m.body.querySelectorAll("input[type=checkbox]:checked")).map((x) => x.value);
      if (selected.length === 0) return toast("Seleziona almeno un museo", "danger");
      try {
        let updated = user;
        for (const slug of selected) {
          updated = await usersService.grant(user._id, slug);
        }
        _users = _users.map((u) => u._id === updated._id ? updated : u);
        toast(`Accesso concesso a ${selected.length} museo/i`, "success");
        m.close();
        renderList();
      } catch (err) {
        toast(err.message || "Errore nella concessione", "danger");
      }
    });
  }
}

function openDeleteUser(user) {
  openConfirm({
    title: "Elimina account",
    message: `Eliminare definitivamente l'account <strong>${escapeHtml(user.username)}</strong>? L'azione non è reversibile.`,
    confirmLabel: "Elimina",
    danger: true,
    onConfirm: async () => {
      try {
        await usersService.delete(user._id);
        _users = _users.filter((u) => u._id !== user._id);
        toast("Account eliminato", "success");
        renderList();
      } catch (err) {
        toast(err.message || "Errore nell'eliminazione", "danger");
      }
    },
  });
}

// ─── Errore "non autorizzato" ────────────────────────────────────
function renderForbidden() {
  return `
    <div class="aa-empty" style="padding:60px 20px;">
      <div class="aa-empty__icon" style="color:var(--t-danger);">${iconHTML("shield", { size: 24 })}</div>
      <div class="aa-empty__title">Accesso negato</div>
      <div class="aa-empty__msg">Solo gli amministratori possono gestire gli account.</div>
    </div>
  `;
}
