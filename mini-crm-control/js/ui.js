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
  loginError: document.getElementById("loginError"),

  userName: document.getElementById("userName"),
  userRole: document.getElementById("userRole"),
  userAvatar: document.getElementById("userAvatar"),
  nav: document.getElementById("nav"),
  apiStatus: document.getElementById("apiStatus"),

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

export function setApiStatus() {
  const s = CONFIG.USE_MOCK ? "MOCK" : (CONFIG.API_BASE_URL ? "LIVE" : "OFF");
  els.apiStatus.textContent = `API: ${s}`;
}

export function showScreen(name) {
  screens.login.style.display = name === "login" ? "block" : "none";
  screens.app.style.display = name === "app" ? "block" : "none";
  els.btnLogout.style.display = name === "app" ? "inline-flex" : "none";
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

  const savedTheme = localStorage.getItem("mcc_theme");
  if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);
  else document.documentElement.setAttribute("data-theme", "dark");

  // modal close
  els.modalClose.addEventListener("click", closeModal);
  els.modalCancel.addEventListener("click", closeModal);
  els.modalOverlay.addEventListener("click", (e) => {
    if (e.target === els.modalOverlay) closeModal();
  });
}

export async function ensureObjectsLoaded() {
  if (state.objects?.length) return;

  let data = { objects: [], plan: [] };

  try {
    data = await api.bootstrap();
  } catch (e) {
    console.warn("bootstrap failed, fallback to objectsList()", e);
  }

  let objects = Array.isArray(data.objects) ? data.objects : [];

  if (!objects.length) {
    const res = await api.objectsList();
    objects = res.objects || [];
  }

  state.objects = objects.map(o => ({
    objectId: String(o.objectId ?? o.id ?? ""),
    name: o.name ?? "",
    system: o.system ?? "",
    city: o.city ?? "",
    address: o.address ?? "",
    category: o.category ?? "",
    group: o.group ?? "",
    active: o.active !== false && o.active !== "Архив" && o.active !== "Нет",
    description: o.description ?? ""
  }));

  state.objectsMap = {};
  for (const o of state.objects) {
    state.objectsMap[o.objectId] = o;
  }

  state.plan = Array.isArray(data.plan) ? data.plan : [];
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
      { label: "Мой план (Visit_plan)", onClick: () => openMasterMyVisits() },
    );
  }

  if (role === "dispatcher") {
    items.push(
      { label: "Заявки (Requests)", onClick: () => openDispatcherRequests() },
      { label: "К планированию", onClick: () => openDispatcherCandidates() },
      { label: "План визитов (Visit_plan)", onClick: () => openDispatcherPlan() },
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
      it.onClick();
    });
    els.nav.appendChild(b);
  }

  const first = els.nav.querySelector(".navbtn");
  if (first) first.click();
}

export async function openDashboard() {
  openView("dashboard", "Панель", "Главный экран системы.");

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
  renderQuickActions();
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
  await ensureObjectsLoaded();
  openView("masterVisit", "Фиксация визита", "Выберите объект и оставьте комментарий.");

  state.selectedObject = null;
  els.objectSearch.value = "";
  els.searchResults.innerHTML = "";
  els.dispatcherNote.style.display = "none";
  els.visitComment.value = "";

  // search across active objects
  const activeObjects = state.objects.filter(o => o.active !== false);
  state.plannedObjects = activeObjects;

  els.objectSearch.oninput = () => {
    const text = els.objectSearch.value.trim().toLowerCase();
    els.searchResults.innerHTML = "";
    if (!text) return;

    const items = state.plannedObjects
      .filter(o => `${o.name} ${o.city} ${o.address} ${o.system} ${o.category} ${o.group}`.toLowerCase().includes(text))
      .slice(0, 25);

    for (const o of items) {
      const div = document.createElement("div");
      div.className = "item";
      div.textContent = `${o.name} — ${o.city}, ${o.address}`;
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
  };
}

export async function submitVisit() {
  if (!state.selectedObject) throw new Error("Выберите объект");
  await api.visitsLogAppend({
    objectId: state.selectedObject.objectId,
    objectName: state.selectedObject.name,
    executor: state.user?.name || "",
    comment: els.visitComment.value || "",
  });
  toast("Визит записан в Visits_log");
  openDashboard();
}

export async function openMasterMyVisits() {
  await ensureObjectsLoaded();
  openView("masterMyVisits", "Мой план (Visit_plan)", "План визитов по вашему исполнителю.");

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
  const r = Array.isArray(rows) ? rows : [];
  if (!r.length) return `<div class="muted" style="padding:12px;">Нет данных</div>`;

  const tr = r.map(x => {
    const obj = state.objectsMap[x.objectId];
    const objLabel = obj ? `${obj.name} — ${obj.city}, ${obj.address}` : (x.objectName || x.objectId);
    const created = x.createdAt ? new Date(x.createdAt).toLocaleString() : (x.createdAt || "");
    return `<tr>
      <td>${esc(x.requestId || "")}</td>
      <td>${esc(created)}</td>
      <td>${esc(objLabel)}</td>
      <td>${esc(x.urgency || "")}</td>
      <td>${esc(x.status || "")}</td>
      <td>${esc(x.acceptedBy || "")}</td>
      <td>${esc(x.executor || "")}</td>
      <td>
        <button class="btn btn-secondary" data-action="edit" data-id="${escAttr(x.requestId)}">Редактировать</button>
        <button class="btn btn-primary" data-action="toplan" data-id="${escAttr(x.requestId)}">В план</button>
      </td>
    </tr>`;
  }).join("");

  const html = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Дата поступления</th>
          <th>Объект</th>
          <th>Срочность</th>
          <th>Статус</th>
          <th>Принял вызов</th>
          <th>Исполнитель</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>${tr}</tbody>
    </table>
  `;

  // attach events after render
  setTimeout(() => {
    const root = els.requestsTable;
    root.querySelectorAll("button[data-action]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        const action = btn.getAttribute("data-action");
        const req = state.requests.find(z => z.requestId === id);
        if (!req) return;

        if (action === "edit") openRequestModalEdit(req);
        if (action === "toplan") await createPlanFromRequest(req);
      });
    });
  }, 0);

  return html;
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
  const r = Array.isArray(rows) ? rows : [];
  if (!r.length) return `<div class="muted" style="padding:12px;">Нет данных</div>`;

  const tr = r.map(x => {
    const obj = state.objectsMap[x.objectId];
    const objLabel = obj ? `${obj.name} — ${obj.city}, ${obj.address}` : (x.objectName || x.objectId);
    return `<tr>
      <td>${esc(x.planId || "")}</td>
      <td>${esc(x.planDate || "")}</td>
      <td>${esc(objLabel)}</td>
      <td>${esc(x.executor || "")}</td>
      <td>${esc(x.status || "")}</td>
      <td>${esc(x.doneDate || "")}</td>
      <td>${esc(x.executorNote || "")}</td>
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
          <th>ID</th>
          <th>Дата планирования</th>
          <th>Объект</th>
          <th>Исполнитель</th>
          <th>Статус</th>
          <th>Дата выполнения</th>
          <th>Описание от исполнителя</th>
          <th>Действия</th>
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
          const item = state.plan.find(z => z.planId === id);
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
  await ensureObjectsLoaded();
  const options = state.objects
    .filter(o => o.active !== false)
    .map(o => `<option value="${escAttr(o.objectId)}">${esc(o.name)} — ${esc(o.city)}, ${esc(o.address)}</option>`)
    .join("");

  openModal({
    title: "Новая заявка (Requests)",
    bodyHtml: `
      <label class="label">Объект</label>
      <select id="m_objectId" class="input">${options}</select>

      <label class="label">Описание</label>
      <textarea id="m_desc" class="textarea" placeholder="Описание заявки"></textarea>

      <label class="label">Срочность</label>
      <select id="m_urg" class="input">
        <option>Низкая</option>
        <option selected>Средняя</option>
        <option>Высокая</option>
      </select>

      <label class="label">Статус</label>
      <select id="m_status" class="input">
        <option selected>Новая</option>
        <option>В работе</option>
        <option>Ожидает</option>
        <option>Выполнена</option>
      </select>

      <label class="label">Принял вызов</label>
      <input id="m_acc" class="input" placeholder="Имя диспетчера" value="${escAttr(state.user?.name || "")}"/>

      <label class="label">Исполнитель</label>
      <input id="m_exec" class="input" placeholder="Имя исполнителя" />
    `,
    onOk: async () => {
      const objectId = document.getElementById("m_objectId").value;
      const obj = state.objectsMap[objectId];
      await api.requestsCreate({
        objectId,
        objectName: obj?.name || "",
        description: document.getElementById("m_desc").value || "",
        urgency: document.getElementById("m_urg").value || "Средняя",
        status: document.getElementById("m_status").value || "Новая",
        acceptedBy: document.getElementById("m_acc").value || "",
        executor: document.getElementById("m_exec").value || "",
      });
      toast("Заявка создана");
      await loadAndRenderRequests();
    }
  });
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




