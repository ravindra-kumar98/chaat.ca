// =============================
// Cart functionality (state)
// =============================
let cart = [];
let cartCount = 0;
const CART_STORAGE_KEY = "chaat_ca_cart_v1";

// DOM elements
const cartToggle = document.getElementById("cartToggle");
const cartSidebar = document.getElementById("cartSidebar");
const cartOverlay = document.getElementById("cartOverlay");
const cartClose = document.getElementById("cartClose");
const cartContent = document.getElementById("cartContent");
const cartCountElement = document.getElementById("cartCount");
const subtotalElement = document.getElementById("subtotal");
const taxElement = document.getElementById("tax");
const totalElement = document.getElementById("total");
const checkoutBtn = document.getElementById("checkoutBtn");

// Initialize with some demo items
function initializeCart() {
  const restoredCart = loadCartFromStorage();
  cart = Array.isArray(restoredCart) ? restoredCart : [];
  updateCart();
}

function saveCartToStorage() {
  try {
    const serialized = JSON.stringify(cart);
    localStorage.setItem(CART_STORAGE_KEY, serialized);
  } catch (error) {
    // Silently ignore storage errors
  }
}

function loadCartFromStorage() {
  try {
    const serialized = localStorage.getItem(CART_STORAGE_KEY);
    if (!serialized) return [];
    const parsed = JSON.parse(serialized);
    if (!Array.isArray(parsed)) return [];

    // Validate and sanitize items
    return parsed
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        id: item.id,
        name: String(item.name || ""),
        price: Number(item.price) || 0,
        quantity: Math.max(1, Number(item.quantity) || 1),
        description: String(item.description || ""),
        image: String(item.image || ""),
      }))
      .filter((item) => item.id !== undefined && item.name && item.price >= 0);
  } catch (error) {
    return [];
  }
}

// =============================
// Sidebar open/close controls
// =============================
function openCart() {
  cartSidebar.classList.add("active");
  cartOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

// Function to close cart
function closeCart() {
  cartSidebar.classList.remove("active");
  cartOverlay.classList.remove("active");
  document.body.style.overflow = "auto";
}

// =============================
// Cart state mutations
// - add, remove, quantity updates
// =============================
function addToCart(id, name, price, description, image) {
  const existingItem = cart.find((item) => item.id === id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id,
      name,
      price,
      quantity: 1,
      description,
      image,
    });
  }

  updateCart();

  // Optional: Show a brief success message
  showAddToCartSuccess();
}

// Function to remove item from cart
function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  updateCart();
}

// Function to update item quantity
function updateQuantity(id, change) {
  const item = cart.find((item) => item.id === id);
  if (item) {
    item.quantity += change;
    if (item.quantity <= 0) {
      removeFromCart(id);
    } else {
      updateCart();
    }
  }
}

// =============================
// Cart UI updates (count, items list, summary)
// =============================
function updateCart() {
  updateCartCount();
  renderCartItems();
  updateCartSummary();
  saveCartToStorage();
}

// Update cart count
function updateCartCount() {
  cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  cartCountElement.textContent = cartCount;

  // if (cartCount === 0) {
  //     cartCountElement.style.display = 'none';
  // } else {
  //     cartCountElement.style.display = 'flex';
  // }
}

// Render cart items
function renderCartItems() {
  if (cart.length === 0) {
    cartContent.innerHTML = `
            <div class="empty-cart">
                <svg class="empty-cart-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.433-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                </svg>
                <h3>Your cart is empty</h3>
                <p>Add some delicious food to get started!</p>
            </div>
        `;
    return;
  }

  cartContent.innerHTML = `
        <div class="cart-items">
            ${cart
              .map(
                (item) => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${
                  item.name
                }" class="item-image">
                    <div class="item-details">
                        <div class="item-name">${item.name}</div>
                        <div class="item-description">${item.description}</div>
                        <div class="item-price">$${(
                          item.price * item.quantity
                        ).toFixed(2)}</div>
                    </div>
                    <div class="item-actions">
                        <div class="quantity-controls">
                            <button class="qty-btn" onclick="updateQuantity(${
                              item.id
                            }, -1)" ${
                  item.quantity <= 1 ? "disabled" : ""
                }>-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQuantity(${
                              item.id
                            }, 1)">+</button>
                        </div>
                        <button class="remove-item" onclick="removeFromCart(${
                          item.id
                        })">Remove</button>
                    </div>
                </div>
            `
              )
              .join("")}
        </div>
    `;
}

// Update cart summary
function updateCartSummary() {
  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const deliveryFee = subtotal > 0 ? 3.99 : 0;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + deliveryFee + tax;

  subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById("deliveryFee").textContent = `$${deliveryFee.toFixed(
    2
  )}`;
  taxElement.textContent = `$${tax.toFixed(2)}`;
  totalElement.textContent = `$${total.toFixed(2)}`;

  checkoutBtn.disabled = cart.length === 0;
}

// =============================
// UX: transient toast for add-to-cart
// =============================
function showAddToCartSuccess() {
  // Create a temporary success message
  const message = document.createElement("div");
  message.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 3000;
        font-weight: 500;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
  message.textContent = "Item added to cart!";

  document.body.appendChild(message);

  // Animate in
  setTimeout(() => {
    message.style.transform = "translateX(0)";
  }, 100);

  // Remove after 3 seconds
  setTimeout(() => {
    message.style.transform = "translateX(100%)";
    setTimeout(() => {
      document.body.removeChild(message);
    }, 300);
  }, 3000);
}

// =============================
// Global event listeners (outside modal)
// =============================
cartToggle.addEventListener("click", openCart);
cartClose.addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);

// Checkout button
checkoutBtn.addEventListener("click", () => {
//  alert("Proceeding to checkout... (This is a demo)");
  closeCart();
});

// Handle escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && cartSidebar.classList.contains("active")) {
    closeCart();
  }
});

// Handle window resize
window.addEventListener("resize", () => {
  if (window.innerWidth > 768 && cartSidebar.classList.contains("active")) {
    closeCart();
  }
});

// =============================
// Initialize cart (restore from storage)
// =============================
initializeCart();

// =============================
// Checkout phone modal + validation scope
// Encapsulated to avoid leaking globals
// =============================
(() => {
  // Get modal elements
  const phoneModal = document.getElementById("phoneModal");
  const closeModalBtn = document.getElementById("closeModal");
  const phoneForm = document.getElementById("phoneForm");
  const phoneInput = document.getElementById("phoneInput");
  const submitBtn = phoneForm.querySelector('button[type="submit"]');

  // ---------------------------------------------
  // Phone validation helpers (NANP/Canadian/US)
  // - normalize to E.164 (+1XXXXXXXXXX)
  // - pretty format on blur: (AAA) XXX-XXXX
  // ---------------------------------------------
  const NANP_REGEX = /^(?:\+?1[\s.-]?)?(?:\(?([2-9][0-9]{2})\)?[\s.-]?([2-9][0-9]{2})[\s.-]?([0-9]{4}))$/;

  function normalizeToE164(inputValue) {
    const digitsOnly = (inputValue || "").replace(/\D+/g, "");
    if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
      const area = digitsOnly.slice(1, 4);
      const exch = digitsOnly.slice(4, 7);
      const line = digitsOnly.slice(7, 11);
      if (/^[2-9]/.test(area) && /^[2-9]/.test(exch)) return `+1${area}${exch}${line}`;
      return null;
    }
    if (digitsOnly.length === 10) {
      const area = digitsOnly.slice(0, 3);
      const exch = digitsOnly.slice(3, 6);
      const line = digitsOnly.slice(6, 10);
      if (/^[2-9]/.test(area) && /^[2-9]/.test(exch)) return `+1${area}${exch}${line}`;
      return null;
    }
    return null;
  }

  function formatPretty(inputValue) {
    const match = (inputValue || "").match(NANP_REGEX);
    if (!match) return inputValue;
    const [, area, exch, line] = match;
    return `(${area}) ${exch}-${line}`;
  }

  function setPhoneValidityMessage(message) {
    phoneInput.setCustomValidity(message || "");
    phoneInput.setAttribute("aria-invalid", message ? "true" : "false");
    renderPhoneError(message);
  }

  // Inline error renderer under the input
  function renderPhoneError(message) {
    let errorEl = document.getElementById("phoneError");
    if (!errorEl) {
      errorEl = document.createElement("div");
      errorEl.id = "phoneError";
      errorEl.setAttribute("role", "alert");
      errorEl.style.cssText = "margin-top:6px;color:#dc3545;font-size:0.9rem;";
      phoneInput.insertAdjacentElement("afterend", errorEl);
    }
    errorEl.textContent = message || "";
    errorEl.style.display = message ? "block" : "none";
  }

  // Live validation: sanitize characters and validate against NANP
  phoneInput.addEventListener("input", () => {
    // keep allowed characters only
    const allowed = phoneInput.value.replace(/[^0-9+()\-\.\s]/g, "");
    if (allowed !== phoneInput.value) {
      const selStart = phoneInput.selectionStart;
      phoneInput.value = allowed;
      if (typeof selStart === "number") phoneInput.setSelectionRange(selStart - 1, selStart - 1);
    }

    if (!phoneInput.value.trim()) {
      setPhoneValidityMessage("Please enter your phone number");
      submitBtn.disabled = true;
      return;
    }

    if (!NANP_REGEX.test(phoneInput.value.trim())) {
      setPhoneValidityMessage("Enter a valid Canadian/US number, e.g. +1 416 555 1234");
      submitBtn.disabled = true;
    } else {
      setPhoneValidityMessage("");
      submitBtn.disabled = false;
    }
  });

  // Format nicely on blur if valid
  phoneInput.addEventListener("blur", () => {
    const val = phoneInput.value.trim();
    if (NANP_REGEX.test(val)) {
      phoneInput.value = formatPretty(val);
      setPhoneValidityMessage("");
    }
  });

  // Open modal on checkout button click (override existing listener)
  checkoutBtn.removeEventListener("click", () => {}); // Remove old listener if any
  checkoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (cart.length === 0) return; // Do nothing if cart empty
    phoneModal.style.display = "flex";
    phoneInput.focus();
  });

  // Close modal function
  function closeModal() {
    phoneModal.style.display = "none";
    phoneForm.reset();
  }

  // Close modal on clicking close button or outside modal content
  closeModalBtn.addEventListener("click", closeModal);
  window.addEventListener("click", (e) => {
    if (e.target === phoneModal) {
      closeModal();
    }
  });

  // Handle form submission (validate -> normalize -> proceed)
  phoneForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const phoneNumber = phoneInput.value.trim();

    // Validate using robust NANP regex and normalize to E.164
    const normalized = normalizeToE164(phoneNumber);
    if (!normalized) {
      setPhoneValidityMessage("Enter a valid Canadian/US number, e.g. +1 416 555 1234");
      submitBtn.disabled = true;
      phoneInput.focus();
      phoneInput.reportValidity();
      return;
    }
    setPhoneValidityMessage("");
    submitBtn.disabled = false;
    // Replace value with normalized format for downstream use
    phoneInput.value = normalized;

    // Show alert on successful submission
    alert("testing order notification");

    // Close modal and cart sidebar
    closeModal();
    closeCart();
  });
})();
