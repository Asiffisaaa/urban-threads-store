// js/auth.js
// Firebase v12+ modular usage
import { auth, db } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// DOM selectors (update IDs to match your markup)
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const googleBtn = document.getElementById('googleBtn');
const statusEl = document.getElementById('status');

// Helper to show status messages (non-blocking)
function showStatus(msg, isError = false) {
  if (!statusEl) return;
  statusEl.textContent = msg;
  statusEl.style.color = isError ? '#b00' : '#080';
}

// --- Helper: ensureUserDoc(uid, values)
// Creates a users/{uid} doc if it doesn't exist.
// `values` should be an object with fields you want to store (email, displayName, etc.)
async function ensureUserDoc(uid, values = {}) {
  if (!uid) return;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      // create the doc
      await setDoc(userRef, {
        ...values,
        createdAt: new Date().toISOString(),
        cart: {}
      });
      console.log(`Created users/${uid} document.`);
    } else {
      // Optionally update missing fields (merge-like behavior)
      // await setDoc(userRef, values, { merge: true });
      console.log(`users/${uid} already exists.`);
    }
  } catch (err) {
    console.error('ensureUserDoc error', err);
    // don't throw — keep auth flow tolerant
  }
}

// ------------------
// EMAIL SIGNUP
// ------------------
signupBtn?.addEventListener('click', async () => {
  const email = (emailInput?.value || "").trim();
  const pw = (passwordInput?.value || "");
  if (!email || !pw) return showStatus('Enter email and password', true);

  try {
    showStatus('Creating account…');
    const userCred = await createUserWithEmailAndPassword(auth, email, pw);

    // Ensure user doc exists in Firestore
    await ensureUserDoc(userCred.user.uid, {
      email: userCred.user.email,
      displayName: userCred.user.displayName || null
    });

    showStatus('Account created — redirecting…');
    setTimeout(() => window.location.href = '/shop.html', 700);
  } catch (err) {
    console.error('signup error', err);
    showStatus(err.message || 'Sign up failed', true);
  }
});

// ------------------
// EMAIL LOGIN
// ------------------
loginBtn?.addEventListener('click', async () => {
  const email = (emailInput?.value || "").trim();
  const pw = (passwordInput?.value || "");
  if (!email || !pw) return showStatus('Enter email and password', true);

  try {
    showStatus('Signing in…');
    await signInWithEmailAndPassword(auth, email, pw);
    showStatus('Signed in — redirecting…');
    setTimeout(() => window.location.href = '/shop.html', 700);
  } catch (err) {
    console.error('signin error', err);
    showStatus(err.message || 'Sign in failed', true);
  }
});

// ------------------
// GOOGLE SIGN-IN
// ------------------
googleBtn?.addEventListener('click', async () => {
  const provider = new GoogleAuthProvider();
  try {
    showStatus('Opening Google sign-in…');
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Ensure Firestore user document for social sign-ins too
    await ensureUserDoc(user.uid, {
      email: user.email,
      displayName: user.displayName || null
    });

    showStatus('Signed in — redirecting…');
    setTimeout(() => window.location.href = '/shop.html', 700);
  } catch (err) {
    console.error('google sign-in error', err);
    showStatus(err.message || 'Google sign-in failed', true);
  }
});

// ------------------
// LOGOUT (optional export)
export async function logout() {
  try {
    await signOut(auth);
    window.location.href = '/index.html';
  } catch (err) {
    console.error('signOut error', err);
  }
}

// ------------------
// AUTH STATE: broadcast for other modules (nav/cart)
onAuthStateChanged(auth, (user) => {
  // some pages listen for 'auth-state-changed' custom event
  document.dispatchEvent(new CustomEvent('auth-state-changed', { detail: user || null }));

  // optional: update status element
  if (statusEl) {
    if (user) showStatus(`Signed in as ${user.email}`);
    else statusEl.textContent = '';
  }
});
