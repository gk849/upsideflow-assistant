# Upsideflow — плагины для Claude Code

Маркетплейс плагинов Upsideflow для Claude Code.

| Плагин | Что делает |
|---|---|
| [`assistant`](plugins/assistant/README.md) | Помощник Upsideflow в Telegram: план дня, CRM Upsideflow, подбор объектов, разбор почты. Почта, календарь и диск — только чтение и черновики; запись в CRM — только после «да». |

## Установка

В Claude Code:

```
/plugin marketplace add gk849/upsideflow-assistant
/plugin install assistant@upsideflow
/reload-plugins
```

Подробно — подготовка, Telegram, ежедневный запуск, обновление: [plugins/assistant/README.md](plugins/assistant/README.md).

## Для сопровождающих

- Новая версия: поднимите `version` в `plugins/assistant/.claude-plugin/plugin.json` — без этого пользователи не получат изменения. Версию держите только там, не в `marketplace.json`.
- Перед публикацией: `claude plugin validate .` и `claude plugin validate plugins/assistant`.
- В репозитории нет секретов и внутренних данных: адреса, доступы и правила ведения CRM помощник получает во время работы из инструментов CRM (`crm_reference`, `crm_rules`).
