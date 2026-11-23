const SAVE_KEY = "spooferus-save";
const COST_GROWTH = 1.15;

const UPGRADES = {
  click: { baseCost: 15, perOwned: 1 },
  auto: { baseCost: 50, perOwned: 1 },
};

const state = {
  coins: 0,
  owned: { click: 0, auto: 0 },
  lastSaved: Date.now(),
};

const els = {
  coins: document.getElementById("coins"),
  cps: document.getElementById("cps"),
  clicker: document.getElementById("clicker"),
  reset: document.getElementById("reset"),
  upClick: document.getElementById("up-click"),
  upAuto: document.getElementById("up-auto"),
  costClick: document.getElementById("cost-click"),
  costAuto: document.getElementById("cost-auto"),
  ownedClick: document.getElementById("owned-click"),
  ownedAuto: document.getElementById("owned-auto"),
};

function costOf(key) {
  return Math.floor(UPGRADES[key].baseCost * Math.pow(COST_GROWTH, state.owned[key]));
}

function clickPower() {
  return 1 + state.owned.click * UPGRADES.click.perOwned;
}

function autoPower() {
  return state.owned.auto * UPGRADES.auto.perOwned;
}

function format(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e4) return (n / 1e3).toFixed(1) + "K";
  return Math.floor(n).toString();
}

function render() {
  els.coins.textContent = format(state.coins);
  els.cps.textContent = format(autoPower());
  els.costClick.textContent = format(costOf("click"));
  els.costAuto.textContent = format(costOf("auto"));
  els.ownedClick.textContent = state.owned.click;
  els.ownedAuto.textContent = state.owned.auto;
  els.upClick.disabled = state.coins < costOf("click");
  els.upAuto.disabled = state.coins < costOf("auto");
}

function buy(key) {
  const cost = costOf(key);
  if (state.coins < cost) return;
  state.coins -= cost;
  state.owned[key] += 1;
  render();
  save();
}

function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      coins: state.coins,
      owned: state.owned,
      savedAt: Date.now(),
    }));
  } catch {
    // Depolama kapalıysa oyun yine de çalışır, sadece kaydedilmez.
  }
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    state.coins = Number(data.coins) || 0;
    state.owned.click = Number(data.owned?.click) || 0;
    state.owned.auto = Number(data.owned?.auto) || 0;
    const elapsed = Math.max(0, (Date.now() - (data.savedAt || Date.now())) / 1000);
    state.coins += elapsed * autoPower();
  } catch {
    // Bozuk kayıt varsa sıfırdan başlanır.
  }
}

function reset() {
  if (!confirm("Tüm ilerlemen silinsin mi?")) return;
  state.coins = 0;
  state.owned = { click: 0, auto: 0 };
  save();
  render();
}

els.clicker.addEventListener("pointerdown", (event) => {
  state.coins += clickPower();
  render();
  spawnPop(event);
});

els.upClick.addEventListener("click", () => buy("click"));
els.upAuto.addEventListener("click", () => buy("auto"));
els.reset.addEventListener("click", reset);

function spawnPop(event) {
  const pop = document.createElement("span");
  pop.className = "pop";
  pop.textContent = "+" + clickPower();
  pop.style.left = event.clientX + "px";
  pop.style.top = event.clientY + "px";
  document.body.appendChild(pop);
  pop.addEventListener("animationend", () => pop.remove());
}

let last = performance.now();
function tick(now) {
  const dt = (now - last) / 1000;
  last = now;
  if (autoPower() > 0) {
    state.coins += autoPower() * dt;
    render();
  }
  requestAnimationFrame(tick);
}

setInterval(save, 5000);
window.addEventListener("beforeunload", save);

load();
render();
requestAnimationFrame(tick);
