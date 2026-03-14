import { json, sbFetch } from "../../_lib/supabase.js";
import { requireSession } from "../../_lib/session.js";

export async function onRequestPost({ request, env }) {
  const session = await requireSession(request);
  if (!session.ok) return session.resp;

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const month = normalizeMonth(body.month || getMonthKey(new Date()));
  if (!month) {
    return json({ ok: false, error: "Некорректный month, нужен формат YYYY-MM" }, 400);
  }

  const workDays = getWorkDaysForMonth(month);
  const maxPerDay = Number(body.maxPerDay || 4);

  if (!workDays.length) {
    return json({ ok: false, error: "Нет рабочих дней для месяца" }, 400);
  }

  // 1. Объекты
  const objectsRes = await sbFetch(
    env,
    `objects?select=id,name,system,city,address,category,group_name,status&order=group_name.asc,name.asc`
  );

  if (!objectsRes.ok) {
    return json({ ok: false, step: "objectsRes", error: objectsRes.data }, 500);
  }

  const allObjects = (objectsRes.data || []).filter(o => isObjectActive(o));

  // 2. Визиты за месяц
  const monthStart = `${month}-01`;
  const monthEnd = getMonthEnd(month);

  const logRes = await sbFetch(
    env,
    `visits_log?select=id,object_id,created_date&created_date=gte.${monthStart}&created_date=lte.${monthEnd}`
  );

  if (!logRes.ok) {
    return json({ ok: false, step: "logRes", error: logRes.data }, 500);
  }

  // 3. Уже существующий план на месяц
  const planRes = await sbFetch(
    env,
    `visit_plan?select=id,object_id,status,plan_date&plan_date=gte.${monthStart}&plan_date=lte.${monthEnd}`
  );

  if (!planRes.ok) {
    return json({ ok: false, step: "planRes", error: planRes.data }, 500);
  }

  const visitedSet = new Set(
    (logRes.data || []).map(v => String(v.object_id)).filter(Boolean)
  );

  const plannedSet = new Set(
    (planRes.data || [])
      .filter(v => ["Запланирован", "Выполнено"].includes(String(v.status || "")))
      .map(v => String(v.object_id))
      .filter(Boolean)
  );

  // 4. Кандидаты
  const candidates = allObjects
    .filter(obj => {
      const id = String(obj.id);
      return !visitedSet.has(id) && !plannedSet.has(id);
    })
    .sort(compareObjectsForPlan);

  const capacity = workDays.length * maxPerDay;
  const planItems = distributeObjects(candidates, workDays, maxPerDay, month);

  if (!planItems.length) {
    return json({
      ok: true,
      month,
      totalObjects: allObjects.length,
      visitedThisMonth: visitedSet.size,
      alreadyPlanned: plannedSet.size,
      added: 0,
      overflow: 0,
      message: "Нет новых объектов для добавления в план"
    });
  }

  // 5. Сохранение
  const createRes = await sbFetch(env, "visit_plan", {
    method: "POST",
    headers: {
      Prefer: "return=representation"
    },
    body: JSON.stringify(planItems)
  });

  if (!createRes.ok) {
    return json({ ok: false, step: "createRes", error: createRes.data }, 500);
  }

  return json({
    ok: true,
    month,
    totalObjects: allObjects.length,
    visitedThisMonth: visitedSet.size,
    alreadyPlanned: plannedSet.size,
    added: planItems.length,
    overflow: Math.max(0, candidates.length - capacity),
    items: createRes.data || []
  });
}

function isObjectActive(obj) {
  const status = String(obj?.status || "").trim().toLowerCase();
  if (!status) return true;
  return !["архив", "нет", "неактивен", "inactive"].includes(status);
}

function compareObjectsForPlan(a, b) {
  const gA = String(a.group_name || "");
  const gB = String(b.group_name || "");
  if (gA !== gB) return gA.localeCompare(gB, "ru");
  return String(a.name || "").localeCompare(String(b.name || ""), "ru");
}

function distributeObjects(objects, workDays, maxPerDay, month) {
  const result = [];
  let dayIndex = 0;
  let perDay = 0;

  for (const obj of objects) {
    if (dayIndex >= workDays.length) break;

    result.push({
      plan_date: workDays[dayIndex],
      object_id: obj.id,
      object_name: obj.name || null,
      executor: null,
      status: "Запланирован",
      done_date: null,
      dispatcher_text: null,
      work_type: "Плановое",
      original_plan_date: null,
      transferred_from_id: null,
      transfer_reason: null
    });

    perDay++;
    if (perDay >= maxPerDay) {
      dayIndex++;
      perDay = 0;
    }
  }

  return result;
}

function normalizeMonth(value) {
  const m = String(value || "").match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  return `${m[1]}-${m[2]}`;
}

function getMonthKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getMonthEnd(month) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m, 0);
  return d.toISOString().slice(0, 10);
}

function getWorkDaysForMonth(month) {
  const [year, mon] = month.split("-").map(Number);
  const result = [];
  const d = new Date(year, mon - 1, 1);

  while (d.getMonth() === mon - 1) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      result.push(d.toISOString().slice(0, 10));
    }
    d.setDate(d.getDate() + 1);
  }

  return result;
}
