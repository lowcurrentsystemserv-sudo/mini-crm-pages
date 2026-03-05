import { CONFIG } from "./config.js";

async function httpGet(path) {

  const res = await fetch(CONFIG.API_BASE_URL + path,{
    credentials:"include"
  });

  const json = await res.json();

  if(!res.ok) throw new Error(json?.error || "API error");

  return json;
}

async function httpPost(path,data){

  const res = await fetch(CONFIG.API_BASE_URL + path,{
    method:"POST",
    credentials:"include",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify(data)
  });

  const json = await res.json();

  if(!res.ok) throw new Error(json?.error || "API error");

  return json;
}

export const api = {

  login:(data)=>httpPost("/login",data),

  me:()=>httpGet("/me"),

  plannedObjects:()=>httpGet("/planned-objects"),

  // ДОБАВЬ ЭТО
  objectsList:()=>httpGet("/planned-objects"),

  executorPlan:()=>httpGet("/executor-plan"),

  saveVisit:(data)=>httpPost("/save-visit",data)

};

