const SUPABASE_URL = "https://aalpziidoobrqeppsvmi.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_Dzt7QBcxmcidwgZE3rkQcA_yoKmje1w"; 

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let localProducts = [];
let cart = JSON.parse(localStorage.getItem('arkan_cart')) || [];
let productToConfirm = null; // المتغير الجديد لتخزين المنتج مؤقتاً لحين التأكيد

// 1. جلب البيانات من Supabase
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

// تشغيل الأكواد عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    loadProductsFromSupabase();
    updateCartCount();

    // تفعيل زر التأكيد داخل النافذة بعد تحميل عناصر الصفحة
    const confirmBtn = document.getElementById('modal-btn-confirm');
    if(confirmBtn) {
        confirmBtn.addEventListener('click', confirmAddToCart);
    }
});

// 2. عرض المنتجات في الصفحة الرئيسية
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
                <button type="button" class="btn-add-to-cart" onclick="event.stopPropagation(); askToConfirmAdd('${product.sku}', '${product.name}', ${product.price})">إضافة إلى السلة</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// =========================================
// 3. دوال نافذة التأكيد والإشعارات (الجديدة)
// =========================================

// فتح النافذة
function askToConfirmAdd(sku, name, price) {
    productToConfirm = { sku, name, price };
    const nameElement = document.getElementById('modal-target-product');
    const modalElement = document.getElementById('custom-confirm-modal');
    
    if(nameElement && modalElement) {
        nameElement.textContent = name;
        modalElement.classList.add('active');
    }
}

// إغلاق النافذة
function closeConfirmModal() {
    const modalElement = document.getElementById('custom-confirm-modal');
    if(modalElement) {
        modalElement.classList.remove('active');
    }
    productToConfirm = null; 
}

// تأكيد الإضافة للسلة
function confirmAddToCart() {
    if (!productToConfirm) return;

    const existingItem = cart.find(item => String(item.sku) === String(productToConfirm.sku));
    
    if (existingItem) { 
        existingItem.qty += 1; 
    } else { 
        cart.push({ ...productToConfirm, qty: 1 }); 
    }
    
    localStorage.setItem('arkan_cart', JSON.stringify(cart));
    updateCartCount(); // تحديث العداد
    closeConfirmModal(); // إغلاق النافذة
    showToast("تمت الإضافة إلى سلتك بنجاح! 🛒"); // إظهار الإشعار
}

// عرض إشعار النجاح (Toast)
function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> <span>${message}</span>`;
    
    container.appendChild(toast);

    // إخفاء الإشعار بعد 3 ثوانٍ
    setTimeout(() => {
        toast.classList.add('fade-out');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}

// =========================================
// 4. دوال السلة والفلترة والبحث 
// =========================================

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

document.getElementById('search-input')?.addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase();
    renderProducts(localProducts.filter(p => p.name.toLowerCase().includes(query)));
});