const STORAGE_KEY = "smokeFreeJourney";

const defaultData = {
  startDate: null,
  selectedProducts: [],
  cigarettesPerDay: 20,
  packPrice: 12,
  cigarettesPerPack: 20,
  tobaccoUnitsPerDay: 1,
  tobaccoGramsPerDay: 0.8,
  tobaccoGramsPerUnit: 0.8,
  tobaccoPackPrice: 20,
  tobaccoPackGrams: 30,
  paperSheetsPerDay: 1,
  paperPackPrice: 5,
  paperSheetsPerPack: 50,
  marijuanaUnitsPerDay: 1,
  marijuanaGramsPerDay: 0.8,
  marijuanaGramsPerUnit: 0.8,
  marijuanaPricePerGram: 20,
  filtersPerDay: 0,
  filtersPackPrice: 5,
  filtersPerPack: 50
};

const achievements = [
  { hours: 1, title: "1 hora", icon: "🌱", text: "Você começou." },
  { hours: 8, title: "8 horas", icon: "✨", text: "Um turno inteiro sem fumar." },
  { hours: 24, title: "24 horas", icon: "🌤️", text: "Seu primeiro dia completo." },
  { hours: 72, title: "3 dias", icon: "🔥", text: "Uau! Três dias de decisão e coragem." },
  { hours: 168, title: "1 semana", icon: "🏆", text: "Uma semana inteira." },
  { hours: 336, title: "2 semanas", icon: "💪", text: "Sua nova rotina ganha força." },
  { hours: 720, title: "1 mês", icon: "🌟", text: "Um mês de liberdade." },
  { hours: 2160, title: "3 meses", icon: "🎯", text: "Um grande marco." },
  { hours: 4320, title: "6 meses", icon: "🚀", text: "Meio ano." },
  { hours: 8760, title: "1 ano", icon: "👑", text: "Um ano inteiro sem fumar." }
];

const messages = [
  { hours: 0, text: "Cada minuto conta. Continue." },
  { hours: 1, text: "Você já começou a provar para si que consegue atravessar a vontade." },
  { hours: 8, text: "Olhe para o tempo que já passou, não apenas para o que ainda falta." },
  { hours: 24, text: "Um dia completo. Isso já é uma conquista real." },
  { hours: 72, text: "Você está construindo uma nova rotina." },
  { hours: 168, text: "Continue protegendo essa conquista." },
  { hours: 720, text: "Um mês sem fumar. Você já percorreu um caminho importante." },
  { hours: 2160, text: "Três meses. Sua história já não é a mesma de quando começou." },
  { hours: 8760, text: "Um ano. Uma coleção inteira de escolhas a seu favor." }
];

const bodyBenefits = [
  { hours: 1, icon: "🌱", title: "Seu corpo começa a responder", text: "Cada hora sem fumar já representa um tempo a mais longe da fumaça e das substâncias do cigarro." },
  { hours: 8, icon: "❤️", title: "Menos sobrecarga para o coração", text: "Você já passou várias horas sem fumar. Seu corpo começa a se adaptar ao tempo longe do cigarro." },
  { hours: 24, icon: "🌤️", title: "Um dia inteiro de mudança", text: "Você chegou a um dia sem fumar. A recuperação continua enquanto seu corpo fica cada vez mais tempo longe da fumaça." },
  { hours: 72, icon: "lungs", title: "Respirar pode ficar mais confortável", text: "Depois dos primeiros dias, a recuperação continua. Você está dando ao seu corpo uma chance de funcionar melhor." },
  { hours: 168, icon: "⚡", title: "Mais disposição no dia a dia", text: "Uma semana sem fumar é uma grande conquista. Algumas pessoas começam a perceber mudanças na disposição e no fôlego." },
  { hours: 336, icon: "💪", title: "Mais fôlego para suas atividades", text: "Duas semanas representam mais tempo de recuperação e uma rotina cada vez mais distante do cigarro." },
  { hours: 720, icon: "🌿", title: "Uma rotina mais leve", text: "Um mês sem fumar. Você já construiu uma sequência importante e continua dando ao seu corpo tempo para se recuperar." },
  { hours: 2160, icon: "🎯", title: "Mais resistência", text: "Três meses sem fumar representam uma grande mudança de rotina. Continue cuidando dessa conquista." },
  { hours: 4320, icon: "🚀", title: "Menos cansaço, mais liberdade", text: "Seis meses sem fumar. Você já deixou o cigarro para trás em muitos momentos do seu dia a dia." },
  { hours: 8760, icon: "👑", title: "1 ano sem fumar!", text: "Uma conquista enorme! Mas sua jornada não termina aqui. Vamos começar o próximo ano?" }
];

let data = { ...defaultData };
let breathingTimer = null;
let toastTimer = null;
let currentUser = null;
let authMode = "login";
let isSaving = false;
const isSupabaseConfigured = () => Boolean(window.supabase?.createClient && window.SUPABASE_URL && !window.SUPABASE_URL.includes("COLE_AQUI") && window.SUPABASE_ANON_KEY && !window.SUPABASE_ANON_KEY.includes("COLE_AQUI"));
const supabaseClient = isSupabaseConfigured() ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null;

const $ = (selector) => document.querySelector(selector);

function parseLocalizedNumber(value) {
  if (typeof value === "number") return value;
  const normalized = String(value ?? "").trim().replace(/\s/g, "").replace(",", ".");
  return normalized === "" ? NaN : Number(normalized);
}

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return { ...defaultData };
    // Dados de versões antigas acompanhavam apenas cigarros industrializados.
    const migrated = { ...defaultData, ...saved };
    if (!Array.isArray(saved.selectedProducts)) migrated.selectedProducts = ["cigarettes"];
    if (saved.tobaccoUnitsPerDay == null && saved.tobaccoGramsPerDay != null) migrated.tobaccoUnitsPerDay = Number(saved.tobaccoGramsPerDay) / 0.8;
    if (saved.marijuanaUnitsPerDay == null && saved.marijuanaGramsPerDay != null) migrated.marijuanaUnitsPerDay = Number(saved.marijuanaGramsPerDay) / 0.8;
    if (!migrated.selectedProducts.includes("tobacco") && !migrated.selectedProducts.includes("marijuana")) migrated.selectedProducts = migrated.selectedProducts.filter((id) => id !== "paper" && id !== "filters");
    // Versões anteriores marcavam filtros automaticamente ao selecionar tabaco ou maconha.
    // Remove essa seleção automática antiga; filtros só entram se forem escolhidos explicitamente.
    migrated.selectedProducts = migrated.selectedProducts.filter((id) => id !== "filters");
    return migrated;
  } catch {
    return { ...defaultData };
  }
}

function localKey() { return currentUser ? `${STORAGE_KEY}:${currentUser.id}` : STORAGE_KEY; }
function saveData() {
  localStorage.setItem(localKey(), JSON.stringify(data));
  if (!supabaseClient || !currentUser || isSaving) return Promise.resolve();
  isSaving = true;
  return supabaseClient.from("user_journeys").upsert({
    user_id: currentUser.id,
    journey_data: data,
    updated_at: new Date().toISOString()
  }, { onConflict: "user_id" }).then(({ error }) => {
    if (error) { console.error("Supabase save error", error); showToast("Salvo neste dispositivo; sincronização com a nuvem falhou."); }
  }).finally(() => { isSaving = false; });
}
async function loadAccount(user) {
  currentUser = user;
  let local = null;
  try { local = JSON.parse(localStorage.getItem(`${STORAGE_KEY}:${user.id}`) || "null"); } catch {}
  try {
    const { data: row, error } = await supabaseClient.from("user_journeys").select("journey_data").eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    if (row?.journey_data) data = { ...defaultData, ...row.journey_data };
    else if (local) data = { ...defaultData, ...local };
    else {
      const legacy = localStorage.getItem(`${STORAGE_KEY}:legacy-migrated`) ? null : loadData();
      data = legacy || { ...defaultData };
      if (legacy) localStorage.setItem(`${STORAGE_KEY}:legacy-migrated`, "true");
      await saveData();
    }
    localStorage.setItem(`${STORAGE_KEY}:${user.id}`, JSON.stringify(data));
  } catch (err) {
    console.error("Supabase load error", err);
    data = local ? { ...defaultData, ...local } : { ...defaultData };
    showToast("Sem sincronização no momento. Usando dados locais.");
  }
  $("#authScreen").hidden = true;
  $("#appShell").hidden = false;
  $("#signOutButton").hidden = false;
  updateDashboard();
  if (!data.startDate) setTimeout(openSettings, 350);
}
function setAuthMode(mode) {
  authMode = mode === "signup" ? "signup" : "login";
  const signup = authMode === "signup";
  $("#loginTab").classList.toggle("is-active", !signup);
  $("#signupTab").classList.toggle("is-active", signup);
  $("#loginTab").setAttribute("aria-selected", String(!signup));
  $("#signupTab").setAttribute("aria-selected", String(signup));
  $("#nameField").hidden = !signup;
  $("#authTitle").textContent = signup ? "Crie sua conta" : "Entre na sua conta";
  $("#authDescription").textContent = signup ? "Sua jornada fica salva e sincronizada." : "Continue acompanhando sua jornada.";
  $("#authSubmit").textContent = signup ? "Criar conta" : "Entrar";
  $("#authPassword").autocomplete = signup ? "new-password" : "current-password";
  $("#resetPasswordButton").hidden = signup;
  $("#authFeedback").textContent = "";
}
async function submitAuth(event) {
  event.preventDefault();
  if (!supabaseClient) { $("#authFeedback").textContent = "Configure o Supabase no arquivo js/supabase-config.js para ativar o login."; return; }
  const email = $("#authEmail").value.trim();
  const password = $("#authPassword").value;
  const button = $("#authSubmit");
  button.disabled = true;
  $("#authFeedback").textContent = "";
  try {
    if (authMode === "signup") {
      const { data: result, error } = await supabaseClient.auth.signUp({ email, password, options: { data: { display_name: $("#displayName").value.trim() } } });
      if (error) throw error;
      $("#authFeedback").textContent = result.session ? "Conta criada. Carregando sua jornada..." : "Conta criada! Confirme seu e-mail e depois entre.";
    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
    }
  } catch (err) { $("#authFeedback").textContent = err.message || "Não foi possível entrar. Confira os dados."; }
  finally { button.disabled = false; button.textContent = authMode === "signup" ? "Criar conta" : "Entrar"; }
}
async function resetPassword() {
  const email = $("#authEmail").value.trim();
  if (!email) { $("#authFeedback").textContent = "Informe seu e-mail para receber o link de recuperação."; $("#authEmail").focus(); return; }
  if (!supabaseClient) { $("#authFeedback").textContent = "Configure o Supabase primeiro."; return; }
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}${location.pathname}` });
  $("#authFeedback").textContent = error ? error.message : "Se o e-mail estiver cadastrado, você receberá um link de recuperação.";
}

function formatTwoDigits(value) {
  return String(value).padStart(2, "0");
}

function formatMoney(value) {
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.max(0, Number(value) || 0));

  return formatted.replace(/\s/g, "");
}

function getElapsed() {
  if (!data.startDate) return 0;

  const start = new Date(data.startDate);
  const elapsed = Date.now() - start.getTime();
  return Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
}

function getProductDefinitions() {
  const cigarettesPerPack = Math.max(1, Number(data.cigarettesPerPack) || 1);
  const tobaccoPackGrams = Math.max(0.1, Number(data.tobaccoPackGrams) || 0.1);
  const paperSheetsPerPack = Math.max(1, Number(data.paperSheetsPerPack) || 1);
  const filtersPerPack = Math.max(1, Number(data.filtersPerPack) || 1);
  const tobaccoUnits = Math.max(0, Number(data.tobaccoUnitsPerDay ?? (Number(data.tobaccoGramsPerDay || 0) / 0.8)) || 0);
  const marijuanaUnits = Math.max(0, Number(data.marijuanaUnitsPerDay ?? (Number(data.marijuanaGramsPerDay || 0) / 0.8)) || 0);
  const tobaccoGramsPerUnit = Math.max(0.01, Number(data.tobaccoGramsPerUnit) || 0.8);
  const marijuanaGramsPerUnit = Math.max(0.01, Number(data.marijuanaGramsPerUnit) || 0.8);
  const tobaccoGrams = tobaccoUnits * tobaccoGramsPerUnit;
  const marijuanaGrams = marijuanaUnits * marijuanaGramsPerUnit;
  return [
    { id: "cigarettes", name: "Cigarro industrializado", icon: "🚬", daily: Number(data.cigarettesPerDay) || 0, unitCost: (Number(data.packPrice) || 0) / cigarettesPerPack, unit: "cigarros", details: `${Number(data.cigarettesPerDay) || 0} cigarros por dia · Maço: ${formatMoney(data.packPrice)} (${cigarettesPerPack} cigarros)` },
    { id: "tobacco", name: "Tabaco para enrolar", icon: "🍂", daily: tobaccoGrams, unitCost: (Number(data.tobaccoPackPrice) || 0) / tobaccoPackGrams, unit: "g", details: `${tobaccoUnits} unidades por dia · ${tobaccoGrams.toLocaleString("pt-BR")} g por dia · Embalagem: ${formatMoney(data.tobaccoPackPrice)} (${tobaccoPackGrams} g)` },
    { id: "marijuana", name: "Maconha", icon: "🌿", daily: marijuanaGrams, unitCost: Number(data.marijuanaPricePerGram) || 0, unit: "g", details: `${marijuanaUnits} unidades por dia · ${marijuanaGrams.toLocaleString("pt-BR")} g por dia · Preço por grama: ${formatMoney(data.marijuanaPricePerGram)}` },
    { id: "paper", name: "Seda", icon: "📄", daily: Number(data.paperSheetsPerDay) || 0, unitCost: (Number(data.paperPackPrice) || 0) / paperSheetsPerPack, unit: "folhas", details: `${Number(data.paperSheetsPerDay) || 0} sedas por dia · Embalagem: ${formatMoney(data.paperPackPrice)} (${paperSheetsPerPack} folhas)` },
    { id: "filters", name: "Filtros", icon: "🔘", daily: Number(data.filtersPerDay) || 0, unitCost: (Number(data.filtersPackPrice) || 0) / filtersPerPack, unit: "filtros", details: `${Number(data.filtersPerDay) || 0} filtros por dia · Embalagem: ${formatMoney(data.filtersPackPrice)} (${filtersPerPack} filtros)` }
  ];
}

function renderProductSavings(elapsedDays) {
  const selected = Array.isArray(data.selectedProducts) ? data.selectedProducts : [];
  const hasRolledProducts = selected.includes("tobacco") || selected.includes("marijuana");
  const activeIds = hasRolledProducts ? [...selected, "paper"] : selected;
  const definitions = getProductDefinitions().filter((product) => activeIds.includes(product.id));
  const grid = $("#productSavingsGrid");
  const section = $("#productSavingsSection");
  grid.innerHTML = definitions.map((product) => {
    const saved = elapsedDays * product.daily * product.unitCost;
    return `<article class="product-saving-card">
      <div class="product-saving-card__top"><span class="product-saving-card__icon" aria-hidden="true">${product.icon}</span><span class="product-saving-card__name">${product.name}</span></div>
      <p class="product-saving-card__details">${product.details}</p>
      <strong>${formatMoney(saved)}</strong>
      <small>economia estimada</small>
    </article>`;
  }).join("");
  section.hidden = definitions.length === 0;
  return definitions.reduce((total, product) => total + elapsedDays * product.daily * product.unitCost, 0);
}

function updateDashboard() {
  const elapsed = getElapsed();
  const totalSeconds = Math.floor(elapsed / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const totalHours = elapsed / 3600000;
  const elapsedDays = elapsed / 86400000;
  const selected = Array.isArray(data.selectedProducts) ? data.selectedProducts : [];

  $("#days").textContent = days;
  $("#hours").textContent = formatTwoDigits(hours);
  $("#minutes").textContent = formatTwoDigits(minutes);
  $("#seconds").textContent = formatTwoDigits(seconds);

  // Conta apenas unidades fumadas: industrializados, tabaco e maconha.
  // Seda e filtros são acessórios e não entram na quantidade de unidades.
  const smokedProducts = [];
  if (selected.includes("cigarettes")) {
    smokedProducts.push({ label: "Industrializados", daily: Number(data.cigarettesPerDay) || 0 });
  }
  if (selected.includes("tobacco")) {
    smokedProducts.push({ label: "Tabaco", daily: Math.max(0, Number(data.tobaccoUnitsPerDay ?? (Number(data.tobaccoGramsPerDay || 0) / 0.8)) || 0) });
  }
  if (selected.includes("marijuana")) {
    smokedProducts.push({ label: "Maconha", daily: Math.max(0, Number(data.marijuanaUnitsPerDay ?? (Number(data.marijuanaGramsPerDay || 0) / 0.8)) || 0) });
  }
  $("#cigarettesAvoidedCard").hidden = smokedProducts.length === 0;
  $("#moneySavedCard").hidden = selected.length === 0;
  const unitCounts = smokedProducts.map((product) => ({
    label: product.label,
    count: Math.floor(elapsedDays * product.daily)
  }));
  const totalUnitsAvoided = unitCounts.reduce((total, product) => total + product.count, 0);
  $("#cigarettesAvoided").textContent = totalUnitsAvoided.toLocaleString("pt-BR");
  $("#unitsAvoidedDetails").textContent = unitCounts
    .map((product) => `${product.label}: ${product.count.toLocaleString("pt-BR")}`)
    .join(" · ");
  const moneySaved = renderProductSavings(elapsedDays);
  $("#moneySaved").textContent = formatMoney(moneySaved);

  $("#timeSmokeFree").textContent = totalHours < 24
    ? `${Math.floor(totalHours)} ${Math.floor(totalHours) === 1 ? "hora" : "horas"}`
    : `${days} ${days === 1 ? "dia" : "dias"}`;

  const currentMessage = [...messages].reverse().find((message) => totalHours >= message.hours);
  $("#motivationalMessage").textContent = currentMessage?.text || messages[0].text;

  updateBodyBenefit(totalHours);
  updateAchievements(totalHours);
  updateNextAchievement(totalHours);
}

const lungsSvg = `
  <svg class="lungs-icon" viewBox="0 0 64 64" role="img" aria-label="Pulmões">
    <path d="M30 17v15c-5-7-8-14-13-14-5 0-8 7-9 15-1 8 1 18 8 20 6 2 12-3 14-9V32"
          fill="none" stroke="currentColor" stroke-width="4.5"
          stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M34 17v15c5-7 8-14 13-14 5 0 8 7 9 15 1 8-1 18-8 20-6 2-12-3-14-9V32"
          fill="none" stroke="currentColor" stroke-width="4.5"
          stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M32 10v24" fill="none" stroke="currentColor"
          stroke-width="4.5" stroke-linecap="round"/>
  </svg>`;

function updateBodyBenefit(totalHours) {
  const currentBenefit = [...bodyBenefits].reverse().find((benefit) => totalHours >= benefit.hours);
  if (!currentBenefit) return;

  const icon = $("#bodyBenefitIcon");

  if (currentBenefit.icon === "lungs") {
    icon.innerHTML = lungsSvg;
    icon.setAttribute("data-icon", "lungs");
  } else {
    icon.textContent = currentBenefit.icon;
    icon.setAttribute("data-icon", "emoji");
  }

  $("#bodyBenefitHeading").textContent = currentBenefit.title;
  $("#bodyBenefitText").textContent = currentBenefit.text;
  $("#bodyBenefitTitle").textContent = currentBenefit.hours >= 8760
    ? "Um novo começo"
    : "Cada escolha faz diferença";
}

function updateAchievements(totalHours) {
  const container = $("#achievements");

  container.innerHTML = achievements.map((achievement) => {
    const unlocked = totalHours >= achievement.hours;

    return `<article class="achievement ${unlocked ? "achievement--unlocked" : ""}">
      <div class="achievement__icon" aria-hidden="true">${unlocked ? achievement.icon : "🔒"}</div>
      <strong>${achievement.title}</strong>
      <small>${unlocked ? achievement.text : "Continue para desbloquear."}</small>
    </article>`;
  }).join("");
}

function updateNextAchievement(totalHours) {
  const next = achievements.find((achievement) => totalHours < achievement.hours);
  const previous = [...achievements].reverse().find((achievement) => totalHours >= achievement.hours);
  const progressBar = $("#achievementProgress");
  const track = progressBar.parentElement;

  if (!next) {
    $("#nextAchievementTitle").textContent = "Você chegou a 1 ano!";
    progressBar.style.width = "100%";
    track.setAttribute("aria-valuenow", "100");
    $("#achievementCaption").textContent = "Continue acumulando dias. Sua jornada não termina em um marco.";
    return;
  }

  const startHours = previous?.hours || 0;
  const interval = next.hours - startHours;
  const progress = ((totalHours - startHours) / interval) * 100;
  const clamped = Math.min(100, Math.max(0, progress));
  const remainingHours = Math.max(0, next.hours - totalHours);

  $("#nextAchievementTitle").textContent = next.title;
  progressBar.style.width = `${clamped}%`;
  track.setAttribute("aria-valuenow", String(Math.floor(clamped)));

  if (remainingHours < 24) {
    const hours = Math.ceil(remainingHours);
    $("#achievementCaption").textContent =
      `Falta aproximadamente ${hours} ${hours === 1 ? "hora" : "horas"} para este marco.`;
  } else {
    const days = Math.ceil(remainingHours / 24);
    $("#achievementCaption").textContent =
      `Faltam aproximadamente ${days} ${days === 1 ? "dia" : "dias"} para este marco.`;
  }
}

function updateProductFieldVisibility() {
  const cigarettes = $("#selectCigarettes").checked;
  const tobacco = $("#selectTobacco").checked;
  const marijuana = $("#selectMarijuana").checked;
  const rolledProducts = tobacco || marijuana;
  $("#cigarettesFields").hidden = !cigarettes;
  $("#tobaccoFields").hidden = !tobacco;
  $("#marijuanaFields").hidden = !marijuana;
  $("#paperFields").hidden = !rolledProducts;
  $("#filtersFields").hidden = !rolledProducts || !$("#selectFilters").checked;
}

function openSettings() {
  if (data.startDate) {
    const date = new Date(data.startDate);
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    $("#startDate").value = local.toISOString().slice(0, 16);
  } else {
    $("#startDate").value = "";
  }

  $("#selectCigarettes").checked = data.selectedProducts.includes("cigarettes");
  $("#selectTobacco").checked = data.selectedProducts.includes("tobacco");
  $("#selectMarijuana").checked = data.selectedProducts.includes("marijuana");
  $("#selectFilters").checked = data.selectedProducts.includes("filters");

  const fields = [
    "cigarettesPerDay", "packPrice", "cigarettesPerPack", "tobaccoUnitsPerDay", "tobaccoPackPrice", "tobaccoPackGrams", "tobaccoGramsPerUnit",
    "paperSheetsPerDay", "paperPackPrice", "paperSheetsPerPack", "marijuanaUnitsPerDay", "marijuanaPricePerGram", "marijuanaGramsPerUnit",
    "filtersPerDay", "filtersPackPrice", "filtersPerPack"
  ];
  fields.forEach((id) => { if ($("#" + id)) $("#" + id).value = ["tobaccoGramsPerUnit", "marijuanaGramsPerUnit"].includes(id) ? String(data[id]).replace(".", ",") : data[id]; });
  updateProductFieldVisibility();
  $("#settingsModal").showModal();
}

function handleSettingsSubmit(event) {
  event.preventDefault();

  const selectedDate = $("#startDate").value ? new Date($("#startDate").value) : new Date();
  if (Number.isNaN(selectedDate.getTime())) return showToast("Informe uma data válida.");
  if (selectedDate > new Date()) return showToast("A data de início não pode estar no futuro.");

  const selectedProducts = [];
  if ($("#selectCigarettes").checked) selectedProducts.push("cigarettes");
  if ($("#selectTobacco").checked) selectedProducts.push("tobacco");
  if ($("#selectMarijuana").checked) selectedProducts.push("marijuana");

  const numericFields = [
    "cigarettesPerDay", "packPrice", "cigarettesPerPack", "tobaccoUnitsPerDay", "tobaccoPackPrice", "tobaccoPackGrams", "tobaccoGramsPerUnit",
    "paperSheetsPerDay", "paperPackPrice", "paperSheetsPerPack", "marijuanaUnitsPerDay", "marijuanaPricePerGram", "marijuanaGramsPerUnit",
    "filtersPerDay", "filtersPackPrice", "filtersPerPack"
  ];
  const values = {};
  numericFields.forEach((id) => { values[id] = parseLocalizedNumber($("#" + id).value); });
  const hasRolledProducts = selectedProducts.includes("tobacco") || selectedProducts.includes("marijuana");
  if (hasRolledProducts) selectedProducts.push("paper");
  if (hasRolledProducts && $("#selectFilters").checked) selectedProducts.push("filters");

  const validations = [
    ["cigarettes", "cigarettesPerDay", 0, "Informe a quantidade de cigarros por dia (maior que zero).", true],
    ["cigarettes", "packPrice", 0, "Informe um preço válido para o maço."],
    ["cigarettes", "cigarettesPerPack", 1, "Informe a quantidade de cigarros por maço."],
    ["tobacco", "tobaccoUnitsPerDay", 0, "Informe as unidades de tabaco por dia (pode ser zero)."],
    ["tobacco", "tobaccoPackPrice", 0, "Informe um preço válido para o tabaco."],
    ["tobacco", "tobaccoPackGrams", 0.1, "Informe as gramas por embalagem de tabaco."],
    ["tobacco", "tobaccoGramsPerUnit", 0.01, "Informe uma estimativa válida de gramas de tabaco por unidade."],
    ["paper", "paperSheetsPerDay", 0, "Informe a quantidade de sedas por dia (pode ser zero)."],
    ["paper", "paperPackPrice", 0, "Informe um preço válido para a seda."],
    ["paper", "paperSheetsPerPack", 1, "Informe quantas folhas há na embalagem de seda."],
    ["marijuana", "marijuanaUnitsPerDay", 0, "Informe as unidades de maconha por dia (pode ser zero)."],
    ["marijuana", "marijuanaPricePerGram", 0, "Informe um preço válido por grama de maconha."],
    ["marijuana", "marijuanaGramsPerUnit", 0.01, "Informe uma estimativa válida de gramas de maconha por unidade."],
    ["filters", "filtersPerDay", 0, "Informe a quantidade de filtros por dia (pode ser zero)."],
    ["filters", "filtersPackPrice", 0, "Informe um preço válido para os filtros."],
    ["filters", "filtersPerPack", 1, "Informe quantos filtros há na embalagem."]
  ];

  for (const [product, field, minimum, message, mustBePositive] of validations) {
    if (!selectedProducts.includes(product)) continue;
    const value = values[field];
    if (!Number.isFinite(value) || value < minimum || (mustBePositive && value === 0)) return showToast(message);
  }

  const isFirstConfiguration = !data.startDate;
  data = {
    ...data,
    ...values,
    selectedProducts,
    startDate: $("#startDate").value ? selectedDate.toISOString() : (isFirstConfiguration ? new Date().toISOString() : data.startDate)
  };

  saveData();
  updateDashboard();
  $("#settingsModal").close();
  showToast("Dados salvos.");
}

function openCravingModal() {
  $("#cravingModal").showModal();
  startBreathingGuide();
}

function closeCravingModal() {
  if ($("#cravingModal").open) $("#cravingModal").close();

  if (breathingTimer) {
    clearInterval(breathingTimer);
    breathingTimer = null;
  }
}

function startBreathingGuide() {
  const steps = ["Inspire...", "Segure...", "Expire...", "Respire"];
  let index = 0;

  $("#breathingText").textContent = steps[index];

  if (breathingTimer) clearInterval(breathingTimer);

  breathingTimer = setInterval(() => {
    index = (index + 1) % steps.length;
    $("#breathingText").textContent = steps[index];
  }, 2000);
}

async function shareProgress() {
  const days = Math.floor(getElapsed() / 86400000);
  const text = `Estou há ${days} ${days === 1 ? "dia" : "dias"} sem fumar. Cada dia conta. 🚭`;

  try {
    if (navigator.share) {
      await navigator.share({ title: "Minha jornada sem fumar", text });
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      showToast("Conquista copiada para a área de transferência.");
    } else {
      showToast(text);
    }
  } catch {
    // O usuário pode cancelar o compartilhamento.
  }
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");

  if (toastTimer) clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}


const THEME_KEY = "smokeFreeTheme";

function applyTheme(theme) {
  const resolvedTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", resolvedTheme);
  localStorage.setItem(THEME_KEY, resolvedTheme);

  const button = $("#themeButton");
  if (button) {
    const isDark = resolvedTheme === "dark";
    button.textContent = isDark ? "☀" : "☾";
    button.setAttribute("aria-label", isDark ? "Ativar tema claro" : "Ativar tema escuro");
    button.setAttribute("title", isDark ? "Tema claro" : "Tema escuro");
  }

  const meta = $("#themeColorMeta");
  if (meta) {
    meta.setAttribute("content", resolvedTheme === "dark" ? "#1f2933" : "#e9eef3");
  }
}

function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  applyTheme(savedTheme === "dark" ? "dark" : "light");
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
}

document.addEventListener("DOMContentLoaded", () => {
  loadTheme();
  setAuthMode("login");
  if (!supabaseClient) {
    $("#authConfigNote").hidden = false;
    $("#authSubmit").disabled = true;
  } else {
    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (session?.user && ["INITIAL_SESSION", "SIGNED_IN", "USER_UPDATED"].includes(event)) {
        setTimeout(() => loadAccount(session.user), 0);
      } else if (event === "SIGNED_OUT") {
        currentUser = null; data = { ...defaultData };
        $("#appShell").hidden = true; $("#authScreen").hidden = false;
        $("#authFeedback").textContent = "Você saiu da sua conta.";
      }
    });
  }
  $("#authForm").addEventListener("submit", submitAuth);
  $("#loginTab").addEventListener("click", () => setAuthMode("login"));
  $("#signupTab").addEventListener("click", () => setAuthMode("signup"));
  $("#resetPasswordButton").addEventListener("click", resetPassword);
  $("#signOutButton").addEventListener("click", async () => { if (supabaseClient) await supabaseClient.auth.signOut(); });
  setInterval(() => { if (currentUser) updateDashboard(); }, 1000);

  $("#themeButton").addEventListener("click", toggleTheme);
  $("#openSettings").addEventListener("click", openSettings);
  $("#settingsForm").addEventListener("submit", handleSettingsSubmit);
  ["selectCigarettes", "selectTobacco", "selectMarijuana", "selectFilters"].forEach((id) => {
    $("#" + id).addEventListener("change", updateProductFieldVisibility);
  });
  $("#closeSettings").addEventListener("click", () => $("#settingsModal").close());
  $("#cravingButton").addEventListener("click", openCravingModal);
  $("#closeCraving").addEventListener("click", closeCravingModal);

  $("#cravingModal").addEventListener("close", () => {
    if (breathingTimer) {
      clearInterval(breathingTimer);
      breathingTimer = null;
    }
  });

  $("#shareButton").addEventListener("click", shareProgress);

  document.querySelectorAll(".coping-card").forEach((button) => {
    button.addEventListener("click", () => {
      const messages = {
        water: "Pegue um copo de água e beba lentamente. Use este minuto para sair do piloto automático.",
        move: "Levante-se e mude de ambiente. Uma pequena mudança pode quebrar a associação com o cigarro.",
        delay: "Adie qualquer decisão por 10 minutos. Quando esse tempo passar, reavalie como você está se sentindo."
      };

      $("#cravingMessage").textContent =
        messages[button.dataset.tip] || "Continue. Este momento vai passar.";
    });
  });

  if (!localStorage.getItem(STORAGE_KEY)) {
    setTimeout(openSettings, 500);
  }
});
