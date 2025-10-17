// js/nav.js
import { auth } from './firebase-config.js';
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

const authLink = document.getElementById('auth-link'); // Login/Logout link
const navUser = document.getElementById('nav-user'); // Container for user info

// Listen for auth changes
onAuthStateChanged(auth, (user) => {
  // Remove existing email display
  const existingEmail = navUser?.querySelector('.nav-email');
  if (existingEmail) existingEmail.remove();

  if (user) {
    // Display user email before the links
    if (navUser) {
      const span = document.createElement('span');
      span.className = 'nav-email';
      span.textContent = user.email;
      span.style.marginRight = '12px';
      navUser.prepend(span);
    }

    // Update link to Logout
    if (authLink) {
      authLink.textContent = 'Logout';
      authLink.href = '#';
      authLink.onclick = async (e) => {
        e.preventDefault();
        try {
          await signOut(auth);
          location.reload(); // refresh page after logout
        } catch (err) {
          console.error('Logout failed', err);
        }
      };
    }
  } else {
    // Not logged in — show Login link
    if (authLink) {
      authLink.textContent = 'Login';
      authLink.href = 'login.html';
      authLink.onclick = null;
    }
  }
});
// If no user is logged in, ensure navUser is cleared