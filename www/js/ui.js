import { ACHIEVEMENTS, CHAPTERS, GENERATORS, UPGRADES } from "./data.js";
import { chapterIndex, cps, genCost, genIncome, isUpgradeRequirementMet, maxBuyable, tapPower } from "./economy.js";

const SPRITES = "assets/sprites.svg";
const MAX_PARTICLES = 80;
const MAX_TOASTS = 4;
const SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

const $ = (id) => document.getElementById(id);

export function icon(id, cls = "") {
  return `<svg class="ico ${cls}" aria-hidden="true"><use href="${SPRITES}#${id}"></use></svg>`;
}

export function fmt(n) {
  if (!Number.isFinite(n)) return "∞";
  if (n < 1000) return n < 10 ? n.toFixed(1).replace(/\.0$/, "") : String(Math.floor(n));
  const tier = Math.min(Math.floor(Math.log10(n) / 3), SUFFIXES.length - 1);
  const scaled = n / 1000 ** tier;
  const digits = scaled < 10 ? 2 : scaled < 100 ? 1 : 0;
  const text = digits ? scaled.toFixed(digits).replace(/\.?0+$/, "") : String(Math.floor(scaled));
  return text + SUFFIXES[tier];
}

const els = {
  scene: $("scene"),
  coins: $("coins"),
  cps: $("cps"),
  tapPower: $("tap-power"),
  chapterNo: $("chapter-no"),
  chapterName: $("chapter-name"),
  chapterFill: $("chapter-fill"),
  chapterNext: $("chapter-next"),
  tap: $("tap"),
  fx: $("fx"),
  soundBtn: $("btn-sound"),
  settingsBtn: $("btn-settings"),
  tabs: [...document.querySelectorAll(".tab")],
  panels: {
    gens: $("tab-gens"),
    upg: $("tab-upg"),
    ach: $("tab-ach"),
    chap: $("tab-chap"),
  },
  buyModes: $("buy-modes"),
  genList: $("gen-list"),
  upgGrid: $("upg-grid"),
  achGrid: $("ach-grid"),
  achBonus: $("ach-bonus"),
  chapList: $("chap-list"),
  toasts: $("toasts"),
  modal: $("modal"),
  modalTitle: $("modal-title"),
  modalBody: $("modal-body"),
  modalActions: $("modal-actions"),
};

const rows = {
  gens: new Map(),
  upgrades: new Map(),
  achievements: new Map(),
  chapters: [],
};

let buyMode = 1;

function buildGenerators() {
  els.genList.innerHTML = GENERATORS.map((g) => `
    <li class="card gen" data-id="${g.id}">
      <div class="card-icon">${icon(g.icon)}</div>
      <div class="card-body">
        <div class="card-title">${g.name} <span class="count">0</span></div>
        <div class="card-desc">${g.desc}</div>
        <div class="card-meta">+<span class="prod">0</span> altın/sn</div>
        <div class="lock-note">${icon("i-lock")}<span>${CHAPTERS[g.chapter - 1].name} bölümünde açılır</span></div>
      </div>
      <button class="buy" type="button">
        <span class="buy-cost">0</span>
        <span class="buy-qty">×1</span>
      </button>
    </li>`).join("");

  for (const li of els.genList.children) {
    const g = GENERATORS.find((x) => x.id === li.dataset.id);
    rows.gens.set(g.id, {
      g,
      li,
      count: li.querySelector(".count"),
      prod: li.querySelector(".prod"),
      btn: li.querySelector(".buy"),
      cost: li.querySelector(".buy-cost"),
      qty: li.querySelector(".buy-qty"),
    });
  }
}

function buildUpgrades() {
  els.upgGrid.innerHTML = UPGRADES.map((u) => `
    <div class="card upg" data-id="${u.id}">
      <div class="card-icon">${icon(u.icon)}</div>
      <div class="card-body">
        <div class="card-title">${u.name}</div>
        <div class="card-desc">${u.desc}</div>
        <div class="card-meta req">Gereksinim: ${u.reqText}</div>
      </div>
      <button class="buy" type="button">
        <span class="buy-cost">${fmt(u.cost)}</span>
        <span class="buy-done">${icon("i-check")}Alındı</span>
      </button>
    </div>`).join("");

  for (const card of els.upgGrid.children) {
    const u = UPGRADES.find((x) => x.id === card.dataset.id);
    rows.upgrades.set(u.id, { u, card, btn: card.querySelector(".buy") });
  }
}

function buildAchievements() {
  els.achGrid.innerHTML = ACHIEVEMENTS.map((a) => `
    <div class="ach" data-id="${a.id}">
      <div class="ach-icon">${icon("i-trophy")}</div>
      <div class="ach-name">${a.name}</div>
      <div class="ach-desc">${a.desc}</div>
    </div>`).join("");

  for (const node of els.achGrid.children) {
    rows.achievements.set(node.dataset.id, node);
  }
}

function buildChapters() {
  els.chapList.innerHTML = CHAPTERS.map((c, i) => `
    <li class="chapter" data-index="${i}">
      <img class="chapter-thumb" src="${c.scene}" alt="" />
      <div class="chapter-body">
        <div class="chapter-title"><span class="chapter-no">${i + 1}. Bölüm</span>${c.name}</div>
        <div class="chapter-desc">${c.desc}</div>
        <div class="chapter-status"></div>
      </div>
    </li>`).join("");

  rows.chapters = [...els.chapList.children].map((li) => ({
    li,
    status: li.querySelector(".chapter-status"),
  }));
}

function selectTab(name) {
  for (const tab of els.tabs) {
    const active = tab.dataset.tab === name;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  }
  for (const [key, panel] of Object.entries(els.panels)) {
    panel.classList.toggle("active", key === name);
  }
  els.buyModes.hidden = name !== "gens";
}

function renderHud(state) {
  const idx = chapterIndex(state.totalEarned);
  els.coins.textContent = fmt(state.coins);
  els.cps.textContent = fmt(cps(state));
  els.tapPower.textContent = fmt(tapPower(state));
  els.chapterNo.textContent = String(idx + 1);
  els.chapterName.textContent = CHAPTERS[idx].name;

  const next = CHAPTERS[idx + 1];
  if (next) {
    const from = CHAPTERS[idx].at;
    const pct = Math.min(1, Math.max(0, (state.totalEarned - from) / (next.at - from)));
    els.chapterFill.style.width = `${(pct * 100).toFixed(1)}%`;
    els.chapterNext.textContent = `Sonraki bölüm: ${next.name} · ${fmt(next.at)} toplam altın`;
  } else {
    els.chapterFill.style.width = "100%";
    els.chapterNext.textContent = "Son bölüme ulaştın";
  }

  const scene = CHAPTERS[idx].scene;
  if (els.scene.getAttribute("src") !== scene) els.scene.setAttribute("src", scene);
}

function renderGenerators(state) {
  const chapter = chapterIndex(state.totalEarned) + 1;
  for (const row of rows.gens.values()) {
    const { g, li } = row;
    const unlocked = chapter >= g.chapter;
    li.classList.toggle("locked", !unlocked);
    if (!unlocked) continue;

    const owned = state.gens[g.id];
    const qty = buyMode === "max" ? Math.max(1, maxBuyable(g, owned, state.coins)) : buyMode;
    const price = genCost(g, owned, qty);
    row.count.textContent = fmt(owned);
    row.prod.textContent = fmt(genIncome(state, g));
    row.cost.textContent = fmt(price);
    row.qty.textContent = buyMode === "max" ? `Maks ×${qty}` : `×${qty}`;
    row.btn.disabled = state.coins < price;
  }
}

function renderUpgrades(state) {
  for (const row of rows.upgrades.values()) {
    const owned = Boolean(state.upgrades[row.u.id]);
    const reqMet = isUpgradeRequirementMet(state, row.u);
    row.card.classList.toggle("owned", owned);
    row.card.classList.toggle("locked", !owned && !reqMet);
    row.btn.disabled = owned || !reqMet || state.coins < row.u.cost;
  }
}

function renderAchievements(state) {
  for (const [id, node] of rows.achievements) {
    node.classList.toggle("done", Boolean(state.achievements[id]));
  }
  const count = Object.keys(state.achievements).length;
  els.achBonus.textContent = `${count}/${ACHIEVEMENTS.length} açıldı · +${count}% üretim bonusu`;
}

function renderChapters(state) {
  const current = chapterIndex(state.totalEarned);
  rows.chapters.forEach(({ li, status }, i) => {
    li.classList.toggle("done", i < current);
    li.classList.toggle("current", i === current);
    li.classList.toggle("locked", i > current);
    if (i < current) status.textContent = "Tamamlandı";
    else if (i === current) status.textContent = `Şu an buradasın · ${fmt(state.totalEarned)} toplam altın`;
    else status.textContent = `Açılması için ${fmt(CHAPTERS[i].at)} toplam altın gerekli`;
  });
}

export function render(state) {
  renderHud(state);
  renderGenerators(state);
  renderUpgrades(state);
  renderAchievements(state);
  renderChapters(state);
}

function centerOf(node) {
  const r = node.getBoundingClientRect();
  return { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
}

export function floatNumber(point, text) {
  if (els.fx.childElementCount > MAX_PARTICLES) return;
  const rect = els.fx.getBoundingClientRect();
  const node = document.createElement("span");
  node.className = "float";
  node.textContent = text;
  node.style.left = `${point.clientX - rect.left}px`;
  node.style.top = `${point.clientY - rect.top}px`;
  els.fx.append(node);
  node.addEventListener("animationend", () => node.remove(), { once: true });
}

export function burstCoins(point, count = 4) {
  const rect = els.fx.getBoundingClientRect();
  const x = point.clientX - rect.left;
  const y = point.clientY - rect.top;
  for (let i = 0; i < count; i++) {
    if (els.fx.childElementCount > MAX_PARTICLES) break;
    const node = document.createElement("span");
    node.className = "particle";
    node.innerHTML = icon("i-coin");
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.style.setProperty("--dx", `${(Math.random() - 0.5) * 160}px`);
    node.style.setProperty("--dy", `${-90 - Math.random() * 90}px`);
    node.addEventListener("animationend", () => node.remove(), { once: true });
    els.fx.append(node);
  }
}

export function toast(title, text, kind = "achievement") {
  while (els.toasts.childElementCount >= MAX_TOASTS) els.toasts.firstElementChild.remove();
  const node = document.createElement("div");
  node.className = `toast ${kind}`;
  node.innerHTML = `${icon(kind === "chapter" ? "i-flag" : "i-trophy", "toast-icon")}<div><b></b><span></span></div>`;
  node.querySelector("b").textContent = title;
  node.querySelector("span").textContent = text;
  els.toasts.append(node);
  setTimeout(() => node.remove(), 3200);
}

export function openModal({ title, body, actions = [] }) {
  els.modalTitle.textContent = title;
  els.modalBody.textContent = body;
  els.modalActions.replaceChildren(
    ...actions.map((a) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `btn ${a.tone ?? ""}`.trim();
      button.textContent = a.label;
      button.addEventListener("click", () => {
        closeModal();
        a.onClick?.();
      });
      return button;
    }),
  );
  els.modal.hidden = false;
}

export function closeModal() {
  els.modal.hidden = true;
}

export function setSoundIcon(on) {
  els.soundBtn.innerHTML = icon(on ? "i-sound-on" : "i-sound-off");
  els.soundBtn.setAttribute("aria-label", on ? "Sesi kapat" : "Sesi aç");
}

export function init(handlers) {
  buildGenerators();
  buildUpgrades();
  buildAchievements();
  buildChapters();

  els.settingsBtn.innerHTML = icon("i-gear");
  els.soundBtn.addEventListener("click", handlers.onToggleSound);
  els.settingsBtn.addEventListener("click", handlers.onSettings);

  for (const tab of els.tabs) {
    tab.addEventListener("click", () => selectTab(tab.dataset.tab));
  }

  els.buyModes.addEventListener("click", (e) => {
    const button = e.target.closest("[data-mode]");
    if (!button) return;
    buyMode = button.dataset.mode === "max" ? "max" : Number(button.dataset.mode);
    for (const b of els.buyModes.querySelectorAll("[data-mode]")) {
      b.classList.toggle("active", b === button);
    }
  });

  els.genList.addEventListener("click", (e) => {
    const button = e.target.closest(".buy");
    if (!button) return;
    handlers.onBuyGenerator(button.closest("li").dataset.id, buyMode);
  });

  els.upgGrid.addEventListener("click", (e) => {
    const button = e.target.closest(".buy");
    if (!button) return;
    handlers.onBuyUpgrade(button.closest(".upg").dataset.id);
  });

  els.tap.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    handlers.onTap(e);
  });
  els.tap.addEventListener("click", (e) => {
    if (e.detail === 0) handlers.onTap(centerOf(els.tap));
  });

  els.modal.addEventListener("click", (e) => {
    if (e.target === els.modal) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  selectTab("gens");
}
