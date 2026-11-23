import { CHAPTERS, GENERATORS, UPGRADES } from "../www/js/data.js";
import { advance, buyGenerator, buyUpgrade, freshState, genCost, gain, isUpgradeRequirementMet, tap, tapPower, unlockAchievements, chapterNo, genIncome, cps } from "../www/js/economy.js";

const HOURS = Number(process.argv[2] ?? 6);
const TAPS_PER_SEC = Number(process.argv[3] ?? 1);
const DT = 1;

const state = freshState();
const reached = {};
let tapBudget = 0;

function bestGenerator() {
  let best = null;
  for (const g of GENERATORS) {
    if (chapterNo(state) < g.chapter) continue;
    const owned = state.gens[g.id];
    const payback = genCost(g, owned, 1) / g.baseProd;
    if (!best || payback < best.payback) best = { g, payback };
  }
  return best?.g ?? null;
}

for (let t = 0; t < HOURS * 3600; t += DT) {
  tapBudget += TAPS_PER_SEC * DT;
  while (tapBudget >= 1) {
    tap(state);
    tapBudget -= 1;
  }
  advance(state, DT);

  for (const u of UPGRADES) {
    if (!state.upgrades[u.id] && isUpgradeRequirementMet(state, u) && state.coins >= u.cost) {
      buyUpgrade(state, u);
    }
  }
  let bought = true;
  while (bought) {
    bought = false;
    const g = bestGenerator();
    if (g && buyGenerator(state, g, 1)) bought = true;
  }
  unlockAchievements(state);

  for (let i = 0; i < CHAPTERS.length; i++) {
    if (!reached[i] && state.totalEarned >= CHAPTERS[i].at) reached[i] = t;
  }

}

const fmtTime = (s) => (s < 3600 ? `${Math.round(s / 60)} dk` : `${(s / 3600).toFixed(2)} sa`);
console.log(`--- ${HOURS} saat, ${TAPS_PER_SEC} tık/sn ---`);
CHAPTERS.forEach((c, i) => {
  console.log(`Bölüm ${i + 1} (${c.name}) açılış: ${reached[i] === undefined ? "açılmadı" : fmtTime(reached[i])}`);
});
console.log(`Son durum: toplam ${state.totalEarned.toExponential(2)} altın, ${cps(state).toExponential(2)}/sn, tık gücü ${tapPower(state)}`);
console.log("Üreteçler:", GENERATORS.map((g) => `${g.id}=${state.gens[g.id]}`).join(" "));
console.log("Geliştirmeler:", Object.keys(state.upgrades).join(", ") || "-");
