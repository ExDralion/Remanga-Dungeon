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
$('#run').addEventListener('click', async () => {
  await busy(() => send({ type: 'smdh_run_once', mode: nodes.mode.value }));
  await refresh();
});
$('#batch').addEventListener('click', async () => {
  await busy(() => send({ type: 'smdh_run_until_blocked', mode: nodes.mode.value }));
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
[nodes.usePotions, nodes.autoClaim, nodes.autoMini, nodes.autoAdvent, nodes.potionMinRank, ...nodes.potionModes].forEach(input => {
  input.addEventListener('change', saveSettings);
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
      potionMinRank: nodes.potionMinRank.value,
      potionModes
    }
  });
  await refresh();
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
  nodes.eventLeft.textContent = state.event?.date_end ? formatDuration(Date.parse(state.event.date_end) - Date.now()) : '-';
  nodes.auto.checked = Boolean(stored.auto);
  nodes.mode.value = stored.mode || 'safe';
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
  renderActiveRun(state.activeRun, state.nextAction);
  renderDungeons(state.dungeons || [], profile);
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

function renderActiveRun(run, nextAction = null) {
  if (!run) {
    nodes.active.innerHTML = `<strong>Активного данжа нет</strong><small>${escapeHtml(nextAction?.text || 'Можно запускать следующий цикл.')}</small>`;
    return;
  }
  const isMini = run.game_type === 2;
  nodes.active.innerHTML = `
    <strong>${escapeHtml(run.dungeon.rank)}-данж ${isMini ? 'с мини-игрой' : 'в процессе'}</strong>
    <small>${isMini ? 'Мини-игру можно закрыть кнопкой "Завершить мини-игру".' : `Готовность: ${escapeHtml(formatDate(run.ends_at))} (${escapeHtml(formatDuration(Date.parse(run.ends_at) - Date.now()))})`}</small>
  `;
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
        <small>+${num(dungeon.xp_reward)} XP</small>
      </div>
    `;
  }).join('') || '<p>Данжи не загружены.</p>';
}

function renderLog(logs) {
  nodes.log.innerHTML = logs.slice(0, 20).map(item => `<div>${escapeHtml(item.message)}</div>`).join('') || '<p>Лог пуст.</p>';
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
  if (Number.isFinite(Number(dungeon.success_rate))) return Number(dungeon.success_rate);
  const diff = RANKS.indexOf(dungeon.rank) - RANKS.indexOf(profile?.rank || 'F');
  if (diff <= 0) return 90;
  if (diff === 1) return 50;
  return 0;
}

function getModeLabel(mode) {
  if (mode === 'highest') return 'максимальный ранг';
  if (mode === 'xp') return 'ожидаемый XP';
  if (mode === 'fast') return 'быстрый фарм';
  return 'свой ранг';
}

function num(value) {
  return Number(value || 0).toLocaleString('ru-RU');
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
