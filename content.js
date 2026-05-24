(() => {
  if (window.__SMDH_CONTENT__) return;
  window.__SMDH_CONTENT__ = true;

  const RANKS = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'RE'];
  const root = document.createElement('div');
  root.id = 'smdh-root';
  root.innerHTML = `
    <button id="smdh-fab" type="button" title="Dungeon Hunters">DH</button>
    <section id="smdh-panel" hidden>
      <aside class="smdh-sidebar">
        <div class="smdh-brand">
          <span class="smdh-brand-mark">DH</span>
          <span><strong>SailorM Dungeon</strong><small>Охотники подземелий</small></span>
        </div>
        <nav class="smdh-nav">
          <span class="smdh-nav-label">EVENT</span>
          <button class="smdh-tab active" data-tab="overview" type="button">
            <span class="smdh-nav-icon">OV</span>
            <span><strong>Overview</strong><small>Стата события</small></span>
          </button>
          <button class="smdh-tab" data-tab="dungeons" type="button">
            <span class="smdh-nav-icon">DG</span>
            <span><strong>Dungeons</strong><small>Прохождение</small></span>
          </button>
          <button class="smdh-tab" data-tab="multi" type="button">
            <span class="smdh-nav-icon">MD</span>
            <span><strong>Multi</strong><small>Пачка данжей</small></span>
          </button>
          <button class="smdh-tab" data-tab="settings" type="button">
            <span class="smdh-nav-icon">ST</span>
            <span><strong>Settings</strong><small>Автопилот и зелья</small></span>
          </button>
        </nav>
      </aside>
      <main class="smdh-content">
        <header class="smdh-topbar" data-drag-handle="true">
          <div>
            <h2 data-role="title">Overview</h2>
            <p data-role="subtitle">Профиль, энергия и прогресс события</p>
          </div>
          <button id="smdh-close" type="button">x</button>
        </header>
        <div class="smdh-body">
          <section class="smdh-view active" data-view="overview">
            <article class="smdh-panel smdh-hero">
              <span class="smdh-nav-label">Ранг охотника</span>
              <b data-role="rank">-</b>
              <small data-role="xp">-</small>
            </article>
            <div class="smdh-stats">
              <article><span>Энергия</span><b data-role="mp">-</b><small data-role="regen">-</small></article>
              <article><span>Монеты</span><b data-role="coins">-</b><small>валюта события</small></article>
              <article><span>Данжи</span><b data-role="success">-</b><small>успешно пройдено</small></article>
              <article><span>Провалы</span><b data-role="failed">-</b><small>неудачных заходов</small></article>
            </div>
            <article class="smdh-panel smdh-farm">
              <span class="smdh-nav-label">Фарм монет</span>
              <b data-role="coinFarmRank">-</b>
              <small data-role="coinFarmFormula">-</small>
              <div>
                <span><small>Монет / мин</small><strong data-role="coinFarmRate">-</strong></span>
                <span><small>Ожидаемо</small><strong data-role="coinFarmExpected">-</strong></span>
                <span><small>Монет / MP</small><strong data-role="coinFarmMp">-</strong></span>
                <span><small>По MP</small><strong data-role="coinFarmByMp">-</strong></span>
                <span><small>24ч</small><strong data-role="coinForecast24">-</strong></span>
                <span><small>До конца</small><strong data-role="coinForecastEvent">-</strong></span>
                <span><small>Winrate</small><strong data-role="runWinrate">-</strong></span>
                <span><small>Среднее</small><strong data-role="runAvgCoins">-</strong></span>
              </div>
            </article>
          </section>
          <section class="smdh-view" data-view="dungeons">
            <article id="smdh-status" class="smdh-panel">Загрузка...</article>
            <article class="smdh-panel">
              <div class="smdh-toolbar">
                <select id="smdh-mode">
                  <option value="safe">Безопасно: свой ранг</option>
                  <option value="xp">Максимум ожидаемого XP</option>
                  <option value="highest">Максимальный доступный ранг</option>
                  <option value="fast">Быстрый фарм</option>
                  <option value="coins">Фарм монет</option>
                </select>
                <select id="smdh-selected-dungeon">
                  <option value="">Auto dungeon</option>
                </select>
                <label class="smdh-toggle"><input id="smdh-auto" type="checkbox"> Автоцикл</label>
              </div>
              <div class="smdh-actions">
                <button data-action="selected" type="button">Selected</button>
                <button data-action="run" type="button">Цикл</button>
                <button data-action="batch" type="button">До ожидания</button>
                <button data-action="claim" type="button">Забрать</button>
                <button data-action="advent" type="button">&#1040;&#1076;&#1074;&#1077;&#1085;&#1090;</button>
                <button data-action="mini" type="button">Мини-игра</button>
                <button data-action="sync" type="button">Синхр. MP</button>
                <button data-action="clear" type="button">Очистить лог</button>
                <button data-action="refresh" type="button">Обновить</button>
              </div>
            </article>
            <article class="smdh-panel smdh-dungeon-panel">
              <span class="smdh-nav-label">Подземелья</span>
              <div id="smdh-dungeons"></div>
            </article>
            <article class="smdh-panel">
              <span class="smdh-nav-label">Лог</span>
              <div id="smdh-log"></div>
            </article>
          </section>
          <section class="smdh-view" data-view="multi">
            <article class="smdh-panel">
              <span class="smdh-nav-label">Multi Dungeons</span>
              <p class="smdh-help">Выбери данжи для разового запуска и отдельный набор для цикла. Мини-игры и готовые награды обрабатываются перед каждым новым запуском.</p>
              <div class="smdh-queue-state" data-role="multiQueue">Очередь: 0</div>
            </article>
            <div class="smdh-multi-grid">
              <article class="smdh-panel">
                <span class="smdh-nav-label">Запустить сейчас</span>
                <div id="smdh-multi-launch"></div>
              </article>
              <article class="smdh-panel">
                <span class="smdh-nav-label">Закинуть в цикл</span>
                <div id="smdh-multi-cycle"></div>
              </article>
            </div>
            <article class="smdh-panel">
              <div class="smdh-actions">
                <button data-action="multi-all" type="button">Запустить все доступные</button>
                <button data-action="multi-launch" type="button">Запустить выбранные</button>
                <button data-action="multi-cycle" type="button">Цикл выбранных</button>
              </div>
            </article>
          </section>
          <section class="smdh-view" data-view="settings">
            <article class="smdh-panel">
              <span class="smdh-nav-label">Автопилот</span>
              <div class="smdh-settings">
                <label class="smdh-toggle"><input id="smdh-use-potions" type="checkbox"> Зелья</label>
                <label class="smdh-toggle"><input id="smdh-auto-claim" type="checkbox"> Сбор</label>
                <label class="smdh-toggle"><input id="smdh-auto-mini" type="checkbox"> Мини-игры</label>
                <label class="smdh-toggle"><input id="smdh-auto-advent" type="checkbox"> Календарь</label>
                <select id="smdh-potion-min-rank">
                  <option value="F">Использовать зелья от F</option>
                  <option value="E">Использовать зелья от E</option>
                  <option value="D">Использовать зелья от D</option>
                  <option value="C">Использовать зелья от C</option>
                  <option value="B">Использовать зелья от B</option>
                  <option value="A">Использовать зелья от A</option>
                  <option value="S">Использовать зелья от S</option>
                  <option value="RE">Использовать зелья от RE</option>
                </select>
              </div>
            </article>
            <article class="smdh-panel">
              <span class="smdh-nav-label">Зелья по режимам</span>
              <div class="smdh-settings smdh-mode-potions">
                <label class="smdh-toggle"><input data-potion-mode="safe" type="checkbox"> Свой ранг</label>
                <label class="smdh-toggle"><input data-potion-mode="xp" type="checkbox"> Опыт</label>
                <label class="smdh-toggle"><input data-potion-mode="highest" type="checkbox"> Высший</label>
                <label class="smdh-toggle"><input data-potion-mode="fast" type="checkbox"> Фарм</label>
                <label class="smdh-toggle"><input data-potion-mode="coins" type="checkbox"> Монеты</label>
              </div>
            </article>
          </section>
        </div>
      </main>
    </section>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #smdh-root { position: fixed; right: 18px; bottom: 18px; z-index: 2147483647; font: 13px/1.35 "Segoe UI", system-ui, sans-serif; color: #f5f7fb; }
    #smdh-root * { box-sizing: border-box; letter-spacing: 0; }
    #smdh-fab { width: 48px; height: 48px; border: 1px solid rgba(125,211,252,.35); border-radius: 16px; background: linear-gradient(135deg,#172033,#12312d); color: #dff7ff; font-weight: 950; cursor: pointer; box-shadow: 0 18px 40px rgba(0,0,0,.35); }
    #smdh-panel { width: min(860px, calc(100vw - 36px)); height: min(620px, calc(100vh - 36px)); display: grid; grid-template-columns: 230px 1fr; overflow: hidden; border: 1px solid rgba(148,163,184,.16); border-radius: 20px; background: #090b11; box-shadow: 0 24px 70px rgba(0,0,0,.5); }
    #smdh-panel[hidden] { display: none; }
    .smdh-sidebar { padding: 16px 12px; border-right: 1px solid rgba(148,163,184,.16); background: linear-gradient(180deg,#0d1018,#090b11); }
    .smdh-brand { display: grid; grid-template-columns: 36px 1fr; align-items: center; gap: 10px; margin-bottom: 20px; }
    .smdh-brand-mark { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 12px; background: rgba(125,211,252,.1); color: #dff7ff; font-weight: 950; }
    .smdh-brand strong, .smdh-tab strong { display: block; color: #f5f7fb; line-height: 1.1; }
    .smdh-brand small, .smdh-tab small { display: block; margin-top: 3px; color: #94a3b8; font-size: 11px; }
    .smdh-nav { display: grid; gap: 8px; }
    .smdh-nav-label { color: #718096; font-size: 10px; font-weight: 950; text-transform: uppercase; }
    .smdh-tab { display: grid; grid-template-columns: 30px 1fr; gap: 10px; align-items: center; border: 0; border-radius: 11px; padding: 10px; background: transparent; text-align: left; cursor: pointer; }
    .smdh-tab.active { background: rgba(31,36,54,.92); box-shadow: inset 3px 0 0 rgba(125,211,252,.75); }
    .smdh-nav-icon { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 9px; background: rgba(125,211,252,.09); color: #bff2ff; font-size: 11px; font-weight: 950; }
    .smdh-content { min-width: 0; min-height: 0; display: flex; flex-direction: column; background: radial-gradient(circle at 100% 0%, rgba(45,212,191,.1), transparent 34%), linear-gradient(180deg,#0d111a,#090b11); }
    .smdh-topbar { min-height: 62px; display: flex; align-items: center; justify-content: space-between; padding: 13px 18px; border-bottom: 1px solid rgba(148,163,184,.16); cursor: move; user-select: none; }
    .smdh-topbar h2 { margin: 0; font-size: 19px; }
    .smdh-topbar p { margin: 3px 0 0; color: #94a3b8; font-size: 12px; }
    #smdh-close { border: 0; background: rgba(255,255,255,.04); color: #94a3b8; width: 30px; height: 30px; border-radius: 10px; cursor: pointer; }
    .smdh-body { min-height: 0; overflow: auto; padding: 18px; overscroll-behavior: contain; }
    .smdh-view { display: none; min-height: 0; gap: 12px; }
    .smdh-view.active { display: grid; }
    .smdh-panel, .smdh-stats article { border: 1px solid rgba(148,163,184,.16); border-radius: 16px; background: linear-gradient(180deg,rgba(23,29,41,.92),rgba(15,20,30,.92)); padding: 13px; }
    .smdh-hero b { display: block; margin-top: 10px; font-size: 54px; line-height: 1; }
    .smdh-hero small, .smdh-stats small { color: #94a3b8; }
    .smdh-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .smdh-stats span { color: #94a3b8; font-size: 10px; font-weight: 950; text-transform: uppercase; }
    .smdh-stats b { display: block; margin-top: 5px; font-size: 22px; }
    .smdh-toolbar, .smdh-actions, .smdh-settings { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .smdh-settings { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 9px; }
    .smdh-mode-potions { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .smdh-actions { grid-template-columns: repeat(3, 1fr); margin-top: 9px; }
    #smdh-mode, #smdh-selected-dungeon, #smdh-potion-min-rank, .smdh-toggle, .smdh-actions button { border: 1px solid rgba(148,163,184,.16); border-radius: 12px; background: rgba(255,255,255,.045); color: #f5f7fb; padding: 9px; font-weight: 850; }
    #smdh-mode { color-scheme: dark; background-color: #171d29; }
    #smdh-potion-min-rank, #smdh-mode, #smdh-selected-dungeon { color-scheme: dark; background-color: #171d29; }
    #smdh-mode option, #smdh-selected-dungeon option, #smdh-potion-min-rank option { background: #171d29; color: #f5f7fb; }
    #smdh-potion-min-rank { grid-column: 1 / -1; min-height: 40px; cursor: pointer; box-shadow: inset 0 1px 0 rgba(255,255,255,.04); }
    #smdh-potion-min-rank:hover { border-color: rgba(125,211,252,.38); background: rgba(35,45,62,.88); }
    .smdh-toggle {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      min-height: 40px;
      color: #cbd5e1;
      cursor: pointer;
      overflow: hidden;
      transition: border-color .16s ease, background .16s ease, color .16s ease, transform .16s ease;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
    }
    .smdh-toggle:hover { border-color: rgba(125,211,252,.34); background: rgba(255,255,255,.065); }
    .smdh-toggle input { position: absolute; opacity: 0; pointer-events: none; }
    .smdh-toggle::before {
      content: "";
      width: 28px;
      height: 16px;
      flex: 0 0 auto;
      border-radius: 999px;
      background: rgba(15,23,42,.82);
      border: 1px solid rgba(148,163,184,.24);
      box-shadow: inset 0 0 0 1px rgba(0,0,0,.1);
      order: 2;
      transition: background .16s ease, border-color .16s ease;
    }
    .smdh-toggle::after {
      content: "";
      position: absolute;
      right: 22px;
      top: 50%;
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: #64748b;
      transform: translateY(-50%);
      transition: transform .16s ease, background .16s ease;
    }
    .smdh-toggle:has(input:checked) {
      color: #eafff5;
      border-color: rgba(52,211,153,.44);
      background: linear-gradient(135deg, rgba(16,185,129,.18), rgba(56,189,248,.1));
    }
    .smdh-toggle:has(input:checked)::before { background: rgba(16,185,129,.28); border-color: rgba(52,211,153,.58); }
    .smdh-toggle:has(input:checked)::after { background: #6ee7b7; transform: translate(12px, -50%); }
    .smdh-actions button { cursor: pointer; background: rgba(34,197,94,.13); color: #bbf7d0; }
    .smdh-farm { display: grid; gap: 9px; border-color: rgba(45,212,191,.24); background: linear-gradient(145deg, rgba(20,184,166,.12), rgba(15,23,42,.8)); }
    .smdh-farm b { font-size: 24px; line-height: 1; }
    .smdh-farm > small { color: #9ca3af; }
    .smdh-farm div { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
    .smdh-farm div span { padding: 9px; border-radius: 11px; background: rgba(255,255,255,.04); border: 1px solid rgba(148,163,184,.13); }
    .smdh-farm div small { display: block; color: #9ca3af; font-size: 10px; }
    .smdh-farm div strong { display: block; margin-top: 4px; color: #f5f7fb; }
    #smdh-dungeons, #smdh-multi-launch, #smdh-multi-cycle, #smdh-log { display: grid; gap: 7px; margin-top: 10px; }
    .smdh-dungeon-panel { min-height: 0; }
    #smdh-dungeons, #smdh-multi-launch, #smdh-multi-cycle { max-height: min(310px, calc(100vh - 285px)); overflow: auto; padding-right: 3px; }
    .smdh-dungeon, .smdh-multi-option, #smdh-log div { padding: 8px; border-radius: 11px; background: rgba(255,255,255,.04); color: #cbd5e1; }
    .smdh-dungeon { display: grid; grid-template-columns: 38px 1fr auto; align-items: center; gap: 9px; }
    .smdh-multi-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .smdh-multi-option { display: grid; grid-template-columns: 24px 38px 1fr; align-items: center; gap: 8px; cursor: pointer; border: 1px solid rgba(148,163,184,.12); }
    .smdh-multi-option input { width: 16px; height: 16px; accent-color: #6ee7b7; }
    .smdh-multi-option small { display: block; color: #94a3b8; }
    .smdh-help { margin: 7px 0 0; color: #94a3b8; }
    .smdh-queue-state { margin-top: 10px; padding: 9px 10px; border: 1px solid rgba(125,211,252,.18); border-radius: 12px; background: rgba(125,211,252,.07); color: #dff7ff; font-weight: 850; }
    .smdh-dungeon.locked, .smdh-multi-option.locked { opacity: .45; }
    .smdh-rank { padding: 7px; border-radius: 9px; background: rgba(125,211,252,.12); color: #7dd3fc; text-align: center; font-weight: 950; }
    #smdh-log { max-height: 145px; overflow: auto; }
  `;
  document.documentElement.appendChild(style);
  document.body.appendChild(root);

  const panel = root.querySelector('#smdh-panel');
  const fab = root.querySelector('#smdh-fab');
  const status = root.querySelector('#smdh-status');
  const log = root.querySelector('#smdh-log');
  const dungeons = root.querySelector('#smdh-dungeons');
  const multiLaunchList = root.querySelector('#smdh-multi-launch');
  const multiCycleList = root.querySelector('#smdh-multi-cycle');
  const mode = root.querySelector('#smdh-mode');
  const selectedDungeon = root.querySelector('#smdh-selected-dungeon');
  const auto = root.querySelector('#smdh-auto');
  const usePotions = root.querySelector('#smdh-use-potions');
  const autoClaim = root.querySelector('#smdh-auto-claim');
  const autoMini = root.querySelector('#smdh-auto-mini');
  const autoAdvent = root.querySelector('#smdh-auto-advent');
  const potionMinRank = root.querySelector('#smdh-potion-min-rank');
  const potionModeInputs = [...root.querySelectorAll('[data-potion-mode]')];
  const dragHandle = root.querySelector('[data-drag-handle]');

  restorePosition();
  attachDrag();

  let suppressFabClick = false;

  fab.addEventListener('click', () => {
    if (suppressFabClick) {
      suppressFabClick = false;
      return;
    }
    panel.hidden = false;
    fab.hidden = true;
    clampToViewport();
    refresh();
  });
  root.querySelector('#smdh-close').addEventListener('click', () => {
    panel.hidden = true;
    fab.hidden = false;
  });
  root.querySelectorAll('[data-tab]').forEach(button => {
    button.addEventListener('click', () => activateTab(button.dataset.tab));
  });
  auto.addEventListener('change', async () => {
    await chrome.runtime.sendMessage({ type: 'smdh_set_auto', enabled: auto.checked });
    await refresh();
  });
  mode.addEventListener('change', async () => {
    await chrome.runtime.sendMessage({ type: 'smdh_set_mode', mode: mode.value });
    await refresh();
  });
  [usePotions, autoClaim, autoMini, autoAdvent, selectedDungeon, potionMinRank, ...potionModeInputs].forEach(input => {
    input.addEventListener('change', saveSettings);
  });
  root.addEventListener('change', event => {
    if (event.target?.matches?.('[data-multi-launch], [data-multi-cycle]')) {
      saveMultiSettings().catch(() => null);
    }
  });
  setInterval(async () => {
    if (!auto.checked) return;
    await chrome.runtime.sendMessage({ type: 'smdh_auto_tick' }).catch(() => null);
    await refresh();
  }, 30000);
  root.addEventListener('click', async event => {
    const action = event.target?.dataset?.action;
    if (!action) return;
    if (action === 'refresh') {
      await refresh();
      return;
    }
    const type = action === 'selected' ? 'smdh_run_selected'
      : action === 'multi-all' ? 'smdh_run_all_dungeons'
        : action === 'multi-launch' ? 'smdh_run_multi_launch'
          : action === 'multi-cycle' ? 'smdh_run_multi_cycle'
            : action === 'run' ? 'smdh_run_once'
              : action === 'batch' ? 'smdh_run_until_blocked'
                : action === 'claim' ? 'smdh_claim'
                  : action === 'advent' ? 'smdh_claim_advent'
                    : action === 'sync' ? 'smdh_sync_mana'
                      : action === 'clear' ? 'smdh_clear_logs'
                        : 'smdh_complete_mini_game';
    status.textContent = 'Выполняю...';
    if (action === 'multi-launch' || action === 'multi-cycle') await saveMultiSettings(false);
    const response = await chrome.runtime.sendMessage({
      type,
      mode: mode.value,
      dungeonId: selectedDungeon.value,
      dungeonIds: action === 'multi-cycle' ? getCheckedDungeonIds('cycle') : getCheckedDungeonIds('launch')
    });
    if (!response?.ok) status.textContent = response?.error || 'Ошибка';
    await refresh();
  });

  function activateTab(tab) {
    root.querySelectorAll('[data-tab]').forEach(node => node.classList.toggle('active', node.dataset.tab === tab));
    root.querySelectorAll('[data-view]').forEach(node => node.classList.toggle('active', node.dataset.view === tab));
    if (tab === 'settings') {
      setText('title', 'Settings');
      setText('subtitle', 'Автопилот, зелья и сбор наград');
      return;
    }
    if (tab === 'multi') {
      setText('title', 'Multi Dungeons');
      setText('subtitle', 'Пачка запусков и цикл выбранных данжей');
      return;
    }
    setText('title', tab === 'dungeons' ? 'Dungeons' : 'Overview');
    setText('subtitle', tab === 'dungeons' ? 'Запуск, сбор наград и очередь подземелий' : 'Профиль, энергия и прогресс события');
  }

  async function refresh() {
    const response = await chrome.runtime.sendMessage({ type: 'smdh_get_state' });
    if (!response?.ok) {
      status.textContent = response?.error || 'Не удалось загрузить состояние.';
      return;
    }
    render(response.state);
  }

  async function saveSettings() {
    const potionModes = {};
    potionModeInputs.forEach(input => {
      potionModes[input.dataset.potionMode] = input.checked;
    });
    await chrome.runtime.sendMessage({
      type: 'smdh_set_settings',
      settings: {
        usePotions: usePotions.checked,
        autoClaim: autoClaim.checked,
        autoMini: autoMini.checked,
        autoAdvent: autoAdvent.checked,
        selectedDungeonId: selectedDungeon.value,
        potionMinRank: potionMinRank.value,
        potionModes
      }
    });
    await refresh();
  }

  async function saveMultiSettings(shouldRefresh = true) {
    await chrome.runtime.sendMessage({
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

    setText('rank', profile.rank || (profile.error ? 'Error' : '-'));
    setText('xp', `${num(profile.xp)} XP`);
    setText('mp', `${num(state.mana?.estimated ?? profile.current_mp)}/${num(profile.max_mp)}`);
    setText('regen', `+${num(profile.mp_regen)} MP / 30 мин`);
    setText('success', num(profile.success_runs));
    setText('failed', num(profile.failed_runs));
    setText('coins', num(profile.coins));
    renderCoinFarmPlan(state.farmPlan, state.forecast, state.efficiency);
    mode.value = stored.mode || 'safe';
    renderDungeonSelect(state.dungeons || [], stored.selectedDungeonId);
    auto.checked = Boolean(stored.auto);
    usePotions.checked = stored.usePotions !== false;
    autoClaim.checked = stored.autoClaim !== false;
    autoMini.checked = stored.autoMini !== false;
    autoAdvent.checked = stored.autoAdvent !== false;
    potionMinRank.value = stored.potionMinRank || 'F';
    potionModeInputs.forEach(input => {
      input.checked = (stored.potionModes || {})[input.dataset.potionMode] !== false;
    });

    const active = state.activeRun;
    const activeCount = Array.isArray(state.activeRuns) ? state.activeRuns.length : (active ? 1 : 0);
    status.innerHTML = !active && state.nextAction?.text
      ? `<strong>Следующее действие</strong><br><span>${escapeHtml(state.nextAction.text)}</span>`
      : active?.dungeon?.rank
      ? renderActiveRunStatus(active, state.activeRunDetails, activeCount)
      : '<strong>Активного данжа нет</strong><br><span>Можно запускать следующий цикл.</span>';
    renderDungeons(state.dungeons || [], profile);
    renderMultiDungeons(state.dungeons || [], profile, stored);
    setText('multiQueue', `Очередь: ${(stored.multiQueueDungeonIds || []).length}`);
    log.innerHTML = (stored.logs || []).slice(0, 10).map(item => `<div>${escapeHtml(item.message)}</div>`).join('') || '<div>Лог пуст.</div>';
  }

  function renderDungeons(items, profile) {
    if (!Array.isArray(items)) items = [];
    const current = RANKS.indexOf(profile?.rank || 'F');
    dungeons.innerHTML = items.map(item => {
      if (!item || !item.rank) return '';
      const locked = RANKS.indexOf(item.rank) > current + 1;
      return `
        <div class="smdh-dungeon ${locked ? 'locked' : ''}">
          <span class="smdh-rank">${escapeHtml(item.rank)}</span>
          <span>${num(item.mp_cost)} MP · ${formatDuration(Number(item.duration_seconds || 0) * 1000)}</span>
          <strong>+${num(item.xp_reward)} XP<br>+${num(item.coin_reward)} монет</strong>
        </div>
      `;
    }).join('') || '<div class="smdh-dungeon">Подземелья не загружены.</div>';
  }

  function renderMultiDungeons(items, profile, stored = {}) {
    renderMultiList(multiLaunchList, items, profile, stored.multiLaunchDungeonIds, 'launch');
    renderMultiList(multiCycleList, items, profile, stored.multiCycleDungeonIds, 'cycle');
  }

  function renderMultiList(container, items, profile, selectedIds = [], kind = 'launch') {
    if (!container) return;
    const selected = new Set((selectedIds || []).map(String));
    const current = RANKS.indexOf(profile?.rank || 'F');
    container.innerHTML = (Array.isArray(items) ? items : []).map(item => {
      const id = String(item?.id || '');
      if (!id || !item?.rank) return '';
      const locked = RANKS.indexOf(item.rank) > current + 1;
      return `
        <label class="smdh-multi-option ${locked ? 'locked' : ''}">
          <input data-multi-${kind} type="checkbox" value="${escapeHtml(id)}" ${selected.has(id) ? 'checked' : ''} ${locked ? 'disabled' : ''}>
          <span class="smdh-rank">${escapeHtml(item.rank)}</span>
          <span><strong>${escapeHtml(item.rank)}-данж</strong><small>${num(item.mp_cost)} MP · ${formatDuration(Number(item.duration_seconds || 0) * 1000)} · +${num(item.xp_reward)} XP</small></span>
        </label>
      `;
    }).join('') || '<div class="smdh-dungeon">Данжи не загружены.</div>';
  }

  function getCheckedDungeonIds(kind) {
    const selector = kind === 'cycle' ? '[data-multi-cycle]:checked' : '[data-multi-launch]:checked';
    return [...root.querySelectorAll(selector)].map(input => Number(input.value)).filter(Boolean);
  }

  function renderDungeonSelect(items, selectedId) {
    const currentValue = String(selectedId || selectedDungeon.value || '');
    const options = ['<option value="">Auto dungeon</option>'];
    for (const item of Array.isArray(items) ? items : []) {
      if (!item?.id || !item?.rank) continue;
      options.push(`<option value="${escapeHtml(item.id)}">${escapeHtml(item.rank)} · ${num(item.mp_cost)} MP · ${formatDuration(Number(item.duration_seconds || 0) * 1000)}</option>`);
    }
    selectedDungeon.innerHTML = options.join('');
    selectedDungeon.value = [...selectedDungeon.options].some(option => option.value === currentValue) ? currentValue : '';
  }

  function setText(role, value) {
    const node = root.querySelector(`[data-role="${role}"]`);
    if (node) node.textContent = value;
  }

  function renderCoinFarmPlan(plan, forecast = null, efficiency = null) {
    const best = plan?.best;
    if (!best) {
      setText('coinFarmRank', '-');
      setText('coinFarmFormula', 'Нет доступных данжей для расчета.');
      setText('coinFarmRate', '-');
      setText('coinFarmExpected', '-');
      setText('coinFarmMp', '-');
      setText('coinFarmByMp', '-');
      setText('coinForecast24', '-');
      setText('coinForecastEvent', '-');
      setText('runWinrate', '-');
      setText('runAvgCoins', '-');
      return;
    }
    const duration = formatDuration(Number(best.duration_seconds || 0) * 1000);
    setText('coinFarmRank', `${best.rank}-данж`);
    setText('coinFarmFormula', `${num(best.mp_cost)} MP · ${duration} · ${Math.round(Number(best.chance || 0))}% шанс · guild +${num(best.guild_bonus)}%${best.potion_text ? ` · ${best.potion_text}` : ''}`);
    setText('coinFarmRate', formatDecimal(best.coins_per_minute));
    setText('coinFarmExpected', num(Math.round(Number(best.expected_coins || 0))));
    setText('coinFarmMp', formatDecimal(best.coins_per_mp));
    setText('coinFarmByMp', plan?.bestByMp ? `${plan.bestByMp.rank} · ${formatDecimal(plan.bestByMp.coins_per_mp)}` : '-');
    setText('coinForecast24', forecast?.next24h ? `${num(Math.round(forecast.next24h.coins))} / ${num(forecast.next24h.runs)} run` : '-');
    setText('coinForecastEvent', forecast?.eventLeft ? `${num(Math.round(forecast.eventLeft.coins))} / ${num(forecast.eventLeft.runs)} run` : '-');
    setText('runWinrate', efficiency?.total ? `${num(efficiency.winrate)}% · ${num(efficiency.success)}/${num(efficiency.total)}` : '-');
    setText('runAvgCoins', efficiency?.success ? num(Math.round(efficiency.avg_coins)) : '-');
  }

  function renderActiveRunStatus(active, details = null, activeCount = 1) {
    const countText = activeCount > 1 ? ` · активных ${activeCount}` : '';
    const base = `<strong>${escapeHtml(active.dungeon.rank)}-данж${countText}</strong><br><span>${active.game_type === 2 ? 'мини-игра ждет завершения' : `готовность ${escapeHtml(formatDate(active.ends_at))}`}</span>`;
    if (!details) return base;
    return `${base}<br><span>~${num(Math.round(details.expected_coins))} монет · ${num(details.xp_reward)} XP · ${Math.round(Number(details.chance || 0))}%</span><br><span>${escapeHtml(details.next_action || '')}</span>`;
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
    if (ms <= 0) return 'готово';
    const minutes = Math.ceil(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return hours ? `${hours}ч ${rest}м` : `${rest}м`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function attachDrag() {
    let dragging = null;
    let moved = false;

    function startDrag(event, source) {
      if (event.button !== 0 || event.target.closest('select,input,label')) return;
      if (source === 'panel' && event.target.closest('button')) return;
      const rect = root.getBoundingClientRect();
      dragging = {
        pointerId: event.pointerId,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        source,
        startX: event.clientX,
        startY: event.clientY
      };
      moved = false;
      event.currentTarget.setPointerCapture(event.pointerId);
      document.body.style.userSelect = 'none';
    }

    function moveDrag(event) {
      if (!dragging || dragging.pointerId !== event.pointerId) return;
      event.preventDefault();
      if (Math.abs(event.clientX - dragging.startX) > 4 || Math.abs(event.clientY - dragging.startY) > 4) {
        moved = true;
      }
      setRootPosition(event.clientX - dragging.offsetX, event.clientY - dragging.offsetY);
    }

    function endDrag(event) {
      if (!dragging || dragging.pointerId !== event.pointerId) return;
      const source = dragging.source;
      dragging = null;
      document.body.style.userSelect = '';
      savePosition();
      if (source === 'fab' && moved) {
        suppressFabClick = true;
        window.setTimeout(() => { suppressFabClick = false; }, 0);
      }
    }

    function cancelDrag() {
      dragging = null;
      document.body.style.userSelect = '';
      savePosition();
    }

    dragHandle.addEventListener('pointerdown', event => startDrag(event, 'panel'));
    dragHandle.addEventListener('pointermove', moveDrag);
    dragHandle.addEventListener('pointerup', endDrag);
    dragHandle.addEventListener('pointercancel', cancelDrag);

    fab.addEventListener('pointerdown', event => startDrag(event, 'fab'));
    fab.addEventListener('pointermove', moveDrag);
    fab.addEventListener('pointerup', endDrag);
    fab.addEventListener('pointercancel', cancelDrag);

    window.addEventListener('resize', () => {
      clampToViewport();
      savePosition();
    });
  }

  function setRootPosition(left, top) {
    const rect = root.getBoundingClientRect();
    const width = rect.width || 48;
    const height = rect.height || 48;
    const maxLeft = Math.max(8, window.innerWidth - width - 8);
    const maxTop = Math.max(8, window.innerHeight - height - 8);
    const nextLeft = Math.min(Math.max(8, left), maxLeft);
    const nextTop = Math.min(Math.max(8, top), maxTop);
    root.style.left = `${nextLeft}px`;
    root.style.top = `${nextTop}px`;
    root.style.right = 'auto';
    root.style.bottom = 'auto';
  }

  function clampToViewport() {
    const rect = root.getBoundingClientRect();
    if (!Number.isFinite(rect.left) || !Number.isFinite(rect.top)) return;
    setRootPosition(rect.left, rect.top);
  }

  function savePosition() {
    const rect = root.getBoundingClientRect();
    chrome.storage?.local?.set?.({
      smdhOverlayPosition: {
        left: Math.round(rect.left),
        top: Math.round(rect.top)
      }
    });
  }

  function restorePosition() {
    chrome.storage?.local?.get?.(['smdhOverlayPosition'], data => {
      const position = data?.smdhOverlayPosition;
      if (!position) return;
      setRootPosition(Number(position.left), Number(position.top));
    });
  }
})();
