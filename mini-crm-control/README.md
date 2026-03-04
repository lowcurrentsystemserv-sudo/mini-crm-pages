# mini-crm-control

Фронтенд для мини-CRM (Requests / Visit_plan / Visits_log + Objects).
Деплой: Cloudflare Pages.

## Быстрый старт
Открой `index.html` в браузере.
В MOCK режиме все экраны работают без API.

## Подключение Apps Script API
1) Открой `js/config.js`
2) Укажи:
- `API_BASE_URL: "https://script.google.com/macros/s/XXXX/exec"`
- `USE_MOCK: false`

Дальше фронт будет ждать эндпоинты (POST):
- `/login`
- `/objects/list`
- `/requests/list`
- `/requests/create`
- `/requests/update`
- `/plan/list`
- `/plan/create`
- `/plan/update`
- `/plan/delete`
- `/visits_log/append`
- `/planning/candidates`

Если хочешь другие пути — меняем в `js/api.js`.

## Деплой Cloudflare Pages
- Framework preset: None
- Build command: (пусто)
- Output directory: (пусто) / корень репозитория