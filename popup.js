const RANKS = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'RE'];
const $ = selector => document.querySelector(selector);

const nodes = {
  rank: $('#rank'),
  xp: $('#xp'),
  mp: $('#mp'),
  regen: $('#regen'),
  manaFixed: $('#manaFixed'),
  manaNext: $('#manaNext'),
  successRuns: $('#successRuns'),
  failedRuns: $('#failedRuns'),
  coins: $('#coins'),
  coinFarmRank: $('#coinFarmRank'),
  coinFarmFormula: $('#coinFarmFormula'),
  coinFarmRate: $('#coinFarmRate'),
  coinFarmExpected: $('#coinFarmExpected'),
  coinFarmMp: $('#coinFarmMp'),
  coinFarmByMp: $('#coinFarmByMp'),
  coinForecast24: $('#coinForecast24'),
  coinForecastEvent: $('#coinForecastEvent'),
  runWinrate: $('#runWinrate'),
  runAvgCoins: $('#runAvgCoins'),
  eventLeft: $('#eventLeft'),
  rankProgress: $('#rankProgress'),
  rankNext: $('#rankNext'),
  rankBar: $('#rankBar'),
  autoState: $('#autoState'),
  modeState: $('#modeState'),
  topStatus: $('#topStatus'),
  pageTitle: $('#pageTitle'),
  pageSubtitle: $('#pageSubtitle'),
  active: $('#active'),
  dungeons: $('#dungeons'),
  multiQueueState: $('#multiQueueState'),
  multiLaunchList: $('#multiLaunchList'),
  multiCycleList: $('#multiCycleList'),
  selectedDungeon: $('#selectedDungeon'),
  mode: $('#mode'),
  auto: $('#auto'),
  usePotions: $('#usePotions'),
  autoClaim: $('#autoClaim'),
  autoMini: $('#autoMini'),
  autoAdvent: $('#autoAdvent'),
  potionMinRank: $('#potionMinRank'),
  potionModes: [...document.querySelectorAll('[data-potion-mode]')],
  log: $('#log'),
  buttons: [...document.querySelectorAll('button.action')]
};

document.addEventListener('DOMContentLoaded', refresh);
document.querySelectorAll('[data-tab]').forEach(button => {
  button.addEventListener('click', () => activateTab(button.dataset.tab));
});
$('#refresh').addEventListener('click', refresh);
$('#open').addEventListener('click', () => send({ type: 'smdh_open_page' }));
$('#runSelected').addEventListener('click', async () => {
  await busy(() => send({ type: 'smdh_run_selected', dungeonId: nodes.selectedDungeon.value }));
  await refresh();
});
$('#run').addEventListener('click', async () => {
  await busy(() => send({ type: 'smdh_run_once', mode: nodes.mode.value }));
  await refresh();
});
$('#batch').addEventListener('click', async () => {
  await busy(() => send({ type: 'smdh_run_until_blocked', mode: nodes.mode.value }));
  await refresh();
});
$('#runMultiLaunch').addEventListener('click', async () => {
  await saveMultiSettings(false);
  await busy(() => send({ type: 'smdh_run_multi_launch', dungeonIds: getCheckedDungeonIds('launch') }));
  await refresh();
});
$('#runMultiCycle').addEventListener('click', async () => {
  await saveMultiSettings(false);
  await busy(() => send({ type: 'smdh_run_multi_cycle', dungeonIds: getCheckedDungeonIds('cycle') }));
  await refresh();
});
$('#runAllDungeons').addEventListener('click', async () => {
  await busy(() => send({ type: 'smdh_run_all_dungeons' }));
  await refresh();
});
$('#claim').addEventListener('click', async () => {
  await busy(() => send({ type: 'smdh_claim' }));
  await refresh();
});
$('#advent').addEventListener('click', async () => {
  await busy(() => send({ type: 'smdh_claim_advent' }));
  await refresh();
});
$('#mini').addEventListener('click', async () => {
  await busy(() => send({ type: 'smdh_complete_mini_game' }));
  await refresh();
});
$('#syncMana').addEventListener('click', async () => {
  await busy(() => send({ type: 'smdh_sync_mana' }));
  await refresh();
});
$('#clearLog').addEventListener('click', async () => {
  await busy(() => send({ type: 'smdh_clear_logs' }));
  await refresh();
});
nodes.auto.addEventListener('change', async () => {
  await send({ type: 'smdh_set_auto', enabled: nodes.auto.checked });
  await refresh();
});
nodes.mode.addEventListener('change', async () => {
  await send({ type: 'smdh_set_mode', mode: nodes.mode.value });
  await refresh();
});
[nodes.usePotions, nodes.autoClaim, nodes.autoMini, nodes.autoAdvent, nodes.selectedDungeon, nodes.potionMinRank, ...nodes.potionModes].forEach(input => {
  input.addEventListener('change', saveSettings);
});
document.addEventListener('change', event => {
  if (event.target?.matches?.('[data-multi-launch], [data-multi-cycle]')) {
    saveMultiSettings().catch(() => null);
  }
});

setInterval(async () => {
  if (!nodes.auto.checked) return;
  await send({ type: 'smdh_auto_tick' }).catch(() => null);
  await refresh();
}, 30000);

function activateTab(tab) {
  document.querySelectorAll('[data-tab]').forEach(node => node.classList.toggle('active', node.dataset.tab === tab));
  document.querySelectorAll('[data-view]').forEach(node => node.classList.toggle('active', node.dataset.view === tab));
  if (tab === 'settings') {
    if (nodes.pageTitle) nodes.pageTitle.textContent = 'Settings';
    if (nodes.pageSubtitle) nodes.pageSubtitle.textContent = 'Автопилот, зелья и сбор наград';
    return;
  }
  if (tab === 'multi') {
    if (nodes.pageTitle) nodes.pageTitle.textContent = 'Multi Dungeons';
    if (nodes.pageSubtitle) nodes.pageSubtitle.textContent = 'Пачка запусков и цикл выбранных данжей';
    return;
  }
  if (nodes.pageTitle) nodes.pageTitle.textContent = tab === 'dungeons' ? 'Dungeons' : 'Overview';
  if (nodes.pageSubtitle) {
    nodes.pageSubtitle.textContent = tab === 'dungeons'
      ? 'Запуск, сбор наград и очередь подземелий'
      : 'Профиль, энергия и прогресс события';
  }
}

async function refresh() {
  const response = await send({ type: 'smdh_get_state' });
  if (!response.ok) {
    nodes.active.textContent = response.error || 'Ошибка загрузки.';
    return;
  }
  render(response.state);
}

async function saveSettings() {
  const potionModes = {};
  nodes.potionModes.forEach(input => {
    potionModes[input.dataset.potionMode] = input.checked;
  });
  await send({
    type: 'smdh_set_settings',
    settings: {
      usePotions: nodes.usePotions.checked,
      autoClaim: nodes.autoClaim.checked,
      autoMini: nodes.autoMini.checked,
      autoAdvent: nodes.autoAdvent.checked,
      selectedDungeonId: nodes.selectedDungeon.value,
      potionMinRank: nodes.potionMinRank.value,
      potionModes
    }
  });
  await refresh();
}

async function saveMultiSettings(shouldRefresh = true) {
  await send({
    type: 'smdh_set_settings',
    settings: {
      multiLaunchDungeonIds: getCheckedDungeonIds('launch'),
      multiCycleDungeonIds: getCheckedDungeonIds('cycle')
    }
  });
  if (shouldRefresh) await refresh();
}

function render(state) {
  const profile = state.profile || {};
  const stored = state.stored || {};
  nodes.rank.textContent = profile.rank || '-';
  nodes.xp.textContent = `${num(profile.xp)} XP`;
  nodes.mp.textContent = `${num(profile.current_mp)}/${num(profile.max_mp)}`;
  nodes.regen.textContent = `+${num(profile.mp_regen)} MP каждые 30 мин`;
  if (nodes.manaFixed) nodes.manaFixed.textContent = `${num(state.mana?.estimated ?? profile.current_mp)}/${num(profile.max_mp)} MP`;
  if (nodes.manaNext) nodes.manaNext.textContent = state.mana?.nextPointAt
    ? `+MP: ${formatDate(state.mana.nextPointAt)}`
    : 'MP полная или нет данных';
  nodes.successRuns.textContent = num(profile.success_runs);
  nodes.failedRuns.textContent = num(profile.failed_runs);
  nodes.coins.textContent = num(profile.coins);
  renderCoinFarmPlan(state.farmPlan, state.forecast, state.efficiency);
  nodes.eventLeft.textContent = state.event?.date_end ? formatDuration(Date.parse(state.event.date_end) - Date.now()) : '-';
  nodes.auto.checked = Boolean(stored.auto);
  nodes.mode.value = stored.mode || 'safe';
  renderDungeonSelect(state.dungeons || [], stored.selectedDungeonId);
  nodes.usePotions.checked = stored.usePotions !== false;
  nodes.autoClaim.checked = stored.autoClaim !== false;
  nodes.autoMini.checked = stored.autoMini !== false;
  nodes.autoAdvent.checked = stored.autoAdvent !== false;
  nodes.potionMinRank.value = stored.potionMinRank || 'F';
  nodes.potionModes.forEach(input => {
    input.checked = (stored.potionModes || {})[input.dataset.potionMode] !== false;
  });
  if (nodes.autoState) nodes.autoState.textContent = stored.auto ? 'ON' : 'OFF';
  if (nodes.modeState) nodes.modeState.textContent = getModeLabel(stored.mode || 'safe');
  if (nodes.topStatus) nodes.topStatus.textContent = `${profile.rank || '?'} · ${num(profile.current_mp)}/${num(profile.max_mp)} MP`;

  renderRankProgress(profile, state.event?.meta?.ranks || {});
  const activeCount = Array.isArray(state.activeRuns) ? state.activeRuns.length : (state.activeRun ? 1 : 0);
  renderActiveRun(state.activeRun, state.nextAction, state.activeRunDetails, activeCount);
  renderDungeons(state.dungeons || [], profile);
  renderMultiDungeons(state.dungeons || [], profile, stored);
  if (nodes.multiQueueState) nodes.multiQueueState.textContent = `Очередь: ${(stored.multiQueueDungeonIds || []).length}`;
  renderLog(stored.logs || []);
}

function renderRankProgress(profile, thresholds) {
  const rank = profile.rank || 'F';
  const xp = Number(profile.xp || 0);
  const next = Number(thresholds[rank] || 0);
  if (!next || rank === 'RE') {
    nodes.rankProgress.textContent = `${xp} XP`;
    nodes.rankNext.textContent = 'Максимальный ранг или порог не найден';
    nodes.rankBar.style.width = '100%';
    return;
  }
  const percent = Math.max(0, Math.min(100, Math.round((xp / next) * 100)));
  nodes.rankProgress.textContent = `${xp} / ${next} XP`;
  nodes.rankNext.textContent = `До следующего ранга: ${Math.max(next - xp, 0)} XP`;
  nodes.rankBar.style.width = `${percent}%`;
}

function renderActiveRun(run, nextAction = null, details = null, activeCount = 1) {
  if (!run) {
    nodes.active.innerHTML = `<strong>Активного данжа нет</strong><small>${escapeHtml(nextAction?.text || 'Можно запускать следующий цикл.')}</small>`;
    return;
  }
  const isMini = run.game_type === 2;
  const activeCountLine = activeCount > 1 ? `<small>Активных данжей: ${num(activeCount)}</small>` : '';
  const rewardText = details
    ? `Награда: +${num(details.xp_reward)} XP · ~${num(Math.round(details.expected_coins))} монет (${Math.round(Number(details.chance || 0))}%)`
    : '';
  const actionText = details?.next_action || '';
  nodes.active.innerHTML = `
    <strong>${escapeHtml(run.dungeon.rank)}-данж ${isMini ? 'с мини-игрой' : 'в процессе'}</strong>
    <small>${isMini ? 'Мини-игру можно закрыть кнопкой "Завершить мини-игру".' : `Готовность: ${escapeHtml(formatDate(run.ends_at))} (${escapeHtml(formatDuration(Date.parse(run.ends_at) - Date.now()))})`}</small>
    ${activeCountLine}
    ${rewardText ? `<small>${escapeHtml(rewardText)}</small>` : ''}
    ${actionText ? `<small>${escapeHtml(actionText)}</small>` : ''}
  `;
}

function renderDungeonSelect(items, selectedId) {
  if (!nodes.selectedDungeon) return;
  const currentValue = String(selectedId || nodes.selectedDungeon.value || '');
  const options = ['<option value="">Auto dungeon</option>'];
  for (const item of Array.isArray(items) ? items : []) {
    if (!item?.id || !item?.rank) continue;
    options.push(`<option value="${escapeHtml(item.id)}">${escapeHtml(item.rank)} · ${num(item.mp_cost)} MP · ${formatDuration(Number(item.duration_seconds || 0) * 1000)}</option>`);
  }
  nodes.selectedDungeon.innerHTML = options.join('');
  nodes.selectedDungeon.value = [...nodes.selectedDungeon.options].some(option => option.value === currentValue) ? currentValue : '';
}

function renderDungeons(dungeons, profile) {
  const current = RANKS.indexOf(profile.rank || 'F');
  nodes.dungeons.innerHTML = dungeons.map(dungeon => {
    const rankIndex = RANKS.indexOf(dungeon.rank);
    const locked = rankIndex > current + 1;
    const chance = locked ? 0 : getChance(dungeon, profile);
    return `
      <div class="dungeon ${locked ? 'locked' : ''}">
        <span class="rank">${escapeHtml(dungeon.rank)}</span>
        <div>
          <strong>${escapeHtml(dungeon.rank)}-ранг</strong>
          <em>${num(dungeon.mp_cost)} MP · ${formatDuration(Number(dungeon.duration_seconds || 0) * 1000)} · ${chance || '-'}% шанс</em>
        </div>
        <small>+${num(dungeon.xp_reward)} XP · +${num(dungeon.coin_reward)} монет</small>
      </div>
    `;
  }).join('') || '<p>Данжи не загружены.</p>';
}

function renderMultiDungeons(dungeons, profile, stored = {}) {
  renderMultiList(nodes.multiLaunchList, dungeons, profile, stored.multiLaunchDungeonIds, 'launch');
  renderMultiList(nodes.multiCycleList, dungeons, profile, stored.multiCycleDungeonIds, 'cycle');
}

function renderMultiList(container, dungeons, profile, selectedIds = [], kind = 'launch') {
  if (!container) return;
  const selected = new Set((selectedIds || []).map(String));
  const current = RANKS.indexOf(profile.rank || 'F');
  container.innerHTML = (dungeons || []).map(dungeon => {
    const id = String(dungeon?.id || '');
    if (!id || !dungeon?.rank) return '';
    const locked = RANKS.indexOf(dungeon.rank) > current + 1;
    return `
      <label class="multi-option ${locked ? 'locked' : ''}">
        <input data-multi-${kind} type="checkbox" value="${escapeHtml(id)}" ${selected.has(id) ? 'checked' : ''} ${locked ? 'disabled' : ''}>
        <span class="rank">${escapeHtml(dungeon.rank)}</span>
        <span><strong>${escapeHtml(dungeon.rank)}-данж</strong><em>${num(dungeon.mp_cost)} MP · ${formatDuration(Number(dungeon.duration_seconds || 0) * 1000)}</em></span>
        <small>+${num(dungeon.xp_reward)} XP · +${num(dungeon.coin_reward)} монет</small>
      </label>
    `;
  }).join('') || '<p>Данжи не загружены.</p>';
}

function getCheckedDungeonIds(kind) {
  const selector = kind === 'cycle' ? '[data-multi-cycle]:checked' : '[data-multi-launch]:checked';
  return [...document.querySelectorAll(selector)].map(input => Number(input.value)).filter(Boolean);
}

function renderLog(logs) {
  nodes.log.innerHTML = logs.slice(0, 20).map(item => `<div>${escapeHtml(item.message)}</div>`).join('') || '<p>Лог пуст.</p>';
}

function renderCoinFarmPlan(plan, forecast = null, efficiency = null) {
  const best = plan?.best;
  if (!best) {
    if (nodes.coinFarmRank) nodes.coinFarmRank.textContent = '-';
    if (nodes.coinFarmFormula) nodes.coinFarmFormula.textContent = 'Нет доступных данжей для расчета.';
    if (nodes.coinFarmRate) nodes.coinFarmRate.textContent = '-';
    if (nodes.coinFarmExpected) nodes.coinFarmExpected.textContent = '-';
    if (nodes.coinFarmMp) nodes.coinFarmMp.textContent = '-';
    if (nodes.coinFarmByMp) nodes.coinFarmByMp.textContent = '-';
    if (nodes.coinForecast24) nodes.coinForecast24.textContent = '-';
    if (nodes.coinForecastEvent) nodes.coinForecastEvent.textContent = '-';
    if (nodes.runWinrate) nodes.runWinrate.textContent = '-';
    if (nodes.runAvgCoins) nodes.runAvgCoins.textContent = '-';
    return;
  }

  const duration = formatDuration(Number(best.duration_seconds || 0) * 1000);
  if (nodes.coinFarmRank) nodes.coinFarmRank.textContent = `${best.rank}-данж`;
  if (nodes.coinFarmFormula) {
    nodes.coinFarmFormula.textContent = `${num(best.mp_cost)} MP · ${duration} · ${Math.round(Number(best.chance || 0))}% шанс · guild +${num(best.guild_bonus)}%${best.potion_text ? ` · ${best.potion_text}` : ''}`;
  }
  if (nodes.coinFarmRate) nodes.coinFarmRate.textContent = formatDecimal(best.coins_per_minute);
  if (nodes.coinFarmExpected) nodes.coinFarmExpected.textContent = num(Math.round(Number(best.expected_coins || 0)));
  if (nodes.coinFarmMp) nodes.coinFarmMp.textContent = formatDecimal(best.coins_per_mp);
  if (nodes.coinFarmByMp) {
    const byMp = plan?.bestByMp;
    nodes.coinFarmByMp.textContent = byMp ? `${byMp.rank} · ${formatDecimal(byMp.coins_per_mp)}` : '-';
  }
  if (nodes.coinForecast24) {
    const next24 = forecast?.next24h;
    nodes.coinForecast24.textContent = next24 ? `${num(Math.round(next24.coins))} / ${num(next24.runs)} run` : '-';
  }
  if (nodes.coinForecastEvent) {
    const eventLeft = forecast?.eventLeft;
    nodes.coinForecastEvent.textContent = eventLeft ? `${num(Math.round(eventLeft.coins))} / ${num(eventLeft.runs)} run` : '-';
  }
  if (nodes.runWinrate) {
    nodes.runWinrate.textContent = efficiency?.total ? `${num(efficiency.winrate)}% · ${num(efficiency.success)}/${num(efficiency.total)}` : '-';
  }
  if (nodes.runAvgCoins) {
    nodes.runAvgCoins.textContent = efficiency?.success ? num(Math.round(efficiency.avg_coins)) : '-';
  }
}

async function busy(action) {
  nodes.buttons.forEach(button => { button.disabled = true; });
  try {
    return await action();
  } finally {
    nodes.buttons.forEach(button => { button.disabled = false; });
  }
}

function send(message) {
  return chrome.runtime.sendMessage(message);
}

function getChance(dungeon, profile) {
  if (dungeon?.success_rate !== null && dungeon?.success_rate !== undefined && Number.isFinite(Number(dungeon.success_rate))) return Number(dungeon.success_rate);
  const diff = RANKS.indexOf(dungeon.rank) - RANKS.indexOf(profile?.rank || 'F');
  if (diff <= 0) return 90;
  if (diff === 1) return 50;
  return 0;
}

function getModeLabel(mode) {
  if (mode === 'coins') return 'фарм монет';
  if (mode === 'highest') return 'максимальный ранг';
  if (mode === 'xp') return 'ожидаемый XP';
  if (mode === 'fast') return 'быстрый фарм';
  return 'свой ранг';
}

function num(value) {
  return Number(value || 0).toLocaleString('ru-RU');
}

function formatDecimal(value) {
  const number = Number(value || 0);
  return number.toLocaleString('ru-RU', {
    maximumFractionDigits: number >= 10 ? 1 : 2
  });
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(ms) {
  if (!Number.isFinite(ms)) return '-';
  if (ms <= 0) return 'готово';
  const totalMinutes = Math.ceil(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days) return `${days}д ${hours}ч`;
  if (hours) return `${hours}ч ${minutes}м`;
  return `${minutes}м`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
