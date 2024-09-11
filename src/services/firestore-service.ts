import { auth, db } from '@/firebaseConfig';
import type { CompetitionTeam, TeamSpecificDateReservation } from '@/types/FoodReservationTypes';
import { storeInCache, getFromCache } from './localstorage-service';

import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  onSnapshot,
  getDocFromCache
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export async function updateMealCount(uid: string, date: string, mealCount: number) {
  const mealRef = doc(db, 'teams', uid);
  await setDoc(mealRef, { [date]: mealCount }, { merge: true });
}

export async function getTeams(): Promise<CompetitionTeam[]> {
  const teamsLocalList = getFromCache('teams');

  if (teamsLocalList) return teamsLocalList;

  const teamsRef = collection(db, 'teams');
  const teamsDocs = await getDocs(teamsRef);

  const teamsList: CompetitionTeam[] = [];
  teamsDocs.docs.forEach((doc) => {
    const docData = doc.data();
    const teamName = docData.name;
    const isoTag = docData.tag;
    delete docData.name;
    delete docData.tag;

    let restaurant = null;
    if (docData.restaurant) {
      restaurant = docData.restaurant;
      delete docData.restaurant;
    }

    const teamItem = {
      uid: doc.id,
      name: teamName,
      tag: isoTag,
      restaurant,
      meals: docData
    };
    teamsList.push(teamItem);
  });

  storeInCache('teams', teamsList, 5 * 60 * 60 * 1000);
  return teamsList;
}

export function getMealsForDate(
  teamsDetailList: CompetitionTeam[],
  targetDate: string
): TeamSpecificDateReservation[] {
  const result: TeamSpecificDateReservation[] = [];

  teamsDetailList.forEach((teamDetails) => {
    if (!teamDetails.meals[targetDate]) return;
    result.push({
      uid: teamDetails.uid,
      numberOfMeals: teamDetails.meals[targetDate]
    });
  });

  return result;
}

export async function createTeam(teamName: string, password: string, isoTag: string) {
  const fakeEmail = `${teamName}@kajakFood.hr`;
  const { user } = await createUserWithEmailAndPassword(auth, fakeEmail, password);

  const newDoc = {
    name: teamName,
    tag: isoTag,
    [new Date('2024-09-16').toISOString()]: 0,
    [new Date('2024-09-17').toISOString()]: 0,
    [new Date('2024-09-18').toISOString()]: 0,
    [new Date('2024-09-19').toISOString()]: 0,
    [new Date('2024-09-20').toISOString()]: 0,
    [new Date('2024-09-21').toISOString()]: 0,
    [new Date('2024-09-22').toISOString()]: 0
  };

  await auth
    .signOut()
    .then(() =>
      signInWithEmailAndPassword(
        auth,
        import.meta.env.VITE_ADMIN_MAIL,
        import.meta.env.VITE_ADMIN_PASS
      )
    );

  await setDoc(doc(db, 'teams', user.uid), newDoc);

  localStorage.clear();
}

export async function getTeamProfile(uid: string) {
  const teamRef = doc(db, 'teams', uid);
  let teamDocSnapshot;
  try {
    teamDocSnapshot = await getDocFromCache(teamRef);
    if (!teamDocSnapshot.exists()) {
      throw new Error('Document not found in cache.');
    }
  } catch (e) {
    console.warn(e);
    teamDocSnapshot = await getDoc(teamRef);
  }

  if (teamDocSnapshot.exists()) {
    const resData = teamDocSnapshot.data();
    const teamName = resData.name;
    const isoTag = resData.tag;
    const restaurant = resData.restaurant;
    delete resData.name;
    delete resData.tag;
    if (restaurant) delete resData.restaurant;

    return {
      uid: teamDocSnapshot.id,
      name: teamName,
      tag: isoTag,
      restaurant: restaurant,
      meals: resData
    };
  } else {
    console.error("COULDN'T FETCH TEAM DATA!");
    return null;
  }
}

export async function saveEatingPlaceToDatabase(teamUid: string, selectedPlace: string) {
  const teamRef = doc(db, 'teams', teamUid);
  setDoc(teamRef, { restaurant: selectedPlace }, { merge: true });
}

export function listenForUpdates() {
  const teamsRef = collection(db, 'teams');
  const unsubscribe = onSnapshot(teamsRef, (snap) => {
    snap.docChanges().forEach((change) => {
      if (change.type === 'modified') {
        const teamsList: CompetitionTeam[] = [];
        snap.docs.forEach((doc) => {
          const docData = doc.data();
          const teamName = docData.name;
          const isoTag = docData.tag;
          delete docData.name;
          delete docData.tag;
          const teamItem = {
            uid: doc.id,
            name: teamName,
            tag: isoTag,
            meals: docData
          };
          teamsList.push(teamItem);
        });

        storeInCache('teams', teamsList, 5 * 60 * 60 * 1000);
      }
    });
  });

  return unsubscribe;
}
