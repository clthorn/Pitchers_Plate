// Import the functions you need from the SDKs you need
import * as firebase from "firebase/app";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from './firebase.config';

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = getFirestore(app);
export {db};
export {app};
