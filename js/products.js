// js/products.js
import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { addToCart } from './cart.js'; // Use the proper cart function

// Get the container for products
const grid = document.getElementById('products-grid');

function createCard(productId, data) {
  const card = document.createElement('div');
  card.className = 'product-card';

  const imgURL = data.imageURL || 'https://via.placeholder.com/400x300?text=No+Image';
  const price = Number(data.price || 0).toFixed(2);

  card.innerHTML = `
    <img src="${imgURL}" alt="${data.name || 'Product'}" />
    <h3>${data.name || 'Unnamed product'}</h3>
    <p class="product-desc">${data.description || ''}</p>
    <div class="product-meta">
      <strong>$${price}</strong>
      <button class="button add-to-cart" data-id="${productId}">Add to cart</button>
    </div>
  `;
  return card;
}

async function loadProducts() {
  if (!grid) {
    console.error('No #products-grid element found in shop.html');
    return;
  }

  grid.innerHTML = '<p>Loading products…</p>';

  try {
    const snapshot = await getDocs(collection(db, 'products'));
    grid.innerHTML = '';

    if (snapshot.empty) {
      grid.innerHTML = '<p>No products found.</p>';
      return;
    }

    snapshot.forEach(docSnap => {
      const id = docSnap.id;
      const data = docSnap.data();
      const card = createCard(id, data);
      grid.appendChild(card);
    });

    // Delegate Add to Cart clicks
    grid.addEventListener('click', async (e) => {
      const btn = e.target.closest('.add-to-cart');
      if (!btn) return;

      const pid = btn.dataset.id;
      btn.disabled = true;
      btn.textContent = 'Adding…';
      try {
        await addToCart(pid, 1);
        btn.textContent = 'Added ✓';
        setTimeout(() => {
          btn.textContent = 'Add to cart';
          btn.disabled = false;
        }, 1200);
      } catch (err) {
        console.error('Add to cart failed', err);
        btn.textContent = 'Error';
        btn.disabled = false;
        setTimeout(() => btn.textContent = 'Add to cart', 1500);
      }
    });

  } catch (err) {
    console.error('Failed to load products', err);
    grid.innerHTML = '<p>Failed to load products. Check console for details.</p>';
  }
}

loadProducts();
