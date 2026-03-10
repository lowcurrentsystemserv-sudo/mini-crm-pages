import { state } from "./state.js";
import { api } from "./api.js";

const LS_TOKEN = "mcc_token";
const LS_USER = "mcc_user";

export function loadSession() {
  try {
    const token = localStorage.getItem(LS_TOKEN);
    const user = JSON.parse(localStorage.getItem(LS_USER) || "null");
    if (token && user) {
      state.token = token;
      state.user = user;
      return true;
    }
  } catch {}
  return false;
}

export function saveSession() {
  if (!state.token || !state.user) return;
  localStorage.setItem(LS_TOKEN, state.token);
  localStorage.setItem(LS_USER, JSON.stringify(state.user));
}

export function clearSession() {
  state.token = null;
  state.user = null;
  localStorage.removeItem(LS_TOKEN);
  localStorage.removeItem(LS_USER);
}

import { showAppLoader, hideAppLoader } from "./ui.js";

export async function loginWithCredentials(login, password, roleOverride) {

  try {

    showAppLoader("Авторизация...");

    const res = await api.login({ login, password, role: roleOverride });

    if (!res?.ok && res?.status !== "success") {
      throw new Error(res?.error || "Неверный логин/пароль");
    }

    state.token = true;

    state.user = {
      name: res.name,
      role: res.role
    };

    saveSession();

    return state.user;

  } finally {

    hideAppLoader();

  }

}
