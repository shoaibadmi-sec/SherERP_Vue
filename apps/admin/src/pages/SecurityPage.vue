<script setup lang="ts">
import { ref } from 'vue';

import { ControlApiError } from '../api/client';
import { changePassword, session } from '../api/session';

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const code = ref('');
const busy = ref(false);
const error = ref('');
const success = ref('');

async function submit(): Promise<void> {
  error.value = '';
  success.value = '';
  if (newPassword.value.length < 12) {
    error.value = 'New password must be at least 12 characters.';
    return;
  }
  if (newPassword.value === currentPassword.value) {
    error.value = 'New password must be different from the current password.';
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'New password and confirmation do not match.';
    return;
  }
  if (!/^[0-9]{6}$/u.test(code.value.trim())) {
    error.value = 'Enter the current 6-digit authenticator code.';
    return;
  }

  busy.value = true;
  try {
    await changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
      code: code.value.trim(),
    });
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    code.value = '';
    success.value = 'Password changed. Your other signed-in sessions were revoked.';
  } catch (caught) {
    error.value =
      caught instanceof ControlApiError
        ? caught.message
        : 'Could not change the password. Try again.';
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <section>
    <h2>Security</h2>
    <p class="lede">Change the password for {{ session.operator?.email }}.</p>

    <form class="ctl-card ctl-security-form" @submit.prevent="submit">
      <label class="ctl" for="current-password">Current password</label>
      <input
        id="current-password"
        v-model="currentPassword"
        class="ctl"
        type="password"
        autocomplete="current-password"
        required
      />

      <label class="ctl" for="new-password">New password</label>
      <input
        id="new-password"
        v-model="newPassword"
        class="ctl"
        type="password"
        autocomplete="new-password"
        minlength="12"
        required
      />
      <p class="ctl-note">Use at least 12 characters. A long passphrase is welcome.</p>

      <label class="ctl" for="confirm-password">Confirm new password</label>
      <input
        id="confirm-password"
        v-model="confirmPassword"
        class="ctl"
        type="password"
        autocomplete="new-password"
        minlength="12"
        required
      />

      <label class="ctl" for="authenticator-code">Authenticator code</label>
      <input
        id="authenticator-code"
        v-model="code"
        class="ctl mono"
        inputmode="numeric"
        autocomplete="one-time-code"
        maxlength="6"
        required
      />

      <p v-if="error" class="ctl-error" role="alert">{{ error }}</p>
      <p v-if="success" class="ctl-success" role="status">{{ success }}</p>

      <footer class="ctl-form-actions">
        <button class="ctl primary" type="submit" :disabled="busy">
          {{ busy ? 'Changing…' : 'Change password' }}
        </button>
      </footer>
    </form>
  </section>
</template>
