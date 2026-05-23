# Dungeon Hunters API Notes

База: `https://api.remanga.org/api/v2/events/dungeon-hunters`

## State

- `GET /my-profile/` - профиль охотника: rank, xp, MP, монеты, успешные/неудачные runs.
- `GET /dungeon/` - список данжей и наград.
- `GET /my-runs/` - история runs, активный run имеет `status: 1` и `is_reward_claimed: false`.
- `GET /my-potions/` - доступные зелья.

## Actions

- `POST /join/` body `{ "gender": 1 }` - создать профиль.
- `POST /dungeon/{dungeon_id}/enter/` body `{}` - войти в данж.
- `POST /dungeon/runs/{run_id}/reward/` - забрать награду обычного run после `ends_at`.
- `POST /dungeon/runs/{run_id}/mini-game-reward/` body `{ "status": 2 }` - успешно закрыть мини-игру.

## Run Types

- `game_type: 1` - обычный таймер, награда доступна только после `ends_at`.
- `game_type: 2` - мини-игра, можно закрыть через `mini-game-reward`.

## Status

- `status: 1` - run активен.
- `status: 2` - run завершен успешно.

Сервер блокирует досрочный сбор обычного таймера: `Время прохождения подземелья ещё не истекло`.
