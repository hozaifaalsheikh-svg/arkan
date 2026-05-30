const SUPABASE_URL = "https://aalpziidoobrqeppsvmi.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_Dzt7QBcxmcidwgZE3rkQcA_yoKmje1w"; 

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let localProducts = [];
let cart = JSON.parse(localStorage.getItem('arkan_cart')) || [];
let pendingProduct = null; // متغير لحفظ المنتج قبل التأكيد

async function loadProductsFromSupabase() {
    try {
        const { data, error } = await supabaseClient.from('inventory').select('*');
        if (error) { console.error("خطأ:", error); return; }

        localProducts = data.map(product => ({
            sku: product.sku,
            name: product.name,
            description: product.description || "منتج مميز.",
            price: product.price || "متوفر",
            category: product.category || "واقيات شمس",
            imageUrl: product.image_url 
        }));
        renderProducts(localProducts); 
    } catch (err) { console.error("فشل:", err); }
}

document.addEventListener('DOMContentLoaded', () => {
    loadProductsFromSupabase().then(() => {
        updateCartCount(); // تحديث العداد فقط
    });
});

function renderProducts(productsList) {
    const grid = document.getElementById('products-grid');
    if(!grid) return; 
    grid.innerHTML = '';
    productsList.forEach(product => {
        const placeholderImg = "https://images.unsplash.com/photo-1608248597481-496100c8c836?w=400&q=80"; 
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.cursor = 'pointer';
        card.onclick = () => { window.location.href = `product-details.html?id=${product.sku}`; };
        card.innerHTML = `
            <div class="image-container"><img src="${product.imageUrl || placeholderImg}"></div>
            <div class="product-info">
                <h4 class="product-title">${product.name}</h4>
                <p class="product-description">${product.description}</p>
                <button type="button" class="btn-add-to-cart" onclick="event.stopPropagation(); prepareAddToCart('${product.sku}')">إضافة إلى السلة</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// دالة التحضير (تفتح النافذة)
function prepareAddToCart(sku) {
    const product = localProducts.find(p => String(p.sku) === String(sku));
    if (!product) return;
    pendingProduct = product;
    document.getElementById('modal-product-name').textContent = product.name;
    document.getElementById('modal-product-price').textContent = product.price + " ل.س";
    document.getElementById('confirm-modal').style.display = 'flex';
}

// دالة التأكيد الفعلية (تنفذ الإضافة)
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