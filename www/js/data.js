export const COST_GROWTH = 1.15;

export const CHAPTERS = [
  { name: "Köy Madeni", desc: "Her servet tek bir kazmayla başlar.", at: 0, scene: "assets/scenes/ch1.svg" },
  { name: "Sanayi Bölgesi", desc: "Makineler gürlüyor, bacalar tütüyor.", at: 5000, scene: "assets/scenes/ch2.svg" },
  { name: "Şehir Merkezi", desc: "Bankalar ve şirketler altının peşinde.", at: 2000000, scene: "assets/scenes/ch3.svg" },
  { name: "Küresel Şirket", desc: "Altın artık tüm dünyaya ulaşıyor.", at: 2000000000, scene: "assets/scenes/ch4.svg" },
  { name: "Uzay Çağı", desc: "Yıldızlardan altın toplamanın zamanı geldi.", at: 1000000000000, scene: "assets/scenes/ch5.svg" },
];

export const GENERATORS = [
  { id: "miner", name: "Madenci", icon: "i-miner", chapter: 1, baseCost: 15, baseProd: 0.5, desc: "Kendi başına altın çıkarır." },
  { id: "drill", name: "Kazma Makinesi", icon: "i-drill", chapter: 1, baseCost: 120, baseProd: 4, desc: "Pnömatik matkapla hızlı kazı yapar." },
  { id: "cart", name: "Maden Vagonu", icon: "i-cart", chapter: 1, baseCost: 1100, baseProd: 22, desc: "Cevheri ocaktan dışarı taşır." },
  { id: "factory", name: "Fabrika Hattı", icon: "i-factory", chapter: 2, baseCost: 13000, baseProd: 130, desc: "Altını seri üretimle işler." },
  { id: "furnace", name: "Döküm Ocağı", icon: "i-furnace", chapter: 2, baseCost: 140000, baseProd: 1100, desc: "Altını külçe halinde döker." },
  { id: "bank", name: "Banka Şubesi", icon: "i-bank", chapter: 3, baseCost: 1600000, baseProd: 7500, desc: "Faiz getirisiyle kasayı büyütür." },
  { id: "hq", name: "Şirket Merkezi", icon: "i-hq", chapter: 3, baseCost: 20000000, baseProd: 55000, desc: "Küresel operasyonları yönetir." },
  { id: "satellite", name: "Uydu Üretimi", icon: "i-satellite", chapter: 4, baseCost: 250000000, baseProd: 300000, desc: "Uydularla madenleri uzaktan izler." },
  { id: "asteroid", name: "Asteroid Madeni", icon: "i-asteroid", chapter: 5, baseCost: 3000000000, baseProd: 2000000, desc: "Uzaydaki altın damarlarını sömürür." },
];

export const UPGRADES = [
  { id: "tap1", name: "Çelik Kazma", desc: "Tıklama gücü ×2", icon: "i-bolt", cost: 100, scope: "tap", mult: 2, req: { taps: 25 }, reqText: "25 kez tıkla" },
  { id: "tap2", name: "Elmas Uç", desc: "Tıklama gücü ×2", icon: "i-bolt", cost: 3000, scope: "tap", mult: 2, req: { taps: 1000 }, reqText: "1.000 kez tıkla" },
  { id: "miner1", name: "Madenci Eğitimi", desc: "Madencilerin üretimi ×2", icon: "i-miner", cost: 250, scope: "miner", mult: 2, req: { gen: ["miner", 10] }, reqText: "10 Madenci" },
  { id: "drill1", name: "Turbo Matkap", desc: "Kazma makinelerinin üretimi ×2", icon: "i-drill", cost: 4000, scope: "drill", mult: 2, req: { gen: ["drill", 10] }, reqText: "10 Kazma Makinesi" },
  { id: "cart1", name: "Yağlı Raylar", desc: "Maden vagonlarının üretimi ×2", icon: "i-cart", cost: 30000, scope: "cart", mult: 2, req: { gen: ["cart", 10] }, reqText: "10 Maden Vagonu" },
  { id: "all1", name: "Otomasyon", desc: "Tüm üretim ×2", icon: "i-factory", cost: 150000, scope: "all", mult: 2, req: { chapter: 2 }, reqText: "2. bölüm" },
  { id: "all2", name: "Faiz Geliri", desc: "Tüm üretim ×2", icon: "i-bank", cost: 2500000, scope: "all", mult: 2, req: { chapter: 3 }, reqText: "3. bölüm" },
  { id: "all3", name: "Küresel Ağ", desc: "Tüm üretim ×2", icon: "i-satellite", cost: 60000000, scope: "all", mult: 2, req: { chapter: 4 }, reqText: "4. bölüm" },
  { id: "all4", name: "Yıldız Lazeri", desc: "Tüm üretim ×3", icon: "i-asteroid", cost: 1500000000, scope: "all", mult: 3, req: { chapter: 5 }, reqText: "5. bölüm" },
];

export const ACHIEVEMENTS = [
  { id: "first_tap", name: "İlk Darbe", desc: "İlk kez tıkla", check: (s) => s.taps >= 1 },
  { id: "tap100", name: "Tık Ustası", desc: "100 kez tıkla", check: (s) => s.taps >= 100 },
  { id: "tap5000", name: "Parmak Kası", desc: "5.000 kez tıkla", check: (s) => s.taps >= 5000 },
  { id: "coin1k", name: "Küçük Servet", desc: "Toplam 1.000 altın kazan", check: (s) => s.totalEarned >= 1e3 },
  { id: "coin1m", name: "Milyoner", desc: "Toplam 1 milyon altın kazan", check: (s) => s.totalEarned >= 1e6 },
  { id: "coin1b", name: "Milyarder", desc: "Toplam 1 milyar altın kazan", check: (s) => s.totalEarned >= 1e9 },
  { id: "gen25", name: "Ekip Kurucu", desc: "Toplam 25 üreteç satın al", check: (s) => s.ownedGens >= 25 },
  { id: "collector", name: "Koleksiyoner", desc: "Her üreteçten en az birine sahip ol", check: (s) => s.uniqueGens === GENERATORS.length },
  { id: "chapter2", name: "Sanayiye Giriş", desc: "2. bölüme ulaş", check: (s) => s.chapter >= 2 },
  { id: "chapter5", name: "Yıldızlara", desc: "5. bölüme ulaş", check: (s) => s.chapter >= 5 },
  { id: "upg5", name: "Stratejist", desc: "5 geliştirme satın al", check: (s) => s.upgrades >= 5 },
];
