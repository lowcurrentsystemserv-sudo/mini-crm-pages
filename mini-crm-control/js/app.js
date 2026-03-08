import { loadSession, loginWithCredentials } from "./auth.js";
import {
  bindGlobalUI,
  showScreen,
  setUserUI,
  buildNav,
  setApiStatus,
  clearError,
  showError,
  submitVisit,
  openMasterMyVisits,
  toast,
} from "./ui.js";
import { CONFIG } from "./config.js";

bindGlobalUI();
setApiStatus();

const btnLogin = document.getElementById("btnLogin");
const btnDemo = document.getElementById("btnDemo");
const loginInput = document.getElementById("loginInput");
const passwordInput = document.getElementById("passwordInput");
const btnSubmitVisit = document.getElementById("btnSubmitVisit");
const btnBackFromVisit = document.getElementById("btnBackFromVisit");
const btnRefreshMyVisits = document.getElementById("btnRefreshMyVisits");

function boot() {
  const has = loadSession();
  if (has) {
    showScreen("app");
    setUserUI();
    buildNav();
  } else {
    showScreen("login");
  }
}

btnLogin.addEventListener("click", async () => {
  clearError();
  try {
    const l = loginInput.value.trim();
    const p = passwordInput.value;
    if (!l || !p) throw new Error("Введите логин и пароль");
    await loginWithCredentials(l, p);
    showScreen("app");
    setUserUI();
    buildNav();
  } catch (e) {
    showError(e?.message || "Ошибка входа");
  }
});

btnDemo.addEventListener("click", async () => {
  clearError();
  try {
    if (!CONFIG.USE_MOCK) throw new Error("Эта функция пока не доступна и пока еще находиться в разработке!");
    const roles = ["master", "dispatcher", "stat", "admin"];
    const last = localStorage.getItem("mcc_demo_role") || "master";
    const next = roles[(roles.indexOf(last) + 1) % roles.length];
    localStorage.setItem("mcc_demo_role", next);

    await loginWithCredentials(next.toUpperCase(), "demo", next);
    showScreen("app");
    setUserUI();
    buildNav();
    toast("Демо роль: " + next);
  } catch (e) {
    showError(e?.message || "Ошибка демо");
  }
});

btnSubmitVisit?.addEventListener("click", async () => {
  try { await submitVisit(); }
  catch (e) { alert(e?.message || "Ошибка"); }
});

btnBackFromVisit?.addEventListener("click", () => {
  const firstNav = document.querySelector("#nav .navbtn");
  if (firstNav) firstNav.click();
});

btnRefreshMyVisits?.addEventListener("click", async () => {
  try { await openMasterMyVisits(); }
  catch (e) { alert(e?.message || "Ошибка"); }
});

document.addEventListener("keydown", (e) => {
  const loginVisible = document.getElementById("screen-login").style.display !== "none";
  if (e.key === "Enter" && loginVisible) btnLogin.click();
});


boot();
