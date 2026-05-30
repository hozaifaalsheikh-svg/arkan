const SUPABASE_URL = "https://aalpziidoobrqeppsvmi.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_Dzt7QBcxmcidwgZE3rkQcA_yoKmje1w"; 

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let localProducts = [];
let cart = JSON.parse(localStorage.getItem('arkan_cart')) || [];
let pendingProduct = null;

async function loadProductsFromSupabase() {
    try {
        const { data, error } = await supabaseClient.from('inventory').select('*');
        if (error) { console.error("خطأ:", error); return; }

        localProducts = data.map(product => ({
            sku: product.sku,
            name: product.name,
            description: product.description || "منتج أركان فارما المميز.",
            price: product.price || 0,
            category: product.category || "عام",
            imageUrl: product.image_url 
        }));
        renderProducts(localProducts); 
    } catch (err) { console.error("فشل الاتصال:", err); }
}

document.addEventListener('DOMContentLoaded', () => {
    loadProductsFromSupabase();
    updateCartCount();
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
            <div class="image-container"><img src="${product.imageUrl || 'https://via.placeholder.com/200'}" alt="${product.name}"></div>
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

document.getElementById('confirm-btn').onclick = () => {
    if (!pendingProduct) return;
    const existingItem = cart.find(item => String(item.sku) === String(pendingProduct.sku));
    if (existingItem) { existingItem.qty += 1; } 
    else { cart.push({ ...pendingProduct, qty: 1 }); }
    localStorage.setItem('arkan_cart', JSON.stringify(cart));
    updateCartCount();
    closeModal();
};

function closeModal() { document.getElementById('confirm-modal').style.display = 'none'; }

function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if(cartCount) cartCount.textContent = cart.reduce((acc, item) => acc + item.qty, 0);
}

function filterCategory(catName, btnElement) {
    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    const filtered = (catName === 'الكل') ? localProducts : localProducts.filter(p => p.category === catName);
    renderProducts(filtered);
}
function addToCartDirectly(sku, name, price) {
    // 1. تحديث بيانات النافذة
    document.getElementById('modal-product-name').textContent = name;
    document.getElementById('modal-product-price').textContent = price + " ل.س";
    document.getElementById('confirm-modal').style.display = 'flex';

    // 2. تفعيل زر التأكيد
    document.getElementById('confirm-btn').onclick = function() {
        let cart = JSON.parse(localStorage.getItem('arkan_cart')) || [];
        const existingItem = cart.find(item => String(item.sku) === String(sku));
        
        if (existingItem) {
            existingItem.qty += 1;
        } else {
            cart.push({ sku: sku, name: name, price: price, qty: 1 });
        }
        
        localStorage.setItem('arkan_cart', JSON.stringify(cart));
        document.getElementById('confirm-modal').style.display = 'none';
        alert("تمت الإضافة للسلة!");
    };
}
document.getElementById('search-input')?.addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase();
    renderProducts(localProducts.filter(p => p.name.toLowerCase().includes(query)));
});