<script lang="ts">
import { defineComponent } from 'vue';
import { useUserStore } from './store';
import { onMounted } from 'vue';

export default defineComponent({
  name: 'App',
  setup() {
    const userStore = useUserStore();

    onMounted(() => {
      userStore.init();
    });

    return {
      userStore
    };
  }
});
</script>

<template>
  <header class="w-full flex justify-center items-center mt-10">
    <img src="./assets/wch_metkovic_logo300.png" class="w-[40vw] md:w-[15vw]" />
  </header>
  <main class="w-full flex justify-center items-center mt-16 md:mt-10">
    <router-view></router-view>
  </main>
</template>

<style scoped></style>
