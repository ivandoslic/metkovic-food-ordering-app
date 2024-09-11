<template>
  <div class="bg-gray-200 py-6 px-3 lg:px-6 rounded-lg shadow-lg w-[80%] md:w-[30%] max-w-sm">
    <h2 class="text-2xl font-semibold text-center text-gray-800 mb-6">Login</h2>
    <form @submit.prevent>
      <input
        type="text"
        placeholder="Username"
        v-model="username"
        class="w-full p-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#262262]"
        required
      />
      <input
        type="password"
        placeholder="Password"
        v-model="password"
        class="w-full p-2 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#262262]"
        required
      />
      <button
        type="submit"
        class="w-full p-2 bg-[#262262] text-white rounded-lg hover:bg-blue-700 transition-colors"
        @click="loginAction"
      >
        Login
      </button>
    </form>
  </div>
</template>

<script lang="ts">
import { useUserStore } from '../store';
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'LoginPage',
  setup() {
    const username = ref('');
    const password = ref('');

    const loginAction = async () => {
      // TODO: Do some error handling PLEASE!
      if (username.value.trim().length === 0 || password.value.trim().length === 0) return;

      const userStore = useUserStore();

      const fakeMail = `${username.value}@kajakFood.hr`;

      try {
        await userStore.loginUser(fakeMail, password.value);
      } catch (err) {
        console.error(err);
      }
    };

    return {
      username,
      password,
      loginAction
    };
  }
});
</script>

<style></style>
