// js/cart.js
// Handles cart storage in Firestore per-user, rendering, remove, and checkout.

import { auth, db } from './firebase-config.js';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getDoc as getProductDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { doc as productDocRef } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// DOM elements
const cartContainer = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');

// Helper: safely get user doc ref
function userDocRef(uid) {
  return doc(db, 'users', uid);
}

// Exported: add item to cart (used by products.js)
export async function addToCart(productId, qty = 1) {
  const user = auth.currentUser;
  if (!user) {
    // If not logged in, redirect to login with a message
    alert('Please log in to add items to your cart.');
    window.location.href = '/login.html';
    return;
  }

  const uRef = userDocRef(user.uid);
  const snap = await getDoc(uRef);

  // If user doc doesn't exist, create it
  if (!snap.exists()) {
    await setDoc(uRef, { email: user.email || null, cart: {} });
  }

  // Read current cart, update and write back
  const userSnap = await getDoc(uRef);
  const userData = userSnap.exists() ? userSnap.data() : { cart: {} };
  const cart = userData.cart || {};

  if (cart[productId]) cart[productId].qty = (cart[productId].qty || 0) + qty;
  else cart[productId] = { qty };

  await updateDoc(uRef, { cart });
  // Optionally, re-render cart if on cart page
  if (location.pathname.endsWith('cart.html')) {
    await loadCart();
  }
}

// Exported: remove item from cart
export async function removeFromCart(productId) {
  const user = auth.currentUser;
  if (!user) {
    alert('Please log in.');
    window.location.href = '/login.html';
    return;
  }
  const uRef = userDocRef(user.uid);
  const snap = await getDoc(uRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const cart = data.cart || {};
  if (cart[productId]) delete cart[productId];
  await updateDoc(uRef, { cart });
  // Refresh UI
  await loadCart();
}

// Load and render cart (callable)
export async function loadCart() {
  if (!cartContainer || !cartTotalEl) return;

  const user = auth.currentUser;
  if (!user) {
    cartContainer.innerHTML = '<p>Please <a href="/login.html">log in</a> to view your cart.</p>';
    cartTotalEl.textContent = '';
    return;
  }

  cartContainer.innerHTML = '<p>Loading cart…</p>';
  cartTotalEl.textContent = '';

  const uRef = userDocRef(user.uid);
  const snap = await getDoc(uRef);

  if (!snap.exists()) {
    cartContainer.innerHTML = '<p>Your cart is empty.</p>';
    cartTotalEl.textContent = '';
    return;
  }

  const userData = snap.data();
  const cart = userData.cart || {};

  if (Object.keys(cart).length === 0) {
    cartContainer.innerHTML = '<p>Your cart is empty.</p>';
    cartTotalEl.textContent = '';
    return;
  }

  // Render grid of items (grid styling handled via CSS)
  cartContainer.innerHTML = '';
  let total = 0;

  // Build array of productIds to fetch in sequence (could be batched)
  const entries = Object.entries(cart);

  // For each cart entry, fetch product details and render a card
  for (const [productId, item] of entries) {
    try {
      const pRef = productDocRef(db, 'products', productId);
      const pSnap = await getProductDoc(pRef);
      if (!pSnap.exists()) continue;
      const product = pSnap.data();

      const qty = item.qty || 1;
      const price = Number(product.price || 0);
      const subtotal = price * qty;
      total += subtotal;

      const row = document.createElement('div');
      row.className = 'cart-row';
      row.innerHTML = `
        <img src="${product.imageURL || 'https://via.placeholder.com/400x300?text=No+Image'}" alt="${product.name || 'Product'}" />
        <div class="cart-info">
          <h4>${product.name || 'Product'}</h4>
          <p>Qty: ${qty}</p>
          <p>Price: $${price.toFixed(2)}</p>
          <p>Subtotal: $${subtotal.toFixed(2)}</p>
          <button class="button remove-btn" data-id="${productId}">Remove</button>
        </div>
      `;
      cartContainer.appendChild(row);
    } catch (err) {
      console.error('Error fetching product', productId, err);
    }
  }

  cartTotalEl.textContent = `Total: $${total.toFixed(2)}`;

  // Attach remove listeners
  cartContainer.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const pid = btn.dataset.id;
      btn.disabled = true;
      btn.textContent = 'Removing…';
      try {
        await removeFromCart(pid);
      } catch (err) {
        console.error('Remove failed', err);
        btn.textContent = 'Error';
        btn.disabled = false;
        setTimeout(() => btn.textContent = 'Remove', 1200);
      }
    });
  });
}

// Checkout: clears the user's cart and optionally show a receipt
export async function checkoutCart() {
  const user = auth.currentUser;
  if (!user) {
    alert('Please log in to checkout.');
    window.location.href = '/login.html';
    return;
  }

  // Simple confirmation UI
  const confirmMsg = 'Confirm checkout? This will clear your cart (simulation).';
  if (!confirm(confirmMsg)) return;

  const uRef = userDocRef(user.uid);
  try {
    await updateDoc(uRef, { cart: {} });
    alert('Checkout successful — thank you! Your cart has been cleared (simulated).');
    await loadCart();
  } catch (err) {
    console.error('Checkout failed', err);
    alert('Checkout failed — see console for details.');
  }
}

// Wire checkout button if present
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', async () => {
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Processing…';
    try {
      await checkoutCart();
    } finally {
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = 'Checkout';
    }
  });
}

// Auto-load cart when auth state changes (and on initial load)
onAuthStateChanged(auth, (user) => {
  // small delay ensures Firestore auth is fully ready
  setTimeout(() => {
    loadCart();
  }, 80);
});
