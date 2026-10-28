<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref } from 'vue';
import { useRoute } from 'vue-router';

import { can, session, signOut } from '../api/session';
import ReauthDialog from './ReauthDialog.vue';
import { useControlTheme } from '../theme';

/**
 * The console frame: navigation, the operator's identity, and the tenant banner.
 *
 * **The banner is the point.** Whenever a customer's context is open — a
 * customer page, an installation, a support session — their name sits at the
 * top of the screen and cannot be scrolled away from (owner decision
 * 2026-09-03). The console can embed a live shop in an iframe, so at some point
 * every operator will have two SherERPs on screen; the banner and the deliberately
 * different colour scheme are what stop the wrong one being acted on.
 *
 * Navigation is filtered by permission, which is presentation only. Every route
 * on the control plane checks the operator's role itself — a hidden button in
 * front of a server that would refuse anyway is a courtesy, not a boundary.
 */
const route = useRoute();
const { theme, toggle: toggleTheme } = useControlTheme();
const sidebarCollapsed = ref(false);
const mobileNavOpen = ref(false);
const accountMenuOpen = ref(false);

function applyDefaultNavigation(): void {
  const mobile = window.matchMedia('(max-width: 640px)').matches;
  if (mobile) {
    mobileNavOpen.value = false;
    return;
  }
  const saved = localStorage.getItem('sher.control.sidebar.collapsed');
  sidebarCollapsed.value = saved === null
    ? window.matchMedia('(max-width: 1024px)').matches
    : saved === 'true';
}

function toggleNavigation(): void {
  if (window.matchMedia('(max-width: 640px)').matches) {
    mobileNavOpen.value = !mobileNavOpen.value;
    return;
  }
  sidebarCollapsed.value = !sidebarCollapsed.value;
  localStorage.setItem('sher.control.sidebar.collapsed', String(sidebarCollapsed.value));
}

onMounted(() => {
  applyDefaultNavigation();
  window.addEventListener('resize', applyDefaultNavigation);
});
onBeforeUnmount(() => window.removeEventListener('resize', applyDefaultNavigation));

const reauth = ref<{ open: boolean; permission: string; resolve: (() => void) | null }>({
  open: false,
  permission: '',
  resolve: null,
});

/**
 * Any screen can ask for a re-authentication and continue where it left off.
 *
 * Provided rather than imported so a page does not have to know how the dialog
 * is rendered; it awaits a promise and retries its own call.
 */
provide('requireReauth', (permission: string): Promise<void> => {
  return new Promise((resolve) => {
    reauth.value = { open: true, permission, resolve };
  });
});

function reauthDone(): void {
  reauth.value.resolve?.();
  reauth.value = { open: false, permission: '', resolve: null };
}

function reauthCancel(): void {
  reauth.value = { open: false, permission: '', resolve: null };
}

const tenantBanner = computed(() => {
  const name = route.meta['tenantName'];
  const id = route.meta['tenantId'];
  if (typeof name !== 'string' || name === '') return null;
  return { name, id: typeof id === 'string' ? id : '' };
});

const links = computed(() =>
  [
    { to: '/', label: 'Overview', icon: 'pi-home', need: 'installation.view' },
    { to: '/customers', label: 'Customers', icon: 'pi-building', need: 'tenant.view' },
    { to: '/installations', label: 'Installations', icon: 'pi-desktop', need: 'installation.view' },
    { to: '/licences', label: 'Licences', icon: 'pi-id-card', need: 'licence.view' },
    { to: '/releases', label: 'Releases', icon: 'pi-box', need: 'release.view' },
    { to: '/deployments', label: 'Deployments', icon: 'pi-send', need: 'deployment.view' },
    { to: '/known-issues', label: 'Known issues', icon: 'pi-exclamation-circle', need: 'issue.view' },
    { to: '/support', label: 'Support', icon: 'pi-headphones', need: 'support.view' },
    { to: '/audit', label: 'Audit', icon: 'pi-history', need: 'audit.view' },
  ].filter((link) => can(link.need)),
);
</script>

<template>
  <div class="ctl-shell" :class="{ 'nav-collapsed': sidebarCollapsed, 'nav-open': mobileNavOpen }">
    <header class="ctl-mobile-header">
      <button class="ctl icon-only" type="button" aria-label="Open navigation" @click="toggleNavigation">
        <i class="pi pi-bars" aria-hidden="true" />
      </button>
      <strong>SherERP Control</strong>
      <button class="ctl icon-only" type="button" :aria-label="theme === 'dark' ? 'Use light theme' : 'Use dark theme'" @click="toggleTheme">
        <i class="pi" :class="theme === 'dark' ? 'pi-sun' : 'pi-moon'" aria-hidden="true" />
      </button>
    </header>

    <button v-if="mobileNavOpen" class="ctl-nav-scrim" type="button" aria-label="Close navigation" @click="mobileNavOpen = false" />
    <nav class="ctl-nav" aria-label="Control console">
      <div class="ctl-brand">
        <span class="ctl-brand-mark" aria-hidden="true">S</span>
        <span class="ctl-brand-copy"><strong>SherERP Control</strong><small>Vendor operations</small></span>
      </div>
      <button class="ctl icon-only ctl-collapse" type="button" :aria-label="sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'" @click="toggleNavigation">
        <i class="pi" :class="sidebarCollapsed ? 'pi-angle-right' : 'pi-angle-left'" aria-hidden="true" />
      </button>
      <RouterLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        :class="{ active: route.path === link.to || (link.to !== '/' && route.path.startsWith(link.to)) }"
        :aria-label="link.label"
        :title="sidebarCollapsed ? link.label : undefined"
        @click="mobileNavOpen = false"
      >
        <i class="pi" :class="link.icon" aria-hidden="true" />
        <span class="nav-label">{{ link.label }}</span>
      </RouterLink>
      <div class="spacer" />
      <div class="ctl-account">
        <button
          class="ctl-account-trigger"
          type="button"
          :aria-expanded="accountMenuOpen"
          aria-haspopup="menu"
          aria-label="Open account menu"
          @click="accountMenuOpen = !accountMenuOpen"
        >
          <i class="pi pi-user" aria-hidden="true" />
          <span class="who">
            <strong>{{ session.operator?.name }}</strong>
            <span>{{ session.operator?.role.replace('_', ' ').toLowerCase() }}</span>
          </span>
          <i class="pi pi-angle-up nav-label" aria-hidden="true" />
        </button>
        <div v-if="accountMenuOpen" class="ctl-account-menu" role="menu">
          <RouterLink to="/security" role="menuitem" @click="accountMenuOpen = false; mobileNavOpen = false">
            <i class="pi pi-lock" aria-hidden="true" />
            <span>Security</span>
          </RouterLink>
        </div>
      </div>
      <div class="ctl-nav-actions">
        <button class="ctl icon-only" type="button" :aria-label="theme === 'dark' ? 'Use light theme' : 'Use dark theme'" @click="toggleTheme">
          <i class="pi" :class="theme === 'dark' ? 'pi-sun' : 'pi-moon'" aria-hidden="true" />
        </button>
        <button class="ctl sign-out" type="button" @click="signOut().then(() => $router.push('/login'))">
          <i class="pi pi-sign-out" aria-hidden="true" />
          <span class="nav-label">Sign out</span>
        </button>
      </div>
    </nav>

    <main class="ctl-main">
      <div v-if="tenantBanner" class="ctl-tenant-banner">
        <span>Customer: {{ tenantBanner.name }}</span>
        <span v-if="tenantBanner.id" class="id mono">{{ tenantBanner.id }}</span>
      </div>
      <RouterView />
    </main>

    <ReauthDialog
      :open="reauth.open"
      :permission="reauth.permission"
      @done="reauthDone"
      @cancel="reauthCancel"
    />
  </div>
</template>
