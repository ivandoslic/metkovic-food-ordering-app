import { defineStore } from 'pinia';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type UserProfile
} from 'firebase/auth';
import { auth } from './firebaseConfig';
import router from './router';
import { listenForUpdates } from './services/firestore-service';

export const useUserStore = defineStore('userStore', {
  state: () => ({
    userData: null as UserProfile | null,
    loadingUser: false,
    loadingSession: true,
    adminListenerUnsubscribe: null as (() => void) | null
  }),
  actions: {
    async loginUser(email: string, password: string) {
      this.loadingUser = true;
      try {
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        this.userData = { username: user.email?.split('@')[0], uid: user.uid };
        if (this.userData.username === import.meta.env.VITE_ADMIN_USERNAME) {
          router.push('/admin');

          if (!this.adminListenerUnsubscribe) {
            this.adminListenerUnsubscribe = listenForUpdates();
          }
        } else router.push('/');
      } catch (err) {
        console.error(err);
      } finally {
        this.loadingUser = false;
      }
    },
    async logoutUser() {
      try {
        await signOut(auth);
        this.userData = null;
        localStorage.clear();
        router.push('/login');

        if (this.adminListenerUnsubscribe) {
          this.adminListenerUnsubscribe();
          this.adminListenerUnsubscribe = null;
        }
      } catch (err) {
        console.error(err);
      }
    },
    init() {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          this.userData = {
            username: user.email?.split('@')[0],
            uid: user.uid
          };

          this.loadingSession = false;
          if (user.email?.split('@')[0] === import.meta.env.VITE_ADMIN_USERNAME) {
            router.replace({ name: 'Admin' });

            if (!this.adminListenerUnsubscribe) {
              this.adminListenerUnsubscribe = listenForUpdates();
            }
          } else router.replace({ name: 'Home' });
        } else {
          this.userData = null;
          router.replace({ name: 'Login' });
        }
      });
    }
  }
});
