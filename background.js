const API_BASE = 'https://api.remanga.org/api/v2/events/dungeon-hunters';
const EVENT_API = 'https://api.remanga.org/api/v2/events';
const EVENT_BALANCE_API = 'https://api.remanga.org/api/v2/events/eventpoint-balance/';
const ADVENT_API = 'https://api.remanga.org/api/v2/events/advent-calendar';
const STORE_KEY = 'smdh-state';
const AUTO_ALARM = 'smdh-auto';
const RANKS = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'RE'];
const MP_REGEN_INTERVAL_MS = 30 * 60 * 1000;
const LOOP_LIMIT = 6;
const AUTO_RETRY_BASE_MS = 2 * 60 * 1000;
const AUTO_RETRY_MAX_MS = 10 * 60 * 1000;
const DEFAULT_STORE = {
  auto: false,
  mode: 'safe',
  logs: [],
  usePotions: true,
  potionModes: {
    safe: true,
    xp: true,
    highest: true,
    fast: true
  },
  potionMinRank: 'F',
  autoAdvent: true,
  autoClaim: true,
  autoMini: true,
  retry: null,
  lastAdventClaimDate: null,
  lastAutoActionAt: null
};
const FALLBACK_EVENT = {
  date_start: '2026-05-08T18:00:00',
  date_end: '2026-06-08T00:00:00',
  is_active: true,
  meta: {
    ranks: {
      F: 200,
      E: 500,
      D: 1000,
      C: 2000,
      B: 4000,
      A: 8000
    }
  },
  name: 'dungeon-hunters'
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(AUTO_ALARM, { periodInMinutes: 1 });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create(AUTO_ALARM, { periodInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name !== AUTO_ALARM) return;
  runAutoTick().catch(error => appendLog(`Авто: ${error.message || error}`, 'error'));
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || !String(message.type || '').startsWith('smdh_')) return undefined;
  respond(sendResponse, () => handleMessage(message));
  return true;
});

async function respond(sendResponse, runner) {
  try {
    sendResponse({ ok: true, ...(await runner()) });
  } catch (error) {
    sendResponse({ ok: false, error: error.message || String(error) });
  }
}

async function handleMessage(message) {
  switch (message.type) {
    case 'smdh_get_state':
      return { state: await getFullState() };
    case 'smdh_open_page':
      await chrome.tabs.create({ url: 'https://remanga.org/dungeon-hunters' });
      return {};
    case 'smdh_set_auto':
      return { stored: await updateStore({ auto: Boolean(message.enabled) }) };
    case 'smdh_set_mode':
      return { stored: await updateStore({ mode: normalizeMode(message.mode) }) };
    case 'smdh_set_settings':
      return { stored: await updateSettings(message.settings || {}) };
    case 'smdh_auto_tick':
      return { result: await runAutoTick({ source: 'page' }) };
    case 'smdh_run_once':
      return { result: await runDungeonCycle(message.mode || 'safe') };
    case 'smdh_run_until_blocked':
      return { result: await runUntilBlocked(message.mode || 'safe') };
    case 'smdh_claim':
      return { result: await claimReadyOrMiniGame() };
    case 'smdh_complete_mini_game':
      return { result: await completeActiveMiniGame() };
    case 'smdh_get_advent_state':
      return { advent: await getAdventState() };
    case 'smdh_claim_advent':
      return { result: await claimAdventRewards() };
    case 'smdh_sync_mana':
      return { mana: await refreshManaSnapshot() };
    case 'smdh_clear_logs':
      return { stored: await updateStore({ logs: [] }) };
    default:
      throw new Error(`Неизвестная команда: ${message.type}`);
  }
}

async function api(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_error) {
      data = text;
    }
    if (!response.ok) {
      const detail = data?.detail?.[0]?.message || data?.detail?.message || data?.detail || data?.message || text || response.statusText;
      throw new Error(`API ${response.status}: ${String(detail)}`);
    }
    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Network error: ${error.message}`);
    }
    throw error;
  }
}

async function getFullState() {
  const [stored, profile, dungeons, runs, potions, eventBalance, events] = await Promise.all([
    getStore(),
    api('/my-profile/').catch(error => ({ error: error.message || String(error) })),
    api('/dungeon/').catch(error => ({ results: [], error: error.message || String(error) })),
    api('/my-runs/').catch(error => ({ results: [], error: error.message || String(error) })),
    api('/my-potions/').catch(error => ({ results: [], error: error.message || String(error) })),
    api(EVENT_BALANCE_API).catch(() => null),
    api(`${EVENT_API}/`).catch(() => null)
  ]);
  const eventItems = Array.isArray(events?.results) ? events.results : Array.isArray(events) ? events : [];
  const event = eventItems.find(item => item.name === 'dungeon-hunters') || FALLBACK_EVENT;
  const runItems = Array.isArray(runs?.results) ? runs.results : [];
  const potionItems = Array.isArray(potions?.results) ? potions.results : [];
  const mana = buildManaState(stored.mana, profile);
  if (!profile?.error && mana.snapshot) {
    await updateStore({ mana: mana.snapshot });
  }
  return {
    stored: {
      ...stored,
      mana: mana.snapshot
    },
    profile,
    dungeons: Array.isArray(dungeons?.results) ? dungeons.results : [],
    runs: runItems,
    potions: potionItems,
    eventBalance,
    event,
    mana,
    activeRun: getActiveRun(runItems),
    nextReadyAt: getNextReadyAt(runItems),
    nextAction: buildNextAction({ profile, dungeons: Array.isArray(dungeons?.results) ? dungeons.results : [], potions: potionItems, runs: runItems, mana, stored })
  };
}

function getActiveRun(runs) {
  return runs.find(run => run.status === 1 && !run.is_reward_claimed) || null;
}

function getNextReadyAt(runs) {
  const active = getActiveRun(runs);
  return active?.ends_at || null;
}

async function runAutoTick(options = {}) {
  const stored = await getStore();
  if (!stored.auto) return null;
  if (stored.retry?.until && Date.parse(stored.retry.until) > Date.now()) {
    return { action: 'retry_wait', retry: stored.retry };
  }

  try {
    if (stored.autoAdvent) await claimDailyAdventOnce();
    const result = await runUntilBlocked(stored.mode || 'safe', { auto: true });
    await updateStore({
      retry: null,
      lastAutoActionAt: new Date().toISOString()
    });
    return { action: 'auto_tick', source: options.source || 'alarm', result };
  } catch (error) {
    await handleAutoError(error);
    throw error;
  }
}

async function runDungeonCycle(mode = 'safe') {
  mode = normalizeMode(mode);
  await updateStore({ mode });
  const state = await getFullState();
  if (state.profile?.error) throw new Error(`Профиль события не загружен: ${state.profile.error}`);
  if (state.activeRun) {
    if (state.activeRun.game_type === 2) {
      if (state.stored?.autoMini === false) {
        await appendLog('Mini-game waits because auto-close is disabled.', 'idle');
        return { action: 'mini_wait', run: state.activeRun };
      }
      return completeActiveMiniGame(state.activeRun);
    }
    if (isRunReady(state.activeRun)) {
      if (state.stored?.autoClaim === false) {
        await appendLog('Dungeon reward waits because auto-claim is disabled.', 'idle');
        return { action: 'claim_wait', run: state.activeRun };
      }
      return claimRunReward(state.activeRun);
    }
    const waitText = formatWait(state.activeRun.ends_at);
    await appendLog(`Активный ${state.activeRun.dungeon.rank}-данж еще идет: ${waitText}.`, 'idle');
    return { action: 'wait', run: state.activeRun, message: waitText };
  }

  const dungeon = chooseDungeon(state, mode, { ignoreMp: true });
  if (!dungeon) {
    await appendLog('Нет подходящего данжа для запуска.', 'idle');
    return { action: 'none' };
  }
  const potionPlan = buildPotionPlan(state, dungeon, mode);
  const effectiveCost = potionPlan.stats.mp_cost;
  const currentMp = getTrackedMp(state);
  const waitMs = getManaWaitMs(state.mana, effectiveCost);
  if (currentMp < effectiveCost) {
    const message = `Недостаточно MP для ${dungeon.rank}: ${currentMp}/${effectiveCost}. Ждать ${formatDurationMs(waitMs)}.`;
    await appendLog(message, 'idle');
    return { action: 'no_mp', dungeon, message, waitMs, potions: potionPlan.selected };
  }

  const run = await api(`/dungeon/${dungeon.id}/enter/`, { method: 'POST', body: potionPlan.body });
  await updateManaAfterSpend(state, effectiveCost);
  await appendLog(`Запущен ${run.dungeon.rank}-данж${potionPlan.text ? `, баффы активны: ${potionPlan.text}` : ''}: ${run.game_type === 2 ? 'мини-игра' : formatWait(run.ends_at)}.`, 'success');
  if (run.game_type === 2) {
    return completeActiveMiniGame(run);
  }
  return { action: 'started', run, potions: potionPlan.selected, potionBody: potionPlan.body, effectiveStats: potionPlan.stats };
}

async function runUntilBlocked(mode = 'safe', options = {}) {
  const results = [];
  for (let index = 0; index < LOOP_LIMIT; index += 1) {
    const result = await runDungeonCycle(mode);
    results.push(result);
    if (!['mini_game_completed', 'claimed'].includes(result?.action)) {
      break;
    }
    if (options.auto) await sleep(300);
  }
  const last = results[results.length - 1];
  await appendLog(`Серия завершена: ${results.length} шаг(ов), статус ${last?.action || 'unknown'}.`, 'idle');
  return { action: 'batch', results, last };
}

function normalizeMode(mode) {
  return ['safe', 'xp', 'highest', 'fast'].includes(mode) ? mode : 'safe';
}

function chooseDungeon(state, mode, options = {}) {
  if (!state || !state.profile || !Array.isArray(state.dungeons)) return null;
  const rankIndex = RANKS.indexOf(state.profile?.rank || 'F');
  const available = state.dungeons
    .filter(dungeon => dungeon && dungeon.rank && RANKS.indexOf(dungeon.rank) >= 0)
    .filter(dungeon => RANKS.indexOf(dungeon.rank) <= rankIndex + 1)
    .filter(dungeon => options.ignoreMp || Number(dungeon.mp_cost || 0) <= getTrackedMp(state));
  if (!available.length) return null;

  if (mode === 'highest') {
    return available.sort((a, b) => RANKS.indexOf(b.rank) - RANKS.indexOf(a.rank))[0];
  }

  if (mode === 'xp') {
    return available.sort((a, b) => expectedXp(b, state.profile) - expectedXp(a, state.profile))[0];
  }

  if (mode === 'fast') {
    return available.sort((a, b) => Number(a.duration_seconds || 0) - Number(b.duration_seconds || 0) || RANKS.indexOf(b.rank) - RANKS.indexOf(a.rank))[0];
  }

  const sameRank = available.find(dungeon => dungeon.rank === state.profile.rank);
  return sameRank || available.sort((a, b) => RANKS.indexOf(b.rank) - RANKS.indexOf(a.rank))[0];
}

function buildNextAction(state) {
  if (state.profile?.error) return { type: 'error', text: 'Профиль события не загружен' };
  const active = getActiveRun(state.runs || []);
  if (active?.game_type === 2) return { type: 'mini', text: `${active.dungeon?.rank || '?'}-данж: закрыть мини-игру` };
  if (active && isRunReady(active)) return { type: 'claim', text: `${active.dungeon?.rank || '?'}-данж: забрать награду` };
  if (active) return { type: 'wait', text: `${active.dungeon?.rank || '?'}-данж идет еще ${formatWait(active.ends_at)}` };
  const dungeon = chooseDungeon(state, state.stored?.mode || 'safe', { ignoreMp: true });
  if (!dungeon) return { type: 'none', text: 'Нет доступного данжа' };
  const currentMp = getTrackedMp(state);
  if (currentMp < Number(dungeon.mp_cost || 0)) {
    return { type: 'mp', text: `Нужно ${dungeon.mp_cost} MP для ${dungeon.rank}, сейчас ${currentMp}. Ждать ${formatDurationMs(getManaWaitMs(state.mana, dungeon.mp_cost))}` };
  }
  return { type: 'start', text: `Можно запустить ${dungeon.rank}-данж` };
}

function expectedXp(dungeon, profile) {
  const chance = getSuccessChance(dungeon, profile) / 100;
  return Number(dungeon.xp_reward || 0) * chance;
}

function getSuccessChance(dungeon, profile) {
  if (Number.isFinite(Number(dungeon.success_rate))) return Number(dungeon.success_rate);
  const diff = RANKS.indexOf(dungeon.rank) - RANKS.indexOf(profile?.rank || 'F');
  if (diff <= 0) return 90;
  if (diff === 1) return 50;
  return 0;
}

function buildPotionPlan(state, dungeon, mode = 'safe') {
  const selected = shouldUsePotions(state, dungeon, mode) ? chooseDungeonPotions(state, dungeon) : [];
  const effects = mergePotionEffects(selected);
  const body = {};
  selected.forEach((userPotion, index) => {
    body[`potion${index + 1}`] = getPotionId(userPotion);
  });
  return {
    body,
    selected,
    effects,
    stats: applyPotionEffects(dungeon, effects),
    text: selected.map(formatPotionName).join(', ')
  };
}

function shouldUsePotions(state, dungeon, mode) {
  const stored = state?.stored || {};
  if (stored.usePotions === false) return false;
  const modes = stored.potionModes || {};
  if (modes && modes[mode] === false) return false;
  const minRank = stored.potionMinRank || 'F';
  if (RANKS.indexOf(dungeon?.rank || 'F') < RANKS.indexOf(minRank)) return false;
  return true;
}

function chooseDungeonPotions(state, dungeon) {
  const profile = state?.profile || {};
  const usedSlugs = new Set();
  return (state?.potions || [])
    .filter(userPotion => isUsableDungeonPotion(userPotion, dungeon, profile))
    .sort((a, b) => getPotionScore(b, dungeon) - getPotionScore(a, dungeon))
    .filter(userPotion => {
      const slug = String(userPotion?.potion?.slug || getPotionId(userPotion));
      if (usedSlugs.has(slug)) return false;
      usedSlugs.add(slug);
      return true;
    })
    .slice(0, 2);
}

function isUsableDungeonPotion(userPotion, dungeon, profile) {
  const potion = userPotion?.potion;
  if (!potion || !getPotionId(userPotion)) return false;
  if (normalizeNumber(userPotion.quantity ?? 1) <= 0) return false;
  const effects = potion.effects || {};
  if (normalizeNumber(effects.mp_restore) > 0) return false;
  if (potion.is_re && dungeon?.rank !== 'RE') return false;
  if (dungeon?.rank === 'RE' && Number(effects.speed_multiplier || 0) > 1) return false;
  if (potion.min_rank && RANKS.indexOf(potion.min_rank) > RANKS.indexOf(profile?.rank || 'F')) return false;
  return getPotionScore(userPotion, dungeon) > 0;
}

function getPotionScore(userPotion, dungeon) {
  const effects = userPotion?.potion?.effects || {};
  const speed = Math.max(0, Number(effects.speed_multiplier || 1) - 1);
  const success = normalizeNumber(effects.success_bonus);
  const coin = normalizeNumber(effects.coin_bonus);
  const rare = normalizeNumber(effects.rare_drop_bonus);
  const re = normalizeNumber(effects.re_drop_bonus);
  const duration = normalizeNumber(dungeon?.duration_seconds);
  return speed * 100000 + speed * duration + success * 1000 + coin * 100 + rare * 40 + re * 40;
}

function mergePotionEffects(userPotions) {
  return (userPotions || []).reduce((effects, userPotion) => {
    const next = userPotion?.potion?.effects || {};
    return {
      success_bonus: normalizeNumber(effects.success_bonus) + normalizeNumber(next.success_bonus),
      coin_bonus: normalizeNumber(effects.coin_bonus) + normalizeNumber(next.coin_bonus),
      rare_drop_bonus: normalizeNumber(effects.rare_drop_bonus) + normalizeNumber(next.rare_drop_bonus),
      re_drop_bonus: normalizeNumber(effects.re_drop_bonus) + normalizeNumber(next.re_drop_bonus),
      mp_restore: normalizeNumber(effects.mp_restore) + normalizeNumber(next.mp_restore),
      speed_multiplier: Math.max(Number(effects.speed_multiplier || 1), Number(next.speed_multiplier || 1))
    };
  }, { speed_multiplier: 1 });
}

function applyPotionEffects(dungeon, effects) {
  const speed = Math.max(1, Number(effects?.speed_multiplier || 1));
  const baseSuccess = Number.isFinite(Number(dungeon?.success_rate)) ? Number(dungeon.success_rate) : 0;
  const coinBonus = normalizeNumber(effects?.coin_bonus);
  return {
    mp_cost: Math.max(0, normalizeNumber(dungeon?.mp_cost) - normalizeNumber(effects?.mp_restore)),
    duration_seconds: speed > 1 ? Math.max(1, Math.round(normalizeNumber(dungeon?.duration_seconds) / speed)) : normalizeNumber(dungeon?.duration_seconds),
    success_rate: Math.min(100, baseSuccess + normalizeNumber(effects?.success_bonus)),
    coin_reward: Math.round(normalizeNumber(dungeon?.coin_reward) * (1 + coinBonus / 100)),
    speed_multiplier: speed
  };
}

function getPotionId(userPotion) {
  return normalizeNumber(userPotion?.potion?.id ?? userPotion?.potion_id ?? userPotion?.id);
}

function formatPotionName(userPotion) {
  const potion = userPotion?.potion || {};
  const effects = potion.effects || {};
  const parts = [];
  if (Number(effects.speed_multiplier || 0) > 1) parts.push(`x${effects.speed_multiplier}`);
  if (normalizeNumber(effects.success_bonus)) parts.push(`+${normalizeNumber(effects.success_bonus)}% success`);
  if (normalizeNumber(effects.coin_bonus)) parts.push(`+${normalizeNumber(effects.coin_bonus)}% coins`);
  if (normalizeNumber(effects.rare_drop_bonus)) parts.push(`+${normalizeNumber(effects.rare_drop_bonus)}% drop`);
  if (normalizeNumber(effects.re_drop_bonus)) parts.push(`+${normalizeNumber(effects.re_drop_bonus)}% RE`);
  return `${potion.name || potion.slug || `potion ${getPotionId(userPotion)}`}${parts.length ? ` ${parts.join('/')}` : ''}`;
}

async function claimReadyOrMiniGame() {
  const state = await getFullState();
  if (!state.activeRun) return { action: 'none', message: 'Активного данжа нет.' };
  if (state.activeRun.game_type === 2) return completeActiveMiniGame(state.activeRun);
  if (!isRunReady(state.activeRun)) {
    throw new Error(`Данж еще идет: ${formatWait(state.activeRun.ends_at)}`);
  }
  return claimRunReward(state.activeRun);
}

async function completeActiveMiniGame(activeRun = null) {
  const run = activeRun || (await getFullState()).activeRun;
  if (!run) throw new Error('Активная мини-игра не найдена.');
  if (run.game_type !== 2) throw new Error('Активный данж не является мини-игрой.');
  const reward = await api(`/dungeon/runs/${run.id}/mini-game-reward/`, {
    method: 'POST',
    body: { status: 2 }
  });
  await refreshManaSnapshot();
  await appendLog(`Мини-игра закрыта: +${reward.xp_reward || 0} XP, +${reward.coin_reward || 0} монет.`, 'success');
  return { action: 'mini_game_completed', run, reward };
}

async function claimRunReward(run) {
  const reward = await api(`/dungeon/runs/${run.id}/reward/`, { method: 'POST' });
  await refreshManaSnapshot();
  await appendLog(`Награда забрана за ${run.dungeon.rank}: +${reward.xp_reward || 0} XP, +${reward.coin_reward || 0} монет.`, 'success');
  return { action: 'claimed', run, reward };
}

async function getAdventState() {
  const [calendar, opens] = await Promise.all([
    api(`${ADVENT_API}/?count=50`).catch(error => ({ results: [], error: error.message || String(error) })),
    api(`${ADVENT_API}/opens/?count=50`).catch(error => ({ results: [], error: error.message || String(error) }))
  ]);
  const openedIds = new Set((Array.isArray(opens?.results) ? opens.results : [])
    .map(item => extractAdventCalendarId(item))
    .filter(id => Number.isFinite(id) && id > 0));
  const items = (Array.isArray(calendar?.results) ? calendar.results : []).map(item => ({
    ...item,
    status: getAdventStatus(item, openedIds)
  }));
  const claimable = items.filter(item => item.status === 'current');
  return {
    items,
    openedIds: [...openedIds],
    claimable,
    errors: {
      calendar: calendar?.error || null,
      opens: opens?.error || null
    }
  };
}

async function claimAdventRewards() {
  const state = await getAdventState();
  if (!state.claimable.length) {
    await appendLog('\u0410\u0434\u0432\u0435\u043d\u0442: \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b\u0445 \u043d\u0430\u0433\u0440\u0430\u0434 \u043d\u0435\u0442.', 'idle');
    return { action: 'advent_none', advent: state };
  }

  const claimed = [];
  const failed = [];
  for (const item of state.claimable) {
    const id = Number(item.id);
    if (!Number.isFinite(id) || id <= 0) continue;
    try {
      const reward = await api(`${ADVENT_API}/`, {
        method: 'POST',
        body: { calendar_id: id }
      });
      claimed.push({ item, reward });
      await appendLog(`\u0410\u0434\u0432\u0435\u043d\u0442: \u0434\u0435\u043d\u044c ${formatAdventDay(item)} \u0437\u0430\u0431\u0440\u0430\u043d.`, 'success');
    } catch (error) {
      failed.push({ item, error: error.message || String(error) });
    }
  }

  if (failed.length) {
    await appendLog(`\u0410\u0434\u0432\u0435\u043d\u0442: \u0437\u0430\u0431\u0440\u0430\u043d\u043e ${claimed.length}, \u043e\u0448\u0438\u0431\u043e\u043a ${failed.length}.`, claimed.length ? 'idle' : 'error');
  } else {
    await appendLog(`\u0410\u0434\u0432\u0435\u043d\u0442: \u0437\u0430\u0431\u0440\u0430\u043d\u043e ${claimed.length} \u043d\u0430\u0433\u0440\u0430\u0434.`, 'success');
  }

  return {
    action: 'advent_claimed',
    claimed,
    failed,
    advent: await getAdventState()
  };
}

async function claimDailyAdventOnce() {
  const dateKey = getLocalDateKey();
  const stored = await getStore();
  if (stored.lastAdventClaimDate === dateKey) return { action: 'advent_skip' };
  const result = await claimAdventRewards();
  await updateStore({ lastAdventClaimDate: dateKey });
  return result;
}

function extractAdventCalendarId(item) {
  return normalizeNumber(item?.calendar?.id ?? item?.calendar_id ?? item?.calendar);
}

function getAdventStatus(item, openedIds, now = Date.now()) {
  const id = normalizeNumber(item?.id);
  if (openedIds.has(id)) return 'retrieved';
  const rewardAt = parseAdventDate(item?.reward_date);
  if (!Number.isFinite(rewardAt)) return 'unknown';
  if (rewardAt > now) return 'locked';
  const hours = Math.floor((now - rewardAt) / 3600000);
  if (hours < 24) return 'current';
  if (hours < 48) return 'missed_precurrent';
  return 'missed';
}

function parseAdventDate(value) {
  if (!value) return NaN;
  const text = String(value).trim();
  if (!text) return NaN;
  if (/Z|[+-]\d\d:?\d\d$/.test(text)) return Date.parse(text);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return Date.parse(`${text}T00:00:00Z`);
  return Date.parse(`${text.replace(' ', 'T')}Z`);
}

function formatAdventDay(item) {
  const date = parseAdventDate(item?.reward_date);
  if (Number.isFinite(date)) return new Date(date).getUTCDate();
  return item?.id || '?';
}

function isRunReady(run) {
  return run?.ends_at && Date.parse(run.ends_at) <= Date.now();
}

function formatWait(iso) {
  if (!iso) return 'без таймера';
  const ms = Date.parse(iso) - Date.now();
  if (ms <= 0) return 'готово';
  return formatDurationMs(ms);
}

function buildManaState(previous, profile) {
  if (!profile || profile.error) {
    return { snapshot: previous || null, estimated: estimateMana(previous), nextPointAt: getNextManaPointAt(previous), fullAt: getFullManaAt(previous) };
  }

  const current = normalizeNumber(profile.current_mp);
  const max = normalizeNumber(profile.max_mp);
  const regen = Math.max(1, normalizeNumber(profile.mp_regen) || 1);
  const estimatedPrevious = estimateMana(previous);
  const hasChanged =
    !previous ||
    normalizeNumber(previous.max) !== max ||
    normalizeNumber(previous.regen) !== regen ||
    current !== estimatedPrevious;

  const snapshot = hasChanged
    ? { current, max, regen, fixedAt: Date.now() }
    : { current: estimatedPrevious, max, regen, fixedAt: Date.now() };

  return {
    snapshot,
    estimated: estimateMana(snapshot),
    nextPointAt: getNextManaPointAt(snapshot),
    fullAt: getFullManaAt(snapshot)
  };
}

function estimateMana(snapshot, now = Date.now()) {
  if (!snapshot) return 0;
  const current = normalizeNumber(snapshot.current);
  const max = normalizeNumber(snapshot.max);
  const regen = Math.max(1, normalizeNumber(snapshot.regen) || 1);
  const fixedAt = normalizeNumber(snapshot.fixedAt) || now;
  const ticks = Math.max(0, Math.floor((now - fixedAt) / MP_REGEN_INTERVAL_MS));
  return Math.min(max, current + ticks * regen);
}

function getNextManaPointAt(snapshot, now = Date.now()) {
  if (!snapshot || estimateMana(snapshot, now) >= normalizeNumber(snapshot.max)) return null;
  const fixedAt = normalizeNumber(snapshot.fixedAt) || now;
  const elapsed = Math.max(0, now - fixedAt);
  const remainder = elapsed % MP_REGEN_INTERVAL_MS;
  return new Date(now + (MP_REGEN_INTERVAL_MS - remainder)).toISOString();
}

function getFullManaAt(snapshot, now = Date.now()) {
  if (!snapshot) return null;
  const estimated = estimateMana(snapshot, now);
  const max = normalizeNumber(snapshot.max);
  if (estimated >= max) return null;
  const regen = Math.max(1, normalizeNumber(snapshot.regen) || 1);
  const pointsLeft = max - estimated;
  const ticksLeft = Math.ceil(pointsLeft / regen);
  const firstTickAt = Date.parse(getNextManaPointAt(snapshot, now) || new Date(now).toISOString());
  return new Date(firstTickAt + Math.max(0, ticksLeft - 1) * MP_REGEN_INTERVAL_MS).toISOString();
}

function getTrackedMp(state) {
  if (!state) return 0;
  const profileMp = normalizeNumber(state?.profile?.current_mp);
  const estimated = normalizeNumber(state?.mana?.estimated ?? estimateMana(state?.mana?.snapshot || state?.stored?.mana));
  return Math.max(profileMp, estimated);
}

function getManaWaitMs(mana, targetMp, now = Date.now()) {
  const snapshot = mana?.snapshot || mana;
  const estimated = estimateMana(snapshot, now);
  const target = normalizeNumber(targetMp);
  if (!snapshot || estimated >= target) return 0;
  const regen = Math.max(1, normalizeNumber(snapshot.regen) || 1);
  const missing = target - estimated;
  const ticks = Math.ceil(missing / regen);
  const firstTickAt = Date.parse(getNextManaPointAt(snapshot, now) || new Date(now).toISOString());
  return Math.max(0, firstTickAt - now + Math.max(0, ticks - 1) * MP_REGEN_INTERVAL_MS);
}

async function updateManaAfterSpend(state, cost) {
  const previous = state?.mana?.snapshot || state?.stored?.mana;
  const snapshot = {
    current: Math.max(0, getTrackedMp(state) - normalizeNumber(cost)),
    max: normalizeNumber(previous?.max ?? state?.profile?.max_mp),
    regen: Math.max(1, normalizeNumber(previous?.regen ?? state?.profile?.mp_regen) || 1),
    fixedAt: Date.now()
  };
  await updateStore({ mana: snapshot });
  return snapshot;
}

async function refreshManaSnapshot() {
  const profile = await api('/my-profile/').catch(() => null);
  if (!profile || profile.error) return null;
  const stored = await getStore();
  const mana = buildManaState(stored.mana, profile);
  await updateStore({ mana: mana.snapshot });
  return mana;
}

function normalizeNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? Math.floor(number) : 0;
}

function formatDurationMs(ms) {
  if (!Number.isFinite(Number(ms)) || ms <= 0) return '0м';
  const totalMinutes = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${hours}ч ${minutes}м` : `${minutes}м`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getLocalDateKey(date = new Date()) {
  return date.toLocaleDateString('en-CA');
}

function mergeStore(value) {
  const next = {
    ...DEFAULT_STORE,
    ...(value || {}),
    potionModes: {
      ...DEFAULT_STORE.potionModes,
      ...((value || {}).potionModes || {})
    }
  };
  next.mode = normalizeMode(next.mode);
  next.potionMinRank = RANKS.includes(next.potionMinRank) ? next.potionMinRank : 'F';
  return next;
}

async function getStore() {
  return new Promise(resolve => {
    chrome.storage.local.get([STORE_KEY], data => {
      resolve(mergeStore(data?.[STORE_KEY] || {}));
    });
  });
}

async function updateStore(patch) {
  const next = mergeStore({ ...(await getStore()), ...patch });
  return new Promise(resolve => {
    chrome.storage.local.set({ [STORE_KEY]: next }, () => resolve(next));
  });
}

async function updateSettings(settings) {
  const patch = {};
  if ('usePotions' in settings) patch.usePotions = Boolean(settings.usePotions);
  if ('autoAdvent' in settings) patch.autoAdvent = Boolean(settings.autoAdvent);
  if ('autoClaim' in settings) patch.autoClaim = Boolean(settings.autoClaim);
  if ('autoMini' in settings) patch.autoMini = Boolean(settings.autoMini);
  if ('potionMinRank' in settings && RANKS.includes(settings.potionMinRank)) patch.potionMinRank = settings.potionMinRank;
  if (settings.potionModes && typeof settings.potionModes === 'object') {
    const current = (await getStore()).potionModes || {};
    patch.potionModes = {
      ...current,
      ...Object.fromEntries(Object.entries(settings.potionModes)
        .filter(([key]) => ['safe', 'xp', 'highest', 'fast'].includes(key))
        .map(([key, value]) => [key, Boolean(value)]))
    };
  }
  return updateStore(patch);
}

async function appendLog(message, tone = 'idle') {
  const store = await getStore();
  const logs = [{ at: new Date().toISOString(), message, tone }, ...(store.logs || [])].slice(0, 80);
  await updateStore({ logs });
}

async function handleAutoError(error) {
  const store = await getStore();
  const attempts = Math.min(Number(store.retry?.attempts || 0) + 1, 6);
  const delay = Math.min(AUTO_RETRY_BASE_MS * attempts, AUTO_RETRY_MAX_MS);
  const retry = {
    attempts,
    until: new Date(Date.now() + delay).toISOString(),
    message: error?.message || String(error)
  };
  await updateStore({ retry });
  await appendLog(`Auto paused ${formatDurationMs(delay)}: ${retry.message}`, 'error');
  return retry;
}
