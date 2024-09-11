<template>
  <div class="w-full px-4 flex flex-col md:w-[30%]">
    <div class="w-full flex flex-col justify-center items-center">
      <img
        v-if="currentTeamInfo && currentTeamInfo.tag"
        class="ml-2 hidden md:block"
        :src="`https://flagcdn.com/24x18/${currentTeamInfo?.tag}.png`"
        :srcset="`https://flagcdn.com/48x36/${currentTeamInfo?.tag}.png 2x, https://flagcdn.com/72x54/${currentTeamInfo?.tag}.png 3x`"
        height="18"
        width="36"
        :alt="`${currentTeamInfo?.name}`"
      />
      <h2 class="text-2xl font-semibold text-center mt-3 mb-6">Meal Selection</h2>
    </div>
    <form @submit.prevent="handleSubmit">
      <label for="date" class="block mb-2 font-medium">Select Date</label>
      <select
        v-model="selectedDate"
        id="date"
        class="block w-full p-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
      >
        <option v-for="date in availableDates" :key="date.toISOString()" :value="date">
          {{ formatDate(date) }}
        </option>
      </select>
      <div class="w-full flex flex-col items-center">
        <label for="meals" class="block mb-2 font-medium">Number of meals for your team</label>
        <div class="flex items-center mb-4">
          <button
            type="button"
            @click="decrementMeals"
            class="p-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            -
          </button>
          <input
            type="number"
            v-model.number="meals"
            id="meals"
            class="mx-4 w-16 p-2 text-center border border-gray-300 rounded-lg focus:outline-none"
            readonly
          />
          <button
            type="button"
            @click="incrementMeals"
            class="p-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            +
          </button>
        </div>
      </div>

      <button
        type="submit"
        :disabled="!canModify"
        class="w-full p-2 bg-[#262262] text-white rounded-lg hover:bg-blue-700 transition-colors mt-3 disabled:bg-gray-400"
      >
        Save
      </button>
    </form>

    <p v-if="!canModify" class="mt-4 text-center text-red-600">
      You cannot modify the number of meals for the selected date after 5 PM.
    </p>

    <button
      type="submit"
      class="w-full p-2 bg-[#262262] text-white rounded-lg hover:bg-blue-700 transition-colors mt-3"
      @click="logoutAction"
    >
      Logout
    </button>
    <div
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
    >
      <div class="bg-white w-[70vw] md:w-[20vw] h-[20vh] rounded">
        <div v-if="!uploadSuccess" class="flex w-full h-full justify-center items-center flex-col">
          <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle class="spinner_qM83" cx="4" cy="12" r="3" />
            <circle class="spinner_qM83 spinner_oXPr" cx="12" cy="12" r="3" />
            <circle class="spinner_qM83 spinner_ZTLf" cx="20" cy="12" r="3" />
          </svg>
          <h2>Saving</h2>
        </div>
        <div v-else class="text-center flex w-full h-full justify-center items-center flex-col">
          <svg
            class="h-16 w-16 mx-auto text-green-500 animated-checkmark"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <p class="mt-2">Saved!</p>
        </div>
      </div>
    </div>
    <div
      v-if="!currentTeamInfo?.restaurant"
      class="absolute w-full h-full bg-black/50 top-0 md:top-[10] left-0 flex justify-center items-center"
    >
      <div
        class="bg-white p-5 rounded w-[90%] md:w-[50%] h-[40%] flex flex-col items-center justify-evenly"
      >
        <h1 class="text-3xl font-bold text-center">
          Welcome {{ currentTeamInfo?.name.toLocaleUpperCase() }}!
        </h1>
        <br />
        <div class="flex flex-col justify-center items-center w-full">
          <h1 class="text-xl text-center">You have to select where you're eating first:</h1>
          <br />
          <select
            id="restaurant"
            class="block w-full md:w-[50%] p-2 mt-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            placeholder="Pick a place for eating"
            v-model="selectedPlaceForEating"
          >
            <option value="field">In the field</option>
            <option value="hotel">In the hotel/hostel</option>
          </select>
        </div>
        <button
          type="submit"
          class="w-[30%] p-2 bg-[#262262] text-white rounded-lg hover:bg-blue-700 transition-colors mt-3 disabled:bg-gray-400"
          @click="savePlaceForEating"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { useUserStore } from '../store';
import {
  getTeamProfile,
  saveEatingPlaceToDatabase,
  updateMealCount
} from '../services/firestore-service';
import type { CompetitionTeam } from '../types/FoodReservationTypes';

export default defineComponent({
  name: 'HomePage',
  setup() {
    const availableDates = [
      new Date('2024-09-16'),
      new Date('2024-09-17'),
      new Date('2024-09-18'),
      new Date('2024-09-19'),
      new Date('2024-09-20'),
      new Date('2024-09-21'),
      new Date('2024-09-22')
    ];

    const selectedDate = ref<Date>(availableDates[0]);
    const meals = ref<number>(0);
    const loading = ref(false);
    const uploadSuccess = ref(false);
    const currentTeamInfo = ref<CompetitionTeam | null>(null);
    const selectedPlaceForEating = ref('field');

    onMounted(() => {
      getCurrentTeamInfo();
    });

    watch(selectedDate, (newDate) => {
      if (currentTeamInfo.value && currentTeamInfo.value.meals[newDate.toISOString()]) {
        meals.value = currentTeamInfo.value.meals[newDate.toISOString()];
      } else {
        meals.value = 0;
      }
    });

    const getCurrentTeamInfo = async () => {
      const userStore = useUserStore();
      if (!userStore.userData) return;
      const uid = userStore.userData.uid as string;
      const teamObj = await getTeamProfile(uid);
      currentTeamInfo.value = teamObj;
      if (teamObj?.meals[new Date('2024-09-16').toISOString()])
        meals.value = teamObj?.meals[new Date('2024-09-16').toISOString()];
    };

    const canModify = computed(() => {
      const now = new Date();
      const selected = selectedDate.value;

      if (
        selected.getDate() === now.getDate() &&
        selected.getMonth() === now.getMonth() &&
        selected.getFullYear() === now.getFullYear()
      ) {
        return now.getHours() < 17; // Restrict changes after 5 PM on the current date
      }

      return selected > now; // Allow changes for future dates
    });

    const savePlaceForEating = async () => {
      console.log(selectedPlaceForEating.value);
      if (!selectedPlaceForEating.value || !currentTeamInfo.value || !currentTeamInfo.value.uid)
        return;

      loading.value = true;

      try {
        await saveEatingPlaceToDatabase(currentTeamInfo.value?.uid, selectedPlaceForEating.value);
        uploadSuccess.value = true;
        setTimeout(() => {
          uploadSuccess.value = false;
          if (currentTeamInfo.value)
            currentTeamInfo.value.restaurant = selectedPlaceForEating.value;
          loading.value = false;
        }, 1500);
      } catch (e) {
        console.error(e);
        loading.value = false;
      }
    };

    const incrementMeals = () => {
      meals.value++;
    };

    const decrementMeals = () => {
      if (meals.value > 0) {
        meals.value--;
      }
    };

    const handleSubmit = async () => {
      if (canModify.value) {
        const userStore = useUserStore();
        if (userStore.userData) {
          loading.value = true;
          try {
            const uid = userStore.userData.uid as string;
            await updateMealCount(uid, selectedDate.value.toISOString(), meals.value);
            if (currentTeamInfo.value)
              currentTeamInfo.value.meals[selectedDate.value.toISOString()] = meals.value;
            uploadSuccess.value = true;
            setTimeout(() => {
              uploadSuccess.value = false;
              loading.value = false;
            }, 1500);
          } catch (error) {
            console.error('Error updating meal count:', error); // TODO: Add error indicator
            loading.value = false;
          }
        }
      }
    };

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
    };

    const logoutAction = () => {
      const userStore = useUserStore();
      userStore.logoutUser();
    };

    return {
      logoutAction,
      availableDates,
      selectedDate,
      meals,
      currentTeamInfo,
      selectedPlaceForEating,
      canModify,
      incrementMeals,
      decrementMeals,
      handleSubmit,
      savePlaceForEating,
      formatDate,
      loading,
      uploadSuccess
    };
  }
});
</script>

<style></style>
