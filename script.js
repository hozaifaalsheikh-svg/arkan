// إعدادات الاتصال
const SUPABASE_URL = "https://aalpziidoobrqeppsvmi.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_Dzt7QBcxmcidwgZE3rkQcA_yoKmje1w"; 
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// متغير لتخزين بيانات المنتج الحالي ليتمكن زر التأكيد من الوصول إليها
window.selectedProduct = null;

async function loadProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        document.getElementById('loading').innerHTML = "عذراً، لم يتم تحديد أي منتج.";
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('inventory')
            .select('*')
            .eq('sku', productId)
            .single();

        if (error || !data) {
            document.getElementById('loading').innerHTML = "المنتج غير موجود.";
            return;
        }

        document.getElementById('loading').style.display = 'none';
        const contentDiv = document.getElementById('product-details-content');
        contentDiv.style.display = 'grid';

        // تخزين المنتج في المتغير العام
        window.selectedProduct = data;

        contentDiv.innerHTML = `
            <div class="product-image-box"><img src="${data.image_url || 'https://via.placeholder.com/200'}" alt="${data.name}"></div>
            <div class="product-info-box">
                <span class="brand">قسم: ${data.category || 'متفرقات'}</span>
                <h1>${data.name}</h1>
                <div class="price">${data.price} ل.س</div>
                <div class="full-description">${data.description || 'لا يوجد تفاصيل.'}</div>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button class="btn-add-to-cart" onclick="openModal()" style="padding:15px; background:#f27a1a; color:white; border:none; cursor:pointer; font-weight:bold;">
                       <i class="fas fa-cart-plus"></i> إضافة للسلة
                    </button>
                    <button class="btn-add-to-cart" onclick="window.location.href='index.html'" style="padding:12px; background:#1a365d; color:white; border:none; cursor:pointer;">العودة</button>
                </div>
            </div>
        `;
    } catch (err) {
        document.getElementById('loading').innerHTML = "حدث خطأ في الاتصال.";
    }
}

// فتح النافذة
function openModal() {
    document.getElementById('modal-product-name').textContent = window.selectedProduct.name;
    document.getElementById('modal-product-price').textContent = window.selectedProduct.price + " ل.س";
    document.getElementById('confirm-modal').style.display = 'flex';
}

// إغلاق النافذة
function closeModal() {
    document.getElementById('confirm-modal').style.display = 'none';
}

// --- هذا هو السطر المهم: ربط زر التأكيد بوظيفة الإضافة ---
document.getElementById('confirm-btn').onclick = function() {
    if (!window.selectedProduct) return;
    
    let cart = JSON.parse(localStorage.getItem('arkan_cart')) || [];
    const existing = cart.find(item => String(item.sku) === String(window.selectedProduct.sku));
    
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...window.selectedProduct, qty: 1 });
    }
    
    localStorage.setItem('arkan_cart', JSON.stringify(cart));
    closeModal();
    alert("تمت الإضافة للسلة بنجاح!");
};

document.addEventListener('DOMContentLoaded', loadProductDetails);