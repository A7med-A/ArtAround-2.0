// ═══════════════════════════════════════════════════════════════
// TAG INPUT — editor di tag con chip rimovibili.
//
// Uso:
//   const tags = mountTagInput(container, { value: ["a", "b"], onChange: (arr) => ... });
//   tags.value      // array corrente
//   tags.setValue([...])
// ═══════════════════════════════════════════════════════════════

import { iconHTML } from "./icon.js";
import { escapeHtml } from "../utils/dom.js";

export function mountTagInput(target, { label = "Tag", value = [], onChange } = {}) {
  let tags = Array.isArray(value) ? [...value] : [];
  target.classList.add("aa-tag-input");

  const render = () => {
    target.innerHTML = `
      ${label ? `<label class="aa-field__label">${escapeHtml(label)}</label>` : ""}
      <div class="aa-tag-input__box">
        ${tags.map((t, i) => `
          <span class="aa-tag-input__chip">
            <span>${escapeHtml(t)}</span>
            <button type="button" class="aa-tag-input__chip-x" data-remove="${i}" tabindex="-1">
              ${iconHTML("close", { size: 10 })}
            </button>
          </span>
        `).join("")}
        <input type="text" class="aa-tag-input__field" placeholder="${tags.length === 0 ? 'Aggiungi tag e premi Invio…' : ''}" />
      </div>
      <div class="aa-tag-input__hint">Premi Invio per aggiungere · Backspace per rimuovere l'ultimo</div>
    `;

    const input = target.querySelector("input");
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const v = input.value.trim().toLowerCase();
        if (v && !tags.includes(v)) {
          tags.push(v);
          onChange?.(tags);
          render();
          target.querySelector("input").focus();
        } else {
          input.value = "";
        }
      } else if (e.key === "Backspace" && !input.value && tags.length > 0) {
        tags.pop();
        onChange?.(tags);
        render();
        target.querySelector("input").focus();
      }
    });
  };

  target.addEventListener("click", (e) => {
    const rm = e.target.closest("[data-remove]");
    if (rm) {
      const idx = parseInt(rm.dataset.remove, 10);
      tags.splice(idx, 1);
      onChange?.(tags);
      render();
    } else if (e.target.classList.contains("aa-tag-input__box")) {
      target.querySelector("input")?.focus();
    }
  });

  render();

  return {
    get value() { return tags; },
    setValue(arr) {
      tags = Array.isArray(arr) ? [...arr] : [];
      render();
    },
  };
}
