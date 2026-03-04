import { CONFIG } from "./config.js";

async function httpGet(path) {
  const res = await fetch(CONFIG.API_BASE_URL + path, {
    method: "GET",
    credentials: "include"
  });

  const json = await res.json().catch(()=>null);

  if (!res.ok) {
    throw new Error(json?.error || "API error");
  }

  return json;
}

async function httpPost(path, body) {
  const res = await fetch(CONFIG.API_BASE_URL + path, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body || {})
  });

  const json = await res.json().catch(()=>null);

  if (!res.ok) {
    throw new Error(json?.error || "API error");
  }

  return json;
}

export const api = {

  async login(data) {
    return httpPost("/login", data);
  },

  async me() {
    return httpGet("/me");
  },

  async plannedObjects() {
    return httpGet("/planned-objects");
  },

  async executorPlan() {
    return httpGet("/executor-plan");
  },

  async saveVisit(data) {
    return httpPost("/save-visit", data);
  }

};