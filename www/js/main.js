import { CHAPTERS, GENERATORS, UPGRADES } from "./data.js";
import { advance, buyGenerator, buyUpgrade, chapterIndex, normalize, tap, unlockAchievements } from "./economy.js";
import { sfx, setSoundEnabled } from "./audio.js";
import * as ui from "./ui.js";

const SAVE_KEY = "spooferus.save.v1";
const OFFLINE_MIN_SECONDS = 60;
const OFFLINE_MAX_SECONDS = 8 * 3600;
const RENDER_INTERVAL = 0.1;
const MAX_FRAME_SECONDS = 0.5;

let state = load();
setSoundEnabled(state.sound);
let chapter = chapterIndex(state.totalEarned);

function load() {
  try {
    return normalize(JSON.parse(localStorage.getItem(SAVE_KEY)));
  } catch {
    return normalize(null);
  }
}

function save() {
  state.savedAt = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // Depolama kullanılamıyorsa oyun bellekte çalışmaya devam eder.
  }
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h} sa ${m} dk` : `${Math.max(1, m)} dk`;
}

function grantOffline(sinceMs) {
  const seconds = Math.min((Date.now() - sinceMs) / 1000, OFFLINE_MAX_SECONDS);
  if (seconds < OFFLINE_MIN_SECONDS) return;
  const earned = advance(state, seconds);
  if (earned <= 0) return;
  ui.openModal({
    title: "Hoş geldin!",
    body: `Uzakta kaldığın ${formatDuration(seconds)} boyunca üreteçlerin ${ui.fmt(earned)} altın kazandırdı.`,
    actions: [{ label: "Harika", tone: "primary" }],
  });
  save();
}

function checkProgress() {
  const fresh = unlockAchievements(state);
  for (const a of fresh) ui.toast(a.name, a.desc, "achievement");
  if (fresh.length > 0) sfx.achievement();

  const idx = chapterIndex(state.totalEarned);
  if (idx !== chapter) {
    chapter = idx;
    ui.toast("Yeni bölüm", CHAPTERS[idx].name, "chapter");
    sfx.chapter();
  }
}

function handleTap(point) {
  const value = tap(state);
  ui.floatNumber(point, `+${ui.fmt(value)}`);
  ui.burstCoins(point);
  sfx.tap();
  navigator.vibrate?.(8);
  checkProgress();
  ui.render(state);
}

function handleBuyGenerator(id, mode) {
  const g = GENERATORS.find((x) => x.id === id);
  if (buyGenerator(state, g, mode) > 0) {
    sfx.buy();
    save();
  }
  checkProgress();
  ui.render(state);
}

function handleBuyUpgrade(id) {
  const u = UPGRADES.find((x) => x.id === id);
  if (buyUpgrade(state, u)) {
    sfx.upgrade();
    save();
  }
  checkProgress();
  ui.render(state);
}

function toggleSound() {
  state.sound = !state.sound;
  setSoundEnabled(state.sound);
  ui.setSoundIcon(state.sound);
  save();
  if (state.sound) sfx.tap();
}

function openSettings() {
  ui.openModal({
    title: "Ayarlar",
    body: "Spooferus · Tıkla, geliştir, imparatorluğunu kur.\nİlerlemen bu tarayıcıda otomatik kaydedilir.",
    actions: [
      { label: "İlerlemeyi sıfırla", tone: "danger", onClick: confirmReset },
      { label: "Kapat" },
    ],
  });
}

function confirmReset() {
  ui.openModal({
    title: "Emin misin?",
    body: "Tüm altınların, üreteçlerin, geliştirmelerin ve başarımların silinecek. Bu işlem geri alınamaz.",
    actions: [
      { label: "Vazgeç" },
      { label: "Evet, sıfırla", tone: "danger", onClick: resetProgress },
    ],
  });
}

function resetProgress() {
  const sound = state.sound;
  state = normalize(null);
  state.sound = sound;
  chapter = 0;
  save();
  ui.render(state);
  ui.toast("Sıfırlandı", "Yeni bir başlangıç yapmaya hazırsın.", "chapter");
}

let last = performance.now();
let renderTimer = 0;

function frame(now) {
  const dt = Math.min((now - last) / 1000, MAX_FRAME_SECONDS);
  last = now;
  advance(state, dt);
  checkProgress();
  renderTimer += dt;
  if (renderTimer >= RENDER_INTERVAL) {
    renderTimer = 0;
    ui.render(state);
  }
  requestAnimationFrame(frame);
}

let hiddenAt = null;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    hiddenAt = Date.now();
    save();
    return;
  }
  if (hiddenAt !== null) {
    grantOffline(hiddenAt);
    hiddenAt = null;
    last = performance.now();
  }
});
window.addEventListener("pagehide", save);
setInterval(save, 3000);

ui.init({
  onTap: handleTap,
  onBuyGenerator: handleBuyGenerator,
  onBuyUpgrade: handleBuyUpgrade,
  onToggleSound: toggleSound,
  onSettings: openSettings,
});
ui.setSoundIcon(state.sound);
grantOffline(state.savedAt);
ui.render(state);
requestAnimationFrame(frame);
