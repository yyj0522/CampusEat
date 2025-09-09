import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC88vHAUxaPf1NFX4kIYpR9XqVWBh89bwQ",
  authDomain: "whattoday-ccdce.firebaseapp.com",
  projectId: "whattoday-ccdce",
  storageBucket: "whattoday-ccdce.appspot.com",
  messagingSenderId: "804568381273",
  appId: "1:804568381273:android:3e6f4d596ff3cf72113e48",
};
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

