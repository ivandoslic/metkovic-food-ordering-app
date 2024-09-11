<template>
  <div class="w-full flex flex-col md:flex-row">
    <div class="flex flex-1 items-center flex-col px-5 w-full">
      <h2 class="text-2xl font-semibold mb-4">Add Teams</h2>
      <form @submit.prevent="addTeam" class="w-full md:w-[50%]">
        <label for="teamName" class="block mb-2 font-medium">Team Name</label>
        <input
          v-model="teamName"
          id="teamName"
          type="text"
          placeholder="Enter team name"
          class="block w-full p-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <label for="password" class="block mb-2 font-medium">Password</label>
        <input
          v-model="password"
          id="password"
          type="password"
          placeholder="Enter password"
          class="block w-full p-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <label for="isoTag" class="block mb-2 font-medium">ISO Tag (2 Letter)</label>
        <input
          v-model="isoTag"
          id="isoTag"
          type="text"
          placeholder="Enter team name"
          class="block w-full p-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          type="submit"
          class="w-full p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Add Team
        </button>
      </form>
    </div>
    <div class="flex flex-1 items-center flex-col mt-5 md:mt-0 px-5">
      <h2 class="text-2xl font-semibold mb-4">Orders</h2>
      <label for="date" class="block mb-2 font-medium">Select Date</label>
      <select
        v-model="selectedDate"
        @change="updateMealCountList"
        id="date"
        class="block w-full md:w-[50%] p-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
      >
        <option v-for="date in availableDates" :key="date.toISOString()" :value="date">
          {{ formatDate(date) }}
        </option>
      </select>

      <div class="w-full overflow-y-auto" style="max-height: calc(3 * 5rem)">
        <ul>
          <li
            v-for="team in teams"
            :key="team.uid"
            class="mb-2 p-4 border border-gray-300 rounded-lg bg-white shadow hover:bg-gray-100 transition-colors"
          >
            <div class="flex justify-between items-center w-full">
              <div class="flex flex-row w-[80%]">
                <span class="font-semibold text-gray-800 w-[20%]">{{ team.name }}</span>
                <img
                  class="ml-2 hidden md:block"
                  :src="`https://flagcdn.com/24x18/${team.tag}.png`"
                  :srcset="`https://flagcdn.com/48x36/${team.tag}.png 2x, https://flagcdn.com/72x54/${team.tag}.png 3x`"
                  height="18"
                  width="36"
                  :alt="`${team.name}`"
                />
                <p v-if="!team.restaurant" class="font-bold text-[red] ml-8">
                  &#9888;No restaurant selected!&#9888;
                </p>
                <p v-else class="ml-8">{{ `Eating at: ${team.restaurant}` }}</p>
              </div>
              <span class="text-blue-600 font-medium">
                {{ getNumberOfMealsForUid(team.uid) }} meals
              </span>
            </div>
          </li>
        </ul>
      </div>

      <button
        type="button"
        class="p-2 bg-[#262262] text-white rounded-lg hover:bg-blue-700 transition-colors mt-3"
        @click="logoutAction"
      >
        Logout
      </button>
      <button
        type="button"
        class="p-2 bg-[#262262] text-white rounded-lg hover:bg-blue-700 transition-colors mt-3"
        @click="downloadSelectedDataInExcel"
      >
        Download Excel
      </button>
    </div>
    <div
      v-if="loading"
      class="absolute inset-0 h-[100vh] flex items-center justify-center bg-black bg-opacity-50 z-50"
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
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import { useUserStore } from '../store';
import { createTeam, getMealsForDate, getTeams } from '../services/firestore-service';
import type { CompetitionTeam, TeamSpecificDateReservation } from '../types/FoodReservationTypes';
import { generateExcel } from '../services/excel-service';

export default defineComponent({
  name: 'AdminPage',
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

    const teamName = ref<string>('');
    const password = ref<string>('');
    const isoTag = ref<string>('');
    const teams = ref<CompetitionTeam[]>([]);
    const selectedDate = ref<Date>(availableDates[0]);
    const mealCountList = ref<TeamSpecificDateReservation[] | null>(null);
    const loading = ref(false);
    const uploadSuccess = ref(false);

    onMounted(() => {
      populateData();
    });

    const populateData = async () => {
      teams.value = await getTeams();
      updateMealCountList();
    };

    const updateMealCountList = () => {
      mealCountList.value = getMealsForDate(teams.value, selectedDate.value.toISOString());
    };

    const getNumberOfMealsForUid = (uid: string) => {
      if (!mealCountList.value) return 0;
      let result = 0;
      mealCountList.value.forEach((mealCountDesc) => {
        if (mealCountDesc.uid === uid) result = mealCountDesc.numberOfMeals;
      });
      return result;
    };

    const downloadSelectedDataInExcel = async () => {
      await generateExcel(selectedDate.value);
    };

    const addTeam = async () => {
      loading.value = true;
      if (teamName.value && password.value) {
        await createTeam(teamName.value, password.value, isoTag.value);

        // reset the inputs
        teamName.value = '';
        password.value = '';
        isoTag.value = '';
        uploadSuccess.value = true;
        setTimeout(() => {
          uploadSuccess.value = false;
          loading.value = false;
        }, 1500);
      }
      loading.value = false;
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
      teamName,
      password,
      selectedDate,
      availableDates,
      teams,
      addTeam,
      formatDate,
      logoutAction,
      updateMealCountList,
      getNumberOfMealsForUid,
      loading,
      uploadSuccess,
      downloadSelectedDataInExcel,
      isoTag
    };
  }
});
</script>

<style></style>
