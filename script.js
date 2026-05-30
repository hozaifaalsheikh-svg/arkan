const SUPABASE_URL = "https://aalpziidoobrqeppsvmi.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_Dzt7QBcxmcidwgZE3rkQcA_yoKmje1w"; 
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let localProducts = [];
let cart = JSON.parse(localStorage.getItem('arkan_cart')) || [];
let pendingProduct = null;

// جلب البيانات الأساسية
async function initStore() {
    const { data } = await supabaseClient.from('inventory').select('*');
    localProducts = data || [];
    updateCartCount();
}

document.addEventListener('DOMContentLoaded', initStore);

// تحضير النافذة (تعمل في أي صفحة)
function prepareAddToCart(sku) {
    const product = localProducts.find(p => String(p.sku) === String(sku));
    if (!product) {
        alert("خطأ: المنتج غير موجود في الذاكرة");
        return;
    }
    pendingProduct = product;
    document.getElementById('modal-product-name').textContent = product.name;
    document.getElementById('modal-product-price').textContent = product.price + " ل.س";
    document.getElementById('confirm-modal').style.display = 'flex';
}

// تنفيذ الإضافة من النافذة
document.getElementById('confirm-btn').onclick = () => {
    if (!pendingProduct) return;
    const existing = cart.find(i => String(i.sku) === String(pendingProduct.sku));
    if (existing) existing.qty += 1;
    else cart.push({ ...pendingProduct, qty: 1 });
    
    localStorage.setItem('arkan_cart', JSON.stringify(cart));
    updateCartCount();
    closeModal();
    alert("تمت إضافة " + pendingProduct.name + " بنجاح!");
};

function closeModal() { document.getElementById('confirm-modal').style.display = 'none'; }

function updateCartCount() {
    const el = document.getElementById('cart-count');
    if(el) el.textContent = cart.reduce((acc, item) => acc + item.qty, 0);
}

// دالة تحديث الكمية في السلة (تمنع النزول عن 1)
function updateQuantity(sku, delta) {
    const item = cart.find(i => String(i.sku) === String(sku));
    if (!item) return;
    
    if (delta === -1 && item.qty <= 1) {
        alert("لا يمكن إنقاص الكمية عن 1");
        return;
    }
    
    item.qty += delta;
    localStorage.setItem('arkan_cart', JSON.stringify(cart));
    location.reload(); // تحديث الصفحة لرؤية النتائج
}