# Dungeon Hunters API Notes

Краткая памятка по API события. Все запросы выполняются с текущей авторизованной сессией пользователя в браузере.

База события:

```text
https://api.remanga.org/api/v2/events/dungeon-hunters
```

## State

- `GET /my-profile/` - профиль охотника: ранг, XP, MP, монеты, успешные и неудачные прохождения.
- `GET /dungeon/` - список доступных подземелий и наград.
- `GET /my-runs/` - история прохождений. Активный run обычно имеет `status: 1` и `is_reward_claimed: false`.
- `GET /my-potions/` - доступные зелья пользователя.

## Actions

- `POST /join/` с body `{ "gender": 1 }` - создать профиль события, если он еще не создан.
- `POST /dungeon/{dungeon_id}/enter/` - войти в подземелье.
- `POST /dungeon/runs/{run_id}/reward/` - забрать награду обычного прохождения после `ends_at`.
- `POST /dungeon/runs/{run_id}/mini-game-reward/` с body `{ "status": 2 }` - завершить мини-игру успешным результатом.

## Advent Calendar

База календаря:

```text
https://api.remanga.org/api/v2/events/advent-calendar
```

- `GET /` - список дней календаря.
- `GET /opening/` - уже открытые дни.
- `POST /opening/` с body `{ "calendar_id": id }` - открыть доступную награду.

## Run Types

- `game_type: 1` - обычный таймер, награда доступна только после `ends_at`.
- `game_type: 2` - мини-игра, можно завершить через `mini-game-reward`.

## Status

- `status: 1` - прохождение активно.
- `status: 2` - прохождение завершено успешно.

Сервер блокирует досрочный сбор обычного таймера, поэтому расширение только оценивает оставшееся время и ждет доступности награды.
