// Protótipo front-end da Maroli. Configure o número real antes de publicar.
const WHATSAPP_NUMBER = ""; // Ex.: "5544999999999" (DDI + DDD + número, somente dígitos)

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = value => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

$("#year").textContent = new Date().getFullYear();

const menuToggle = $(".menu-toggle");
const nav = $(".nav");
menuToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
});
$$(".nav a").forEach(link => link.addEventListener("click", () => {
  nav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
}));

function whatsappUrl(message = "Olá! Gostaria de falar sobre um projeto de comunicação visual.") {
  const text = encodeURIComponent(message);
  if (!WHATSAPP_NUMBER) return `https://wa.me/?text=${text}`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}
["whatsapp-quote", "footer-whatsapp", "floating-whatsapp"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.href = whatsappUrl();
});

const quoteForm = $("#quote-form");
quoteForm.addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(quoteForm);
  const name = data.get("name").trim();
  const service = data.get("service");
  const details = data.get("details").trim();
  const message = `Olá, Maroli! Meu nome é ${name} e gostaria de solicitar um orçamento.\n\nServiço: ${service}\nDetalhes: ${details || "Ainda vou passar mais detalhes."}`;
  window.open(whatsappUrl(message), "_blank", "noopener,noreferrer");
});

$$(".quote-product").forEach(button => button.addEventListener("click", () => {
  const service = button.dataset.product;
  $("#quote-form").elements.service.value = "Quadros, tapetes ou produto pronto";
  $("#quote-form").elements.details.value = `Gostaria de consultar: ${service}.`;
  $("#orcamento").scrollIntoView({ behavior: "smooth" });
}));

// Filtros e busca da vitrine
let activeFilter = "todos";
const searchInput = $("#product-search");
function filterProducts() {
  const query = searchInput.value.trim().toLocaleLowerCase("pt-BR");
  $$(".product-card").forEach(card => {
    const categoryMatch = activeFilter === "todos" || card.dataset.category === activeFilter;
    const searchMatch = card.dataset.name.toLocaleLowerCase("pt-BR").includes(query);
    card.classList.toggle("hidden", !(categoryMatch && searchMatch));
  });
}
$$(".filter").forEach(button => button.addEventListener("click", () => {
  $$(".filter").forEach(item => item.classList.remove("active"));
  button.classList.add("active");
  activeFilter = button.dataset.filter;
  filterProducts();
}));
searchInput.addEventListener("input", filterProducts);

// Carrinho demonstrativo, persistido no navegador. Não é um checkout de produção.
let cart = [];
try { cart = JSON.parse(localStorage.getItem("maroli-cart-demo") || "[]"); } catch { cart = []; }
const cartOverlay = $("#cart-overlay");
const openCart = () => {
  cartOverlay.classList.add("open");
  cartOverlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
};
const closeCart = () => {
  cartOverlay.classList.remove("open");
  cartOverlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
};
$("#open-cart").addEventListener("click", openCart);
$("#close-cart").addEventListener("click", closeCart);
cartOverlay.addEventListener("click", event => { if (event.target === cartOverlay) closeCart(); });
document.addEventListener("keydown", event => { if (event.key === "Escape") closeCart(); });

function saveCart() {
  localStorage.setItem("maroli-cart-demo", JSON.stringify(cart));
  renderCart();
}
function renderCart() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  $("#cart-count").textContent = count;
  $("#drawer-count").textContent = `(${count})`;
  const itemsEl = $("#cart-items");
  if (!cart.length) {
    itemsEl.innerHTML = '<div class="empty-cart">Seu carrinho está vazio.<br><span>Adicione produtos da loja para começar.</span></div>';
  } else {
    itemsEl.innerHTML = cart.map(item => `<div class="cart-row">
      <img src="${item.image}" alt="">
      <div><b>${escapeHTML(item.name)}</b><small>${item.qty} × ${money(item.price)}</small><small>Subtotal: ${money(item.price * item.qty)}</small></div>
      <button data-remove="${item.id}" aria-label="Remover ${escapeHTML(item.name)}">Remover</button>
    </div>`).join("");
  }
  $("#cart-total").textContent = money(cart.reduce((sum, item) => sum + item.price * item.qty, 0));
  $$("[data-remove]", itemsEl).forEach(button => button.addEventListener("click", () => {
    cart = cart.filter(item => String(item.id) !== button.dataset.remove);
    saveCart();
  }));
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
}
$$(".add-cart").forEach(button => button.addEventListener("click", () => {
  const id = button.dataset.id;
  const found = cart.find(item => String(item.id) === id);
  if (found) found.qty += 1;
  else cart.push({ id, name: button.dataset.name, price: Number(button.dataset.price), image: button.dataset.image, qty: 1 });
  saveCart();
  showToast("Produto adicionado ao carrinho.");
}));
$("#checkout-button").addEventListener("click", () => {
  if (!cart.length) { showToast("Adicione pelo menos um produto."); return; }
  const lines = cart.map(item => `• ${item.name} — ${item.qty} × ${money(item.price)} = ${money(item.price * item.qty)}`);
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const message = `Olá, Maroli! Gostaria de consultar este pedido:\n\n${lines.join("\n")}\n\nSubtotal demonstrativo: ${money(total)}\nPor favor, confirmem disponibilidade, frete e pagamento.`;
  window.open(whatsappUrl(message), "_blank", "noopener,noreferrer");
});
let toastTimer;
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
}
renderCart();
