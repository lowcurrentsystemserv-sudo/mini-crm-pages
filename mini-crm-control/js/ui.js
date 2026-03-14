import { state } from "./state.js";
import { CONFIG } from "./config.js";
import { api } from "./api.js";
import { clearSession } from "./auth.js";

const screens = {
  login: document.getElementById("screen-login"),
  app: document.getElementById("screen-app"),
};

const els = {
  btnLogout: document.getElementById("btnLogout"),
  btnTheme: document.getElementById("btnTheme"),
  btnMenu: document.getElementById("btnMenu"),
  loginError: document.getElementById("loginError"),

  userName: document.getElementById("userName"),
  userRole: document.getElementById("userRole"),
  userAvatar: document.getElementById("userAvatar"),
  nav: document.getElementById("nav"),
  apiStatus: document.getElementById("apiStatus"),
  appSidebar: document.getElementById("appSidebar"),
  sidebarBackdrop: document.getElementById("sidebarBackdrop"),

  contentTitle: document.getElementById("contentTitle"),
  contentHint: document.getElementById("contentHint"),
  quickActions: document.getElementById("quickActions"),

  toast: document.getElementById("toast"),

  // modal
  modalOverlay: document.getElementById("modalOverlay"),
  modalTitle: document.getElementById("modalTitle"),
  modalBody: document.getElementById("modalBody"),
  modalClose: document.getElementById("modalClose"),
  modalCancel: document.getElementById("modalCancel"),
  modalOk: document.getElementById("modalOk"),

  // master
  objectSearch: document.getElementById("objectSearch"),
  searchResults: document.getElementById("searchResults"),
  dispatcherNote: document.getElementById("dispatcherNote"),
  visitComment: document.getElementById("visitComment"),
  myVisitsTable: document.getElementById("myVisitsTable"),

  // dispatcher
  requestsTable: document.getElementById("requestsTable"),
  reqStatusFilter: document.getElementById("reqStatusFilter"),
  reqExecutorFilter: document.getElementById("reqExecutorFilter"),
  reqSearchFilter: document.getElementById("reqSearchFilter"),

  candidatesTable: document.getElementById("candidatesTable"),

  planTable: document.getElementById("planTable"),
  planExecutorFilter: document.getElementById("planExecutorFilter"),
  planStatusFilter: document.getElementById("planStatusFilter"),
  planSearchFilter: document.getElementById("planSearchFilter"),
};

const views = {
  dashboard: document.getElementById("view-dashboard"),
  masterVisit: document.getElementById("view-master-visit"),
  masterMyVisits: document.getElementById("view-master-myvisits"),
  dispatcherRequests: document.getElementById("view-dispatcher-requests"),
  dispatcherCandidates: document.getElementById("view-dispatcher-candidates"),
  dispatcherPlan: document.getElementById("view-dispatcher-plan"),
  statReports: document.getElementById("view-stat-reports"),
  adminUsers: document.getElementById("view-admin-users"),
};

export function showAppLoader(text = "Загрузка...") {
  const loader = document.getElementById("appLoader");
  const loaderText = document.getElementById("appLoaderText");
  if (!loader) return;

  if (loaderText) loaderText.textContent = text;
  loader.classList.remove("hidden");
  document.body.classList.add("loading");
}

export function hideAppLoader() {
  const loader = document.getElementById("appLoader");
  if (!loader) return;

  loader.classList.add("hidden");
  document.body.classList.remove("loading");
}

export function setApiStatus() {
  const s = CONFIG.USE_MOCK ? "MOCK" : (CONFIG.API_BASE_URL ? "LIVE" : "OFF");
  els.apiStatus.textContent = `API: ${s}`;
}

export function showScreen(name) {
  const isApp = name === "app";
  screens.login.style.display = name === "login" ? "block" : "none";
  screens.app.style.display = isApp ? "block" : "none";
  els.btnLogout.style.display = isApp ? "inline-flex" : "none";
  if (els.btnMenu) els.btnMenu.style.display = isApp ? "inline-flex" : "none";
  if (!isApp) closeSidebar();
}

export function toast(msg) {
  els.toast.textContent = "✔ " + msg;
  els.toast.classList.add("show");
  setTimeout(() => els.toast.classList.remove("show"), 2200);
}

export function showError(msg) {
  els.loginError.style.display = "block";
  els.loginError.textContent = msg;
}

export function clearError() {
  els.loginError.style.display = "none";
  els.loginError.textContent = "";
}

export function setUserUI() {
  const u = state.user;
  els.userName.textContent = u?.name || "—";
  els.userRole.textContent = u?.role || "—";
  els.userAvatar.textContent = (u?.name?.trim()?.[0] || "U").toUpperCase();
}

function openSidebar() {
  els.appSidebar?.classList.add("open");
  els.sidebarBackdrop?.classList.add("show");
  document.body.classList.add("sidebar-open");
}

function closeSidebar() {
  els.appSidebar?.classList.remove("open");
  els.sidebarBackdrop?.classList.remove("show");
  document.body.classList.remove("sidebar-open");
}

function toggleSidebar() {
  const opened = els.appSidebar?.classList.contains("open");
  if (opened) closeSidebar();
  else openSidebar();
}

export function bindGlobalUI() {
  els.btnLogout.addEventListener("click", () => {
    clearSession();
    location.reload();
  });

  els.btnTheme.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    document.documentElement.setAttribute("data-theme", cur === "light" ? "dark" : "light");
    localStorage.setItem("mcc_theme", document.documentElement.getAttribute("data-theme"));
  });

  if (els.btnMenu) {
    els.btnMenu.addEventListener("click", toggleSidebar);
  }

  if (els.sidebarBackdrop) {
    els.sidebarBackdrop.addEventListener("click", closeSidebar);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSidebar();
  });

  const savedTheme = localStorage.getItem("mcc_theme");
  if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);
  else document.documentElement.setAttribute("data-theme", "dark");

  applyResponsiveLayout();
  window.addEventListener("resize", debounce(applyResponsiveLayout, 120));

  els.modalClose.addEventListener("click", closeModal);
  els.modalCancel.addEventListener("click", closeModal);
  els.modalOverlay.addEventListener("click", (e) => {
    if (e.target === els.modalOverlay) closeModal();
  });
}

export async function ensureObjectsLoaded() {
  if (state.objects?.length) return;

  state.objects = [];
  state.objectsMap = {};
  state.plan = [];
}

function hideAllViews() {
  Object.values(views).forEach(v => v.style.display = "none");
}

export function openView(key, title, hint) {
  hideAllViews();
  views[key].style.display = "block";
  els.contentTitle.textContent = title;
  els.contentHint.textContent = hint || "";
}

export function buildNav() {
  const role = state.user?.role;

  const items = [{ label: "Панель", onClick: () => openDashboard() }];

  if (role === "master") {
    items.push(
      { label: "Зафиксировать визит", onClick: () => openMasterVisit() },
      { label: "Мой план", onClick: () => openMasterMyVisits() },
    );
  }

  if (role === "dispatcher") {
    items.push(
      { label: "Заявки", onClick: () => openDispatcherRequests() },
      { label: "К планированию", onClick: () => openDispatcherCandidates() },
      { label: "План визитов", onClick: () => openDispatcherPlan() },
    );
  }

  if (role === "stat") items.push({ label: "Статистика", onClick: () => openStatReports() });

  if (role === "admin") {
    items.push(
      { label: "Администрирование", onClick: () => openAdminUsers() },
      { label: "Заявки", onClick: () => openDispatcherRequests() },
      { label: "К планированию", onClick: () => openDispatcherCandidates() },
      { label: "План визитов", onClick: () => openDispatcherPlan() },
      { label: "Статистика", onClick: () => openStatReports() },
    );
  }

  els.nav.innerHTML = "";
  for (const it of items) {
    const b = document.createElement("button");
    b.className = "navbtn";
    b.textContent = it.label;
    b.addEventListener("click", () => {
      [...els.nav.querySelectorAll(".navbtn")].forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      closeSidebar();
      it.onClick();
    });
    els.nav.appendChild(b);
  }

  const first = els.nav.querySelector(".navbtn");
  if (first) first.click();
}

export async function openDashboard() {
  
  openView("dashboard", "Панель", "Главный экран системы.");
  renderQuickActions();

  const role = state.user?.role;
  const summaryEl = document.getElementById("summaryText");

  if (!summaryEl) return;

  if (role === "master") {
    summaryEl.textContent = "Загрузка сводки...";

    try {
      const res = await api.executorSummary();
      const s = res.summary || {};

      summaryEl.innerHTML = `
        Активных заданий: <b>${s.totalActive || 0}</b><br>
        Плановых: <b>${s.plannedCount || 0}</b><br>
        По заявкам: <b>${s.requestCount || 0}</b><br>
        Первичных: <b>${s.primaryCount || 0}</b><br>
        Выполнено сегодня: <b>${s.doneToday || 0}</b>
      `;
    } catch (e) {
      summaryEl.textContent = "Не удалось загрузить сводку.";
      console.error("executor summary error:", e);
    }
  } else {
    summaryEl.textContent = "Сводка для этой роли будет добавлена позже.";
  }
}

function renderQuickActions() {
  const role = state.user?.role;
  els.quickActions.innerHTML = "";

  const addAction = (label, fn) => {
    const btn = document.createElement("button");
    btn.className = "btn btn-primary";
    btn.textContent = label;
    btn.addEventListener("click", fn);
    els.quickActions.appendChild(btn);
  };

  if (role === "master") {
    addAction("Зафиксировать визит", openMasterVisit);
    addAction("Мой план визитов", openMasterMyVisits);
  } else if (role === "dispatcher") {
    addAction("Заявки", openDispatcherRequests);
    addAction("К планированию", openDispatcherCandidates);
    addAction("План визитов", openDispatcherPlan);
  } else if (role === "stat") {
    addAction("Статистика", openStatReports);
  } else if (role === "admin") {
    addAction("Администрирование", openAdminUsers);
    addAction("Заявки", openDispatcherRequests);
  }
}

/* ===== Master ===== */
export async function openMasterVisit() {
  openView("masterVisit", "Фиксация визита", "Выберите объект и оставьте комментарий.");

  state.selectedObject = null;
  els.objectSearch.value = "";
  els.searchResults.innerHTML = "";
  els.dispatcherNote.style.display = "none";
  els.visitComment.value = "";

  let searchToken = 0;

  els.objectSearch.oninput = debounce(async () => {
    const text = els.objectSearch.value.trim();
    els.searchResults.innerHTML = "";
    if (!text) return;

    const token = ++searchToken;

    let items = [];
    try {
      const res = await api.objectsSearch(text, 25);
      if (token !== searchToken) return;
      items = Array.isArray(res.items) ? res.items : [];
    } catch (e) {
      console.error("objectsSearch error:", e);
      return;
    }

    for (const o of items) {
      const div = document.createElement("div");
      div.className = "item";
      div.textContent = `${o.name} — ${o.city || "-"}, ${o.address || "-"}`;
      div.addEventListener("click", () => {
        state.selectedObject = o;
        els.objectSearch.value = div.textContent;
        els.searchResults.innerHTML = "";
        els.dispatcherNote.style.display = "block";

        els.dispatcherNote.innerHTML = `
        <b>Система:</b> ${o.system || "-"} • 
        <b>Категория:</b> ${o.category || "-"} • 
        <b>Группа:</b> ${o.group || "-"}
        
        <br><br>
        
        <b>Описание диспетчера:</b><br>
        ${o.description || "Описание отсутствует"}
        `;
      });
      els.searchResults.appendChild(div);
    }
  }, 250);
}

export async function submitVisit() {
  if (!state.selectedObject) throw new Error("Выберите объект");
  await api.visitsLogAppend({
    objectId: state.selectedObject.objectId,
    objectName: state.selectedObject.name,
    executor: state.user?.name || "",
    comment: els.visitComment.value || "",
  });
  toast("Визит записан в базу данных!");
  openDashboard();
}

export async function openMasterMyVisits() {
  openView("masterMyVisits", "Мой план", "План визитов по вашему исполнителю.");

  const res = await api.planList({ executor: state.user?.name || "" });
  const rows = res.rows || [];
  els.myVisitsTable.innerHTML = renderPlanTable(rows, { allowEditStatus:false });
}

/* ===== Dispatcher: Requests ===== */
export async function openDispatcherRequests() {
  await ensureObjectsLoaded();
  openView("dispatcherRequests", "Заявки (Requests)", "Создание/редактирование заявок. Удаление отключено.");

  await loadAndRenderRequests();

  const btnCreate = document.getElementById("btnCreateRequest");
  const btnReload = document.getElementById("btnReloadRequests");
  btnCreate.onclick = () => openRequestModalCreate();
  btnReload.onclick = () => loadAndRenderRequests();

  els.reqStatusFilter.onchange = () => loadAndRenderRequests();
  els.reqExecutorFilter.oninput = debounce(() => loadAndRenderRequests(), 250);
  els.reqSearchFilter.oninput = debounce(() => loadAndRenderRequests(), 250);
}

async function loadAndRenderRequests() {
  const status = els.reqStatusFilter.value || "";
  const executor = els.reqExecutorFilter.value.trim();
  const q = els.reqSearchFilter.value.trim();
  const res = await api.requestsList({ status, executor, q });
  state.requests = res.rows || [];
  els.requestsTable.innerHTML = renderRequestsTable(state.requests);
}

function renderRequestsTable(rows) {
  const wrap = document.getElementById("requestsTable");
  console.log("renderRequestsTable wrap:", wrap);
  console.log("renderRequestsTable rows:", rows);

  if (!wrap) return;

  const safeRows = Array.isArray(rows) ? rows : [];

  if (!safeRows.length) {
    wrap.innerHTML = `<div class="empty">Заявок пока нет</div>`;
    return;
  }

  const desktopTable = `
    <div class="table-wrap requests-desktop">
      <table class="data-table requests-table">
        <thead>
          <tr>
            <th>Дата</th>
            <th>Объект</th>
            <th>Описание</th>
            <th>Срочность</th>
            <th>Статус</th>
            <th>Принял</th>
            <th>Исполнитель</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          ${safeRows.map(r => `
            <tr data-request-id="${r.requestId}">
              <td>${escapeHtml(formatDateOnly(r.createdAt || ""))}</td>
              <td>${escapeHtml(r.objectName || "—")}</td>
              <td>${escapeHtml(r.description || "—")}</td>
              <td>
                <span class="badge urgency-${slugify(r.urgency || "none")}">
                  ${escapeHtml(r.urgency || "—")}
                </span>
              </td>
              <td>
                <span class="badge status-${slugify(r.status || "none")}">
                  ${escapeHtml(r.status || "—")}
                </span>
              </td>
              <td>${escapeHtml(r.acceptedBy || "—")}</td>
              <td>${escapeHtml(r.executor || "—")}</td>
              <td class="actions-cell">
                <button class="btn small" data-action="edit" data-id="${r.requestId}">Открыть</button>
                <button class="btn small primary" data-action="plan" data-id="${r.requestId}">В план</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  const mobileCards = `
    <div class="requests-mobile">
      ${safeRows.map(r => `
        <div class="request-card" data-request-id="${r.requestId}">
          <div class="request-card__title">${escapeHtml(r.objectName || "—")}</div>
          <div class="request-card__meta">
            <span>${escapeHtml(formatDateOnly(r.createdAt || ""))}</span>
            <span class="badge urgency-${slugify(r.urgency || "none")}">
              ${escapeHtml(r.urgency || "—")}
            </span>
            <span class="badge status-${slugify(r.status || "none")}">
              ${escapeHtml(r.status || "—")}
            </span>
          </div>
          <div class="request-card__desc">${escapeHtml(r.description || "—")}</div>
          <div class="request-card__row"><b>Принял:</b> ${escapeHtml(r.acceptedBy || "—")}</div>
          <div class="request-card__row"><b>Исполнитель:</b> ${escapeHtml(r.executor || "—")}</div>
          <div class="request-card__actions">
            <button class="btn small" data-action="edit" data-id="${r.requestId}">Открыть</button>
            <button class="btn small primary" data-action="plan" data-id="${r.requestId}">В план</button>
          </div>
        </div>
      `).join("")}
    </div>
  `;

  wrap.innerHTML = desktopTable + mobileCards;

  wrap.querySelectorAll("[data-action='edit']").forEach(btn => {
    btn.onclick = () => {
      const id = String(btn.dataset.id || "");
      const row = safeRows.find(x => String(x.requestId) === id);
      if (row) openRequestModalEdit(row);
    };
  });

  wrap.querySelectorAll("[data-action='plan']").forEach(btn => {
    btn.onclick = () => {
      const id = String(btn.dataset.id || "");
      const row = safeRows.find(x => String(x.requestId) === id);
      if (row) {
        console.log("plan from request", row);
        alert("Следующим шагом подключим перевод заявки в план");
      }
    };
  });
}

function formatDateOnly(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("ru-RU");
}

function slugify(v) {
  return String(v || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zа-яё0-9_-]/gi, "");
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDateOnly(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("ru-RU");
}

function slugify(v) {
  return String(v || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zа-яё0-9_-]/gi, "");
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function createPlanFromRequest(req) {
  const obj = state.objectsMap[req.objectId];
  const planDate = prompt("Дата планирования (YYYY-MM-DD):", dateOnly(new Date()));
  if (!planDate) return;

  const executor = prompt("Исполнитель (имя):", req.executor || "");
  if (executor === null) return;

  await api.planCreate({
    planDate,
    objectId: req.objectId,
    objectName: obj?.name || req.objectName || "",
    executor: executor || "",
    status: "Запланирован",
    doneDate: "",
    executorNote: "",
    sourceType: "request",
    sourceId: req.requestId,
  });

  toast("Добавлено в Visit_plan");
}

/* ===== Dispatcher: Candidates ===== */
export async function openDispatcherCandidates() {
  await ensureObjectsLoaded();
  openView("dispatcherCandidates", "К планированию", "Приоритетные объекты по активным заявкам и визитам месяца.");

  await loadAndRenderCandidates();

  const btnReload = document.getElementById("btnReloadCandidates");
  btnReload.onclick = () => loadAndRenderCandidates();
}

async function loadAndRenderCandidates() {
  const month = currentMonthISO();
  const res = await api.planningCandidates({ month });
  const rows = res.rows || [];
  els.candidatesTable.innerHTML = renderCandidatesTable(rows);
}

function renderCandidatesTable(rows) {
  const r = Array.isArray(rows) ? rows : [];
  if (!r.length) return `<div class="muted" style="padding:12px;">Нет данных</div>`;

  const tr = r.map(x => {
    const obj = state.objectsMap[x.objectId];
    const objLabel = obj ? `${obj.name} — ${obj.city}, ${obj.address}` : x.objectId;
    const last = x.lastVisitDate ? new Date(x.lastVisitDate).toLocaleString() : "";
    const active = x.activeRequestsCount || 0;
    const top = x.topRequestId ? `${x.topRequestId} (${x.topRequestStatus}${x.topRequestUrgency?`, ${x.topRequestUrgency}`:""})` : "";
    return `<tr>
      <td>${esc(objLabel)}</td>
      <td>${esc(obj?.system || "")}</td>
      <td>${esc(String(active))}</td>
      <td>${esc(top)}</td>
      <td>${esc(last)}</td>
      <td>
        <button class="btn btn-primary" data-action="addplan" data-oid="${escAttr(x.objectId)}">Добавить в план</button>
        <button class="btn btn-secondary" data-action="filterreq" data-oid="${escAttr(x.objectId)}">Заявки объекта</button>
      </td>
    </tr>`;
  }).join("");

  const html = `
    <table>
      <thead>
        <tr>
          <th>Объект</th>
          <th>Система</th>
          <th>Активные заявки</th>
          <th>Топ заявка</th>
          <th>Последний визит (в месяце)</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>${tr}</tbody>
    </table>
  `;

  setTimeout(() => {
    const root = els.candidatesTable;
    root.querySelectorAll("button[data-action]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const oid = btn.getAttribute("data-oid");
        const action = btn.getAttribute("data-action");
        if (action === "filterreq") {
          // jump to requests with object filter
          els.reqSearchFilter.value = "";
          els.reqExecutorFilter.value = "";
          els.reqStatusFilter.value = "";
          openDispatcherRequests().then(() => {
            // filter by objectId via search fallback (we do direct filter inside list later when API)
            const obj = state.objectsMap[oid];
            els.reqSearchFilter.value = obj?.name || oid;
            loadAndRenderRequests();
          });
        }
        if (action === "addplan") {
          const obj = state.objectsMap[oid];
          const planDate = prompt("Дата планирования (YYYY-MM-DD):", dateOnly(new Date()));
          if (!planDate) return;
          const executor = prompt("Исполнитель (имя):", "");
          if (executor === null) return;

          await api.planCreate({
            planDate,
            objectId: oid,
            objectName: obj?.name || "",
            executor: executor || "",
            status: "Запланирован",
            doneDate: "",
            executorNote: "",
            sourceType: "monthly_visit",
            sourceId: "",
          });
          toast("Добавлено в Visit_plan");
        }
      });
    });
  }, 0);

  return html;
}

/* ===== Dispatcher: Plan ===== */
export async function openDispatcherPlan() {
  await ensureObjectsLoaded();
  openView("dispatcherPlan", "План визитов (Visit_plan)", "Добавление/редактирование/удаление плана и статус выполнения.");

  await loadAndRenderPlan();

  const btnCreate = document.getElementById("btnCreatePlan");
  const btnReload = document.getElementById("btnReloadPlan");
  btnCreate.onclick = () => openPlanModalCreate();
  btnReload.onclick = () => loadAndRenderPlan();

  els.planExecutorFilter.oninput = debounce(() => loadAndRenderPlan(), 250);
  els.planStatusFilter.oninput = debounce(() => loadAndRenderPlan(), 250);
  els.planSearchFilter.oninput = debounce(() => loadAndRenderPlan(), 250);
}

async function loadAndRenderPlan() {
  const executor = els.planExecutorFilter.value.trim();
  const status = els.planStatusFilter.value.trim();
  const q = els.planSearchFilter.value.trim();
  const res = await api.planList({ executor, status, q });
  state.plan = res.rows || [];
  els.planTable.innerHTML = renderPlanTable(state.plan, { allowEditStatus:true });
}

function renderPlanTable(rows, { allowEditStatus }) {
  const allRows = Array.isArray(rows) ? rows : [];

  const filteredRows = allowEditStatus
    ? allRows.filter(x => {
        const executorNeedle = (els.planExecutorFilter?.value || "").trim().toLowerCase();
        const statusNeedle = (els.planStatusFilter?.value || "").trim().toLowerCase();
        const searchNeedle = (els.planSearchFilter?.value || "").trim().toLowerCase();
        const hay = `${x.object || x.objectName || ""} ${x.city || ""} ${x.address || ""} ${x.system || ""}`.toLowerCase();

        if (executorNeedle && !(x.executor || "").toLowerCase().includes(executorNeedle)) return false;
        if (statusNeedle && !(x.status || "").toLowerCase().includes(statusNeedle)) return false;
        if (searchNeedle && !hay.includes(searchNeedle)) return false;
        return true;
      })
    : allRows;

  if (!filteredRows.length) return `<div class="muted" style="padding:12px;">Нет данных</div>`;

  if (!allowEditStatus) {
    const cards = filteredRows.map(x => {
      const objectTitle = x.object || x.objectName || x.objectId || "—";
      const objectMeta = [x.city, x.address].filter(Boolean).join(", ");
      const system = x.system || "—";
      const planDate = formatPlanDate(x.date || x.planDate || "");
      const workType = x.workType || x.type || "—";
      const comment = (x.description || "").trim();

      return `
        <article class="master-plan-card">
          <div class="master-plan-title">${esc(objectTitle)}</div>
          <div class="master-plan-subtitle">${esc(objectMeta || "Населённый пункт и адрес не указаны")}</div>
          <div class="master-plan-line"><span class="master-plan-label">Тип системы:</span> <span>${esc(system)}</span></div>
          <div class="master-plan-line"><span class="master-plan-label">Дата планирования:</span> <span>${esc(planDate || "—")}</span></div>
          <div class="master-plan-line"><span class="master-plan-label">Тип работ:</span> <span>${esc(workType)}</span></div>
          <div class="master-plan-line master-plan-comment"><span class="master-plan-label">Комментарий диспетчера:</span> <span>${esc(comment || "—")}</span></div>
        </article>
      `;
    }).join("");

    return `<div class="master-plan-list">${cards}</div>`;
  }

  const tr = filteredRows.map(x => {
    const obj = state.objectsMap[x.objectId];
    const objectTitle = x.object || x.objectName || obj?.name || x.objectId || "—";
    const objectMeta = [x.city || obj?.city, x.address || obj?.address].filter(Boolean).join(", ");
    return `<tr>
      <td>${esc(x.planId || "")}</td>
      <td>${esc(formatPlanDate(x.planDate || x.date || ""))}</td>
      <td class="col-object">
        <div class="plan-object-title">${esc(objectTitle)}</div>
        <span class="plan-object-meta">${esc(objectMeta || "—")}</span>
      </td>
      <td>${esc(x.executor || "")}</td>
      <td>${esc(x.status || "")}</td>
      <td>${esc(formatPlanDate(x.doneDate || ""))}</td>
      <td class="col-comment"><div class="plan-comment">${esc(x.executorNote || x.description || "")}</div></td>
      <td>
        ${allowEditStatus ? `<button class="btn btn-secondary" data-action="edit" data-id="${escAttr(x.planId)}">Редактировать</button>` : ""}
        ${allowEditStatus ? `<button class="btn" data-action="del" data-id="${escAttr(x.planId)}">Удалить</button>` : ""}
      </td>
    </tr>`;
  }).join("");

  const html = `
    <table>
      <thead>
        <tr>
          <th style="width:8%;">ID</th>
          <th style="width:12%;">Дата планирования</th>
          <th style="width:28%;">Объект</th>
          <th style="width:12%;">Исполнитель</th>
          <th style="width:12%;">Статус</th>
          <th style="width:12%;">Дата выполнения</th>
          <th style="width:16%;">Описание</th>
          <th style="width:15%;">Действия</th>
        </tr>
      </thead>
      <tbody>${tr}</tbody>
    </table>
  `;

  if (allowEditStatus) {
    setTimeout(() => {
      const root = els.planTable;
      root.querySelectorAll("button[data-action]").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-id");
          const action = btn.getAttribute("data-action");
          const item = state.plan.find(z => String(z.planId) === String(id));
          if (!item) return;

          if (action === "edit") openPlanModalEdit(item);
          if (action === "del") {
            const ok = confirm("Удалить запись из Visit_plan? (заявки не удаляются)");
            if (!ok) return;
            await api.planDelete({ planId: item.planId });
            toast("Удалено из Visit_plan");
            await loadAndRenderPlan();
          }
        });
      });
    }, 0);
  }

  return html;
}

/* ===== Stat/Admin ===== */
export function openStatReports() {
  openView("statReports", "Статистика", "Добавим позже (KPI/отчёты).");
}
export function openAdminUsers() {
  openView("adminUsers", "Администрирование", "Добавим позже (пользователи/роли).");
}

function formatDateValue(value) {
  if (!value) return "—";
  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return "—";
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(raw) || /^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("ru-RU");
}

function formatWorkTypeLabel(item) {
  const raw = item?.workType || item?.type || item?.visitType || item?.jobType || item?.sourceType || "";
  const value = String(raw).trim().toLowerCase();
  if (!value) return "Не указан";
  if (value === "request" || value === "по заявке") return "По заявке";
  if (value === "monthly_visit" || value === "plan" || value === "planned" || value === "плановый") return "Плановое";
  if (value === "manual") return "Ручное";
  return String(raw);
}

function formatDispatcherComment(item, obj) {
  const direct = [
    item?.dispatcherComment,
    item?.dispatcherNote,
    item?.comment,
    item?.description,
    item?.requestDescription,
    item?.sourceComment,
    obj?.description,
  ].find(v => String(v || "").trim());
  return direct ? String(direct).trim() : "";
}

function applyResponsiveLayout() {
  const w = window.innerWidth || document.documentElement.clientWidth || 0;
  let mode = "mobile";
  if (w >= 1536) mode = "desktop-wide";
  else if (w >= 1280) mode = "desktop";
  else if (w >= 981) mode = "laptop";
  document.body.setAttribute("data-viewport", mode);
}

function formatPlanDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

/* ===== Modal helpers ===== */
function openModal({ title, bodyHtml, onOk }) {
  els.modalTitle.textContent = title;
  els.modalBody.innerHTML = bodyHtml;
  els.modalOverlay.style.display = "flex";

  const okHandler = async () => {
    try {
      const result = await onOk();
      closeModal();
      return result;
    } catch (e) {
      alert(e?.message || "Ошибка");
    }
  };

  els.modalOk.onclick = okHandler;
}

function closeModal() {
  els.modalOverlay.style.display = "none";
  els.modalTitle.textContent = "";
  els.modalBody.innerHTML = "";
  els.modalOk.onclick = null;
}

/* ===== Request modals ===== */
async function openRequestModalCreate() {
  state.requestSelectedObject = null;

  openModal({
    title: "Новая заявка",
    bodyHtml: `
      <div class="form-grid">
        <label class="label">Поиск объекта</label>
        <input id="req_object_search" class="input" type="text" placeholder="Введите название, адрес, город..." />
        <div id="req_search_results" class="search-results"></div>

        <label class="label">Выбранный объект</label>
        <input id="req_object_label" class="input" type="text" readonly placeholder="Объект не выбран" />

        <label class="label">Описание</label>
        <textarea id="req_desc" class="textarea" rows="4" placeholder="Опишите проблему"></textarea>

        <label class="label">Срочность</label>
        <select id="req_urgency" class="input">
          <option value="Низкая">Низкая</option>
          <option value="Средняя" selected>Средняя</option>
          <option value="Срочная">Срочная</option>
        </select>

        <label class="label">Исполнитель</label>
        <input id="req_executor" class="input" type="text" placeholder="Необязательно" />
      </div>
    `,
    onOk: async () => {
      const selected = state.requestSelectedObject;
      const descEl = document.getElementById("req_desc");
      const urgencyEl = document.getElementById("req_urgency");
      const executorEl = document.getElementById("req_executor");

      const description = descEl?.value.trim() || "";
      const urgency = urgencyEl?.value || "Средняя";
      const executor = executorEl?.value.trim() || "";

      if (!selected?.objectId) {
        alert("Выберите объект");
        return false;
      }

      if (!description) {
        alert("Введите описание заявки");
        return false;
      }

      await api.requestsCreate({
        objectId: Number(selected.objectId),
        objectName: selected.name,
        description,
        urgency,
        status: "Новая",
        acceptedBy: state.user?.name || "",
        executor
      });

      toast("Заявка создана");
      await loadAndRenderRequests();
      state.requestSelectedObject = null;
      return true;
    }
  });

  const elsReq = {
    search: document.getElementById("req_object_search"),
    results: document.getElementById("req_search_results"),
    label: document.getElementById("req_object_label")
  };

  if (!elsReq.search || !elsReq.results || !elsReq.label) {
    console.error("Request modal elements not found", elsReq);
    return;
  }

  let searchToken = 0;

  elsReq.search.oninput = debounce(async () => {
    const text = elsReq.search.value.trim();
    elsReq.results.innerHTML = "";
    if (!text) return;

    const token = ++searchToken;

    let items = [];
    try {
      const res = await api.objectsSearchDispatcher(text, 25);
      if (token !== searchToken) return;
      items = Array.isArray(res.items) ? res.items : [];
    } catch (e) {
      console.error("objectsSearchDispatcher error:", e);
      return;
    }

    for (const o of items) {
      const div = document.createElement("div");
      div.className = "item";
      div.textContent = `${o.name} — ${o.city || "-"}, ${o.address || "-"}`;
      div.addEventListener("click", () => {
        state.requestSelectedObject = o;
        elsReq.label.value = `${o.name} — ${o.city || "-"}, ${o.address || "-"}`;
        elsReq.search.value = "";
        elsReq.results.innerHTML = "";
      });
      elsReq.results.appendChild(div);
    }
  }, 250);
}

function openRequestModalEdit(req) {
  openModal({
    title: `Редактировать заявку ${req.requestId}`,
    bodyHtml: `
      <div class="muted">Удаление заявок запрещено. Можно менять статус/исполнителя/описание/срочность.</div>

      <label class="label">Статус</label>
      <select id="m_status" class="input">
        ${["Новая","В работе","Ожидает","Выполнена"].map(s=>`<option ${req.status===s?"selected":""}>${s}</option>`).join("")}
      </select>

      <label class="label">Срочность</label>
      <select id="m_urg" class="input">
        ${["Низкая","Средняя","Высокая"].map(s=>`<option ${req.urgency===s?"selected":""}>${s}</option>`).join("")}
      </select>

      <label class="label">Исполнитель</label>
      <input id="m_exec" class="input" value="${escAttr(req.executor||"")}" />

      <label class="label">Описание</label>
      <textarea id="m_desc" class="textarea">${esc(req.description||"")}</textarea>

      <label class="label">Принял вызов</label>
      <input id="m_acc" class="input" value="${escAttr(req.acceptedBy||"")}" />
    `,
    onOk: async () => {
      await api.requestsUpdate({
        requestId: req.requestId,
        patch: {
          status: document.getElementById("m_status").value,
          urgency: document.getElementById("m_urg").value,
          executor: document.getElementById("m_exec").value,
          description: document.getElementById("m_desc").value,
          acceptedBy: document.getElementById("m_acc").value,
        }
      });
      toast("Заявка обновлена");
      await loadAndRenderRequests();
    }
  });
}

/* ===== Plan modals ===== */
async function openPlanModalCreate() {
  await ensureObjectsLoaded();
  const options = state.objects
    .filter(o => o.active !== false)
    .map(o => `<option value="${escAttr(o.objectId)}">${esc(o.name)} — ${esc(o.city)}, ${esc(o.address)}</option>`)
    .join("");

  openModal({
    title: "Добавить в Visit_plan",
    bodyHtml: `
      <label class="label">Дата планирования</label>
      <input id="m_pdate" class="input" placeholder="YYYY-MM-DD" value="${escAttr(dateOnly(new Date()))}"/>

      <label class="label">Объект</label>
      <select id="m_objectId" class="input">${options}</select>

      <label class="label">Исполнитель</label>
      <input id="m_exec" class="input" placeholder="Имя исполнителя" />

      <label class="label">Статус</label>
      <input id="m_status" class="input" value="Запланирован" />

      <label class="label">Дата выполнения</label>
      <input id="m_done" class="input" placeholder="YYYY-MM-DD (если выполнено)" />

      <label class="label">Описание от исполнителя</label>
      <textarea id="m_note" class="textarea" placeholder="Если есть"></textarea>
    `,
    onOk: async () => {
      const objectId = document.getElementById("m_objectId").value;
      const obj = state.objectsMap[objectId];
      await api.planCreate({
        planDate: document.getElementById("m_pdate").value,
        objectId,
        objectName: obj?.name || "",
        executor: document.getElementById("m_exec").value || "",
        status: document.getElementById("m_status").value || "Запланирован",
        doneDate: document.getElementById("m_done").value || "",
        executorNote: document.getElementById("m_note").value || "",
        sourceType: "manual",
        sourceId: "",
      });
      toast("Запись добавлена");
      await loadAndRenderPlan();
    }
  });
}

function openPlanModalEdit(item) {
  openModal({
    title: `Редактировать план ${item.planId}`,
    bodyHtml: `
      <label class="label">Дата планирования</label>
      <input id="m_pdate" class="input" value="${escAttr(item.planDate||"")}" />

      <label class="label">Исполнитель</label>
      <input id="m_exec" class="input" value="${escAttr(item.executor||"")}" />

      <label class="label">Статус</label>
      <input id="m_status" class="input" value="${escAttr(item.status||"")}" />

      <label class="label">Дата выполнения</label>
      <input id="m_done" class="input" value="${escAttr(item.doneDate||"")}" />

      <label class="label">Описание от исполнителя</label>
      <textarea id="m_note" class="textarea">${esc(item.executorNote||"")}</textarea>
    `,
    onOk: async () => {
      await api.planUpdate({
        planId: item.planId,
        patch: {
          planDate: document.getElementById("m_pdate").value,
          executor: document.getElementById("m_exec").value,
          status: document.getElementById("m_status").value,
          doneDate: document.getElementById("m_done").value,
          executorNote: document.getElementById("m_note").value,
        }
      });
      toast("План обновлён");
      await loadAndRenderPlan();
    }
  });
}

/* ===== utils ===== */
function esc(s) {
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function escAttr(s){ return esc(s).replaceAll("\n"," "); }

function debounce(fn, ms){
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function dateOnly(d){
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth()+1).padStart(2,"0");
  const day = String(dt.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

function currentMonthISO(){
  const dt = new Date();
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`;

}






