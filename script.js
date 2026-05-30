// روابط الاتصال بقاعدة بيانات Supabase 
const SUPABASE_URL = "https://aalpziidoobrqeppsvmi.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_Dzt7QBcxmcidwgZE3rkQcA_yoKmje1w"; 

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let localProducts = [];
// استرجاع السلة من الذاكرة لضمان عدم ضياع المنتجات عند تحديث الصفحة
let cart = JSON.parse(localStorage.getItem('arkan_cart')) || [];

async function loadProductsFromSupabase() {
    try {
        const { data, error } = await supabaseClient.from('inventory').select('*');
        if (error) {
            console.error("خطأ في جلب البيانات:", error);
            return;
        }

        localProducts = data.map(product => ({
            sku: product.sku,
            name: product.name,
            description: product.description || "منتج مميز وعالي الجودة من شركة أركان فارما.",
            price: product.price || "متوفر",
            category: product.category || "واقيات شمس",
            imageUrl: product.image_url 
        }));
        
        renderProducts(localProducts); 
    } catch (err) {
        console.error("فشل الاتصال بالسيرفر:", err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadProductsFromSupabase().then(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const addSku = urlParams.get('add');
        
        if (addSku) {
            window.history.replaceState({}, document.title, window.location.pathname);
            addToCart(addSku);
        }
        // تحديث واجهة السلة فور فتح الموقع لإظهار الأرقام المحفوظة
        updateCartUI();
    });
});

function renderProducts(productsList) {
    const grid = document.getElementById('products-grid');
    if(!grid) return; 
    grid.innerHTML = '';
    
    if(productsList.length === 0) {
        grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color:#999; padding: 40px;">لا توجد منتجات متوفرة حالياً في هذا القسم.</p>';
        return;
    }

    productsList.forEach(product => {
        const placeholderImg = "https://images.unsplash.com/photo-1608248597481-496100c8c836?w=400&q=80"; 
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.cursor = 'pointer';
        card.onclick = () => { window.location.href = `product-details.html?id=${product.sku}`; };

        card.innerHTML = `
            <div class="image-container">
                <img src="${product.imageUrl ? product.imageUrl : placeholderImg}" alt="${product.name}">
            </div>
            <div class="product-info">
                <span class="brand-tag">arkan</span>
                <h4 class="product-title" style="margin-bottom: 5px;">${product.name}</h4>
                <p class="product-description">${product.description}</p>
                <a href="product-details.html?id=${product.sku}" class="read-more-link" onclick="event.stopPropagation();">اقرأ المزيد</a>
                <div class="price-row" style="margin-top: auto; margin-bottom: 12px;">
                    <span class="product-price" style="font-size: 16px; font-weight: 700; color: #f27a1a;">
                        ${product.price} ${typeof product.price === 'number' ? 'ل.س' : ''}
                    </span>
                </div>
                <button type="button" class="btn-add-to-cart" onclick="event.stopPropagation(); addToCart('${product.sku}')">إضافة إلى السلة</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    if(sidebar) sidebar.classList.toggle('open');
}

function addToCart(sku) {
    // استخدام String لتوحيد نوع البيانات وتجنب مشكلة (رقم أم نص)
    const product = localProducts.find(p => String(p.sku) === String(sku));
    if (!product) {
        console.error("لم يتم العثور على المنتج برقم:", sku);
        return;
    }

    const existingItem = cart.find(item => String(item.sku) === String(sku));
    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    
    // حفظ السلة في الذاكرة
    localStorage.setItem('arkan_cart', JSON.stringify(cart));
    updateCartUI();
    
    const sidebar = document.getElementById('cart-sidebar');
    if(sidebar) sidebar.classList.add('open');
}

function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotalPrice = document.getElementById('cart-total-price');
    
    // تحديث العداد دائماً إن وجد
    if(cartCount) cartCount.textContent = cart.reduce((acc, item) => acc + item.qty, 0);
    
    // الحماية من انهيار الكود إذا لم يجد السلة
    if(!cartItemsContainer) return;

    if(cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart-msg">سلتك فارغة حالياً، ابدأ بالتسوق!</div>';
        if(cartTotalPrice) cartTotalPrice.textContent = "0 ل.س";
        return;
    }

    cartItemsContainer.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const itemPriceNum = parseInt(item.price) || 0;
        total += itemPriceNum * item.qty;

        const itemRow = document.createElement('div');
        itemRow.className = 'cart-item';
        itemRow.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price" style="color: #f27a1a; font-weight: bold;">${item.price} ${itemPriceNum ? 'ل.س' : ''}</div>
                
                <div class="qty-controls" style="display: flex; align-items: center; gap: 12px; margin-top: 10px;">
                    <button type="button" onclick="changeQty('${item.sku}', 1)" style="background: #eee; border: none; width: 30px; height: 30px; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: bold;">+</button>
                    <span style="font-size: 15px; font-weight: bold; min-width: 20px; text-align: center;">${item.qty}</span>
                    <button type="button" onclick="changeQty('${item.sku}', -1)" style="background: #eee; border: none; width: 30px; height: 30px; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: bold;">-</button>
                    <button type="button" onclick="removeFromCart('${item.sku}')" style="background: #fff0f0; color: #dc3545; border: none; width: 30px; height: 30px; border-radius: 6px; cursor: pointer; margin-right: auto;" title="حذف المنتج">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
        cartItemsContainer.appendChild(itemRow);
    });

    if(cartTotalPrice) cartTotalPrice.textContent = total > 0 ? `${total} ل.س` : "متوفر";
}

function changeQty(sku, delta) {
    const item = cart.find(i => String(i.sku) === String(sku));
    if (!item) return;
    item.qty += delta;
    if(item.qty <= 0) {
        cart = cart.filter(i => String(i.sku) !== String(sku));
    }
    localStorage.setItem('arkan_cart', JSON.stringify(cart));
    updateCartUI();
}

function removeFromCart(sku) {
    cart = cart.filter(i => String(i.sku) !== String(sku));
    localStorage.setItem('arkan_cart', JSON.stringify(cart));
    updateCartUI();
}

function filterCategory(catName, btnElement) {
    const buttons = document.querySelectorAll('.cat-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    if(btnElement) btnElement.classList.add('active');

    if(catName === 'الكل') {
        renderProducts(localProducts);
    } else {
        const filtered = localProducts.filter(p => p.category === catName);
        renderProducts(filtered);
    }
}

document.getElementById('search-input')?.addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase();
    const filtered = localProducts.filter(p => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query));
    renderProducts(filtered);
});

function sendOrderToWhatsApp() {
    const name = document.getElementById('cust-name').value;
    const address = document.getElementById('cust-address').value;

    if(!name || !address) {
        alert("لطفاً، املأ اسمك وعنوانك بالكامل لتجهيز الشحن.");
        return;
    }

    if(cart.length === 0) {
        alert("سلتك فارغة! يرجى إضافة منتجات أولاً.");
        return;
    }

    let message = `*طلب جديد من صيدلية أركان أونلاين 🛍️*\n\n*الاسم:* ${name}\n*العنوان:* ${address}\n-----------------------------\n`;
    let total = 0;
    cart.forEach((item, index) => {
        const priceNum = parseInt(item.price) || 0;
        message += `${index + 1}) *${item.name}*\n    الكمية: ${item.qty} | السعر: ${item.price}\n`;
        total += priceNum * item.qty;
    });

    message += `-----------------------------\n*الإجمالي الحسابي:* ${total} ل.س\n\nيرجى تأكيد وتجهيز الطلب للشحن فوراً 🚚`;

    const whatsappUrl = `https://api.whatsapp.com/send?phone=963956017232&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    cart = [];
    localStorage.removeItem('arkan_cart');
    updateCartUI();
    toggleCart();
}