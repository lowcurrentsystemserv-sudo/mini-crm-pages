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

  objectsSearch: async (q, limit = 20) => {
    const r = await httpGet(`/objects-search?q=${encodeURIComponent(q)}&limit=${limit}`);
    return { items: Array.isArray(r.items) ? r.items : [] };
  },

  // ✅ UI ожидает: api.planList({executor}) -> { rows:[...] }
  // executor параметр игнорируем, т.к. сервер берёт пользователя из cookie
  
  planList: async () => {
    const r = await httpGet("/executor-plan");
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

  executorSummary: () => httpGet("/executor-summary"),

  suggestWorkType: (objectId) => httpPost("/suggest-work-type", { objectId }),

  // (на всякий случай оставим старые имена, чтобы нигде не упало)
  executorPlan: async () => (await httpGet("/executor-plan")).rows || [],
  saveVisit: async (data) => httpPost("/save-visit", data),
};






