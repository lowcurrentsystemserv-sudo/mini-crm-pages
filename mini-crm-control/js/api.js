import { CONFIG } from "./config.js";

async function httpGet(path) {
  const res = await fetch(CONFIG.API_BASE_URL + path, {
    method: "GET",
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "API error");
  return data;
}

async function httpPost(path, body) {
  const res = await fetch(CONFIG.API_BASE_URL + path, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "API error");
  return data;
}

function mapPlannedItemToObject(o) {
  // o из /api/planned-objects: {id,name,system,city,address,category,group,description}

  return {
    objectId: String(o.id ?? ""),     // UI ждёт objectId
    name: o.name ?? "",
    system: o.system ?? "",
    city: o.city ?? "",
    address: o.address ?? "",
    category: o.category ?? "",
    group: o.group ?? "",
    active: o.active !== "Архив" && o.active !== "Нет",
    description: o.description ?? ""
  };
}

export const api = {
  // Auth
  login: (data) => httpPost("/login", data),
  me: () => httpGet("/me"),

  // ✅ UI ожидает: { objects: [...] }
  objectsList: async () => {
    const r = await httpGet("/planned-objects"); // {ok:true, items:[...]}
    const items = Array.isArray(r.items) ? r.items : [];
    return { objects: items.map(mapPlannedItemToObject) };
  },

  // ✅ UI ожидает: api.planList({executor}) -> { rows:[...] }
  // executor параметр игнорируем, т.к. сервер берёт пользователя из cookie
  planList: async () => {
    const r = await httpGet("/executor-plan"); // {ok:true, rows:[...]}
    return { rows: Array.isArray(r.rows) ? r.rows : [] };
  },

  // ✅ UI вызывает visitsLogAppend(), не saveVisit()
  // Под капотом у нас /api/save-visit
  visitsLogAppend: async ({ objectId, objectName, comment }) => {
    const r = await httpPost("/save-visit", {
      objectId,
      objectName,
      comment,
    });
    // твой endpoint возвращает {"ok":true}
    if (r.ok !== true) throw new Error(r.error || "Не удалось сохранить визит");
    return r;
  },

  //ускоряем процесс авторизации и подгруз данных

  bootstrap: async () => {
    const r = await httpGet("/bootstrap");
    return r;
  },

  // (на всякий случай оставим старые имена, чтобы нигде не упало)
  plannedObjects: async () => (await httpGet("/planned-objects")).items || [],
  executorPlan: async () => (await httpGet("/executor-plan")).rows || [],
  saveVisit: async (data) => httpPost("/save-visit", data),
};


