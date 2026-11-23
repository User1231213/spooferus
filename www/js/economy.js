import { ACHIEVEMENTS, CHAPTERS, COST_GROWTH, GENERATORS, UPGRADES } from "./data.js";

const ACHIEVEMENT_BONUS = 0.01;
const MAX_BULK = 9999;

export function freshState() {
  return {
    coins: 0,
    totalEarned: 0,
    taps: 0,
    gens: Object.fromEntries(GENERATORS.map((g) => [g.id, 0])),
    upgrades: {},
    achievements: {},
    sound: true,
    savedAt: Date.now(),
  };
}

function nonNegative(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function normalize(raw) {
  const state = freshState();
  if (!raw || typeof raw !== "object") return state;
  state.coins = nonNegative(raw.coins);
  state.totalEarned = nonNegative(raw.totalEarned);
  state.taps = Math.floor(nonNegative(raw.taps));
  for (const g of GENERATORS) state.gens[g.id] = Math.floor(nonNegative(raw.gens?.[g.id]));
  for (const u of UPGRADES) if (raw.upgrades?.[u.id]) state.upgrades[u.id] = true;
  for (const a of ACHIEVEMENTS) if (raw.achievements?.[a.id]) state.achievements[a.id] = true;
  state.sound = raw.sound !== false;
  state.savedAt = nonNegative(raw.savedAt) || Date.now();
  return state;
}

export function chapterIndex(totalEarned) {
  let index = 0;
  CHAPTERS.forEach((c, i) => {
    if (totalEarned >= c.at) index = i;
  });
  return index;
}

export function chapterNo(state) {
  return chapterIndex(state.totalEarned) + 1;
}

function achievementMultiplier(state) {
  return 1 + ACHIEVEMENT_BONUS * Object.keys(state.achievements).length;
}

function multiplierFor(state, scope) {
  let m = 1;
  for (const u of UPGRADES) {
    if (state.upgrades[u.id] && (u.scope === scope || u.scope === "all")) m *= u.mult;
  }
  return m * achievementMultiplier(state);
}

export function tapPower(state) {
  return multiplierFor(state, "tap");
}

export function genIncome(state, g) {
  return state.gens[g.id] * g.baseProd * multiplierFor(state, g.id);
}

export function cps(state) {
  return GENERATORS.reduce((sum, g) => sum + genIncome(state, g), 0);
}

export function genCost(g, owned, count) {
  if (count <= 0) return 0;
  const growth = Math.pow(COST_GROWTH, owned);
  return (g.baseCost * growth * (Math.pow(COST_GROWTH, count) - 1)) / (COST_GROWTH - 1);
}

export function maxBuyable(g, owned, coins) {
  const unit = g.baseCost * Math.pow(COST_GROWTH, owned);
  const n = Math.floor(Math.log(1 + (coins * (COST_GROWTH - 1)) / unit) / Math.log(COST_GROWTH));
  return Math.min(Math.max(0, n), MAX_BULK);
}

export function buyGenerator(state, g, request) {
  const owned = state.gens[g.id];
  let count = request === "max" ? Math.max(1, maxBuyable(g, owned, state.coins)) : request;
  while (count > 0 && genCost(g, owned, count) > state.coins) count -= 1;
  if (count <= 0) return 0;
  state.coins -= genCost(g, owned, count);
  state.gens[g.id] += count;
  return count;
}

export function isUpgradeRequirementMet(state, u) {
  const r = u.req;
  if (r.taps !== undefined) return state.taps >= r.taps;
  if (r.chapter !== undefined) return chapterNo(state) >= r.chapter;
  if (r.gen) return state.gens[r.gen[0]] >= r.gen[1];
  return true;
}

export function buyUpgrade(state, u) {
  if (state.upgrades[u.id] || !isUpgradeRequirementMet(state, u) || state.coins < u.cost) return false;
  state.coins -= u.cost;
  state.upgrades[u.id] = true;
  return true;
}

export function gain(state, amount) {
  state.coins += amount;
  state.totalEarned += amount;
}

export function tap(state) {
  const value = tapPower(state);
  gain(state, value);
  state.taps += 1;
  return value;
}

export function advance(state, seconds) {
  const earned = cps(state) * seconds;
  if (earned > 0) gain(state, earned);
  return earned;
}

export function stats(state) {
  const ownedGens = Object.values(state.gens).reduce((a, b) => a + b, 0);
  return {
    taps: state.taps,
    totalEarned: state.totalEarned,
    chapter: chapterNo(state),
    ownedGens,
    uniqueGens: GENERATORS.filter((g) => state.gens[g.id] > 0).length,
    upgrades: Object.keys(state.upgrades).length,
  };
}

export function unlockAchievements(state) {
  const s = stats(state);
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (!state.achievements[a.id] && a.check(s)) {
      state.achievements[a.id] = true;
      fresh.push(a);
    }
  }
  return fresh;
}
