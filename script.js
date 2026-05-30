const SUPABASE_URL = "https://aalpziidoobrqeppsvmi.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_Dzt7QBcxmcidwgZE3rkQcA_yoKmje1w"; 
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let localProducts = [];
let cart = JSON.parse(localStorage.getItem('arkan_cart')) || [];
let pendingProduct = null;

async function initStore() {
    const { data } = await supabaseClient.from('inventory').select('*');
    localProducts = data || [];
    renderProducts(localProducts);
    updateCartCount();
}

document.addEventListener('DOMContentLoaded', () => {
    initStore();
    // ربط الزر بعد التأكد من تحميل الصفحة
    document.getElementById('confirm-btn').onclick = () => {
        if (!pendingProduct) return;
        const existing = cart.find(i => String(i.sku) === String(pendingProduct.sku));
        if (existing) existing.qty += 1;
        else cart.push({ ...pendingProduct, qty: 1 });
        localStorage.setItem('arkan_cart', JSON.stringify(cart));
        updateCartCount();
        closeModal();
        alert("تمت الإضافة بنجاح!");
    };
});

function renderProducts(productsList) {
    const grid = document.getElementById('products-grid');
    if(!grid) return; 
    grid.innerHTML = '';
    productsList.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => { window.location.href = `product-details.html?id=${product.sku}`; };
        card.innerHTML = `
            <div class="image-container"><img src="${product.image_url || 'https://via.placeholder.com/200'}" alt="${product.name}"></div>
            <div class="product-info">
                <h4 class="product-title">${product.name}</h4>
                <p class="product-description">${product.description}</p>
                <div class="price-row">${product.price} ل.س</div>
                <button type="button" class="btn-add-to-cart" onclick="event.stopPropagation(); prepareAddToCart('${product.sku}')">إضافة إلى السلة</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function prepareAddToCart(sku) {
    const product = localProducts.find(p => String(p.sku) === String(sku));
    if (!product) return;
    pendingProduct = product;
    document.getElementById('modal-product-name').textContent = product.name;
    document.getElementById('modal-product-price').textContent = product.price + " ل.س";
    document.getElementById('confirm-modal').style.display = 'flex';
}

function closeModal() { document.getElementById('confirm-modal').style.display = 'none'; }

function updateCartCount() {
    const el = document.getElementById('cart-count');
    if(el) el.textContent = cart.reduce((acc, item) => acc + item.qty, 0);
}

function filterCategory(catName, btnElement) {
    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    renderProducts((catName === 'الكل') ? localProducts : localProducts.filter(p => p.category === catName));
}