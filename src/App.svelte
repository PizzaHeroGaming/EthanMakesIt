<script>
  import '../src/styles/main.css';
  import { onMount } from 'svelte';
  import { gs, pushNotification } from './lib/state.svelte.js';
  import { ACTIONS, COOK_IDS, TICKERS } from './lib/data.js';
  import {
    isActionUnlocked, reapplyUpgrades, startAction, checkUnlocks, checkMilestones,
  } from './lib/actions.js';
  import { loadGame, applyOfflineProgress, saveGame } from './lib/save.js';
  import { getHypeDecayRate } from './lib/prestige.js';
  import {
    scheduleNextSpawn, tickStall, tickMealSpoilage,
  } from './lib/stall.js';

  import Header from './components/Header.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import ActionsTab from './components/ActionsTab.svelte';
  import UpgradesTab from './components/UpgradesTab.svelte';
  import MilestonesTab from './components/MilestonesTab.svelte';
  import StaffTab from './components/StaffTab.svelte';
  import StallTab from './components/StallTab.svelte';
  import PrestigeShop from './components/PrestigeShop.svelte';
  import PrestigeModal from './components/PrestigeModal.svelte';
  import MenuOverlay from './components/MenuOverlay.svelte';
  import Tutorial from './components/Tutorial.svelte';
  import Notifications from './components/Notifications.svelte';

  const tabs = [
    { id: 'actions', label: 'Actions' },
    { id: 'stall', label: 'Stall', badge: 'gold' },
    { id: 'upgrades', label: 'Upgrades', badge: 'green' },
    { id: 'milestones', label: 'Milestones' },
    { id: 'staff', label: 'Staff', badge: 'green' },
    { id: 'prestige', label: 'Prestige' },
  ];

  const stallBadgeActive = $derived(gs.stallCustomers.length > 0);
  const upgradesBadgeActive = $derived(false); // computed below via $effect-like approach if needed
  // We'll compute simply with a $derived using imports — done at render time.
  import { UPGRADES_DEF } from './lib/data.js';
  import { isUpgradeUnlocked, getManagerCost } from './lib/actions.js';
  const hasAffordableUpgrade = $derived(
    UPGRADES_DEF.some(
      (u) => !gs.G.ownedUpgrades.includes(u.id) && isUpgradeUnlocked(u) && gs.G.money >= u.cost,
    ),
  );
  const hasAffordableStaff = $derived(
    ACTIONS.some(
      (a) =>
        a.managerCost &&
        !COOK_IDS.includes(a.id) &&
        !gs.G.managers.includes(a.id) &&
        isActionUnlocked(a) &&
        gs.G.money >= getManagerCost(a),
    ),
  );

  function badgeActive(id) {
    if (id === 'stall') return stallBadgeActive;
    if (id === 'upgrades') return hasAffordableUpgrade;
    if (id === 'staff') return hasAffordableStaff;
    return false;
  }

  onMount(() => {
    document.documentElement.setAttribute('data-theme', gs.theme);

    // V3 migration prompt: discard old incompatible save once.
    let showMigration = false;
    try {
      if (localStorage.getItem('ethanV3') && !localStorage.getItem('ethanV4')) {
        showMigration = true;
        localStorage.removeItem('ethanV3');
      }
    } catch (e) {}

    const savedAt = loadGame();
    const loaded = savedAt !== 0;

    if (loaded) {
      reapplyUpgrades();
      ACTIONS.forEach((a) => {
        if (isActionUnlocked(a)) gs.prevUnlockedActions.add(a.id);
      });
      applyOfflineProgress(savedAt);
      Object.keys(gs.G.actionTimers).forEach((id) => {
        if (gs.G.actionTimers[id].running && !COOK_IDS.includes(id)) startAction(id);
      });
      if (gs.G.activeCookId && gs.G.actionTimers[gs.G.activeCookId]?.running) {
        startAction(gs.G.activeCookId);
      }
      gs.incomeBaseline = gs.G.money;
      gs.incomeBaselineTime = Date.now();
    }

    try {
      if (localStorage.getItem('ethanTutDone') || loaded) {
        gs.tutorialOpen = false;
        if (loaded) pushNotification('Welcome back!', 'blue');
      }
    } catch (e) {
      gs.tutorialOpen = false;
    }

    if (showMigration) {
      pushNotification('Save updated to V4 — starting fresh.', '');
    }

    checkUnlocks();

    // Intervals
    const incomeInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - gs.incomeBaselineTime) / 1000;
      if (elapsed > 0) {
        const earned = Math.max(0, gs.G.money - gs.incomeBaseline);
        const rate = earned / elapsed;
        gs.smoothedIncome = gs.smoothedIncome * 0.75 + rate * 0.25;
        gs.incomeBaseline = gs.G.money;
        gs.incomeBaselineTime = now;
      }
    }, 2000);

    const stallTickInterval = setInterval(tickStall, 120);
    const spoilInterval = setInterval(tickMealSpoilage, 1000);
    scheduleNextSpawn();

    const mainTick = setInterval(() => {
      gs.G.hype = Math.max(0, gs.G.hype - getHypeDecayRate());
      if (gs.G.hype > 25 && gs.G.totalEdits > 0) {
        gs.G.subs += (gs.G.hype / 100) * gs.G.mx.sub * 0.1;
        gs.G.views += gs.G.subs * 0.00005 * gs.G.mx.view;
      }
      gs.G.tick++;
      checkMilestones();
      checkUnlocks();
    }, 500);

    const tickerInterval = setInterval(() => {
      gs.tickIdx = (gs.tickIdx + 1) % TICKERS.length;
    }, 9000);

    const saveInterval = setInterval(saveGame, 15000);

    return () => {
      clearInterval(incomeInterval);
      clearInterval(stallTickInterval);
      clearInterval(spoilInterval);
      clearInterval(mainTick);
      clearInterval(tickerInterval);
      clearInterval(saveInterval);
    };
  });
</script>

<Header onmenu={() => (gs.menuOpen = true)} />

<div id="layout">
  <Sidebar />

  <div id="main">
    <div id="tabs">
      {#each tabs as t}
        <button class="tab-btn" class:active={gs.currentTab === t.id}
                onclick={() => (gs.currentTab = t.id)}>
          {t.label}
          {#if t.badge && badgeActive(t.id)}
            <span class="tab-notify {t.badge}"></span>
          {/if}
        </button>
      {/each}
    </div>

    {#if gs.currentTab === 'actions'}<ActionsTab />{/if}
    {#if gs.currentTab === 'stall'}<StallTab />{/if}
    {#if gs.currentTab === 'upgrades'}<UpgradesTab />{/if}
    {#if gs.currentTab === 'milestones'}<MilestonesTab />{/if}
    {#if gs.currentTab === 'staff'}<StaffTab />{/if}
    {#if gs.currentTab === 'prestige'}<PrestigeShop />{/if}
  </div>
</div>

<PrestigeModal />
<MenuOverlay />
<Tutorial />
<Notifications />
