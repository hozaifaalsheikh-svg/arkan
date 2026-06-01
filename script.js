const SUPABASE_URL = "https://aalpziidoobrqeppsvmi.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_Dzt7QBcxmcidwgZE3rkQcA_yoKmje1w"; 

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let localProducts = [];
let cart = JSON.parse(localStorage.getItem('arkan_cart')) || [];
let productToConfirm = null; 

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

    const confirmBtn = document.getElementById('modal-btn-confirm');
    if(confirmBtn) {
        confirmBtn.addEventListener('click', confirmAddToCart);
    }
});

// 2. عرض المنتجات في الصفحة الرئيسية
// 2. عرض المنتجات في الصفحة الرئيسية
function renderProducts(productsList) {
    const grid = document.getElementById('products-grid');
    if(!grid) return; 
    grid.innerHTML = '';
    
    productsList.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        // النقر على أي مكان في الكرت (بما فيه اقرأ المزيد) سينقلك لصفحة التفاصيل
        card.onclick = () => { window.location.href = `product-details.html?id=${product.sku}`; };
        
        // --- المعالجة الجديدة للوصف ---
        let descText = product.description || "منتج أركان فارما المميز.";
        // إذا كان الوصف أطول من 50 حرف، نقصه ونضع "..اقرأ المزيد"
        if (descText.length > 120) {
            descText = descText.substring(0, 120) + ' <span class="read-more">إقرأ المزيد ..</span>';
        }

        card.innerHTML = `
            <div class="image-container"><img src="${product.imageUrl || 'https://via.placeholder.com/200'}" alt="${product.name}"></div>
            <div class="product-info">
                <h4 class="product-title">${product.name}</h4>
                <p class="product-description">${descText}</p>
                <div class="price-row">${product.price} ل.س</div>
                <button type="button" class="btn-add-to-cart" onclick="event.stopPropagation(); askToConfirmAdd('${product.sku}', '${product.name}', ${product.price})">إضافة إلى السلة</button>
            </div>
        `;
        grid.appendChild(card);
    });
}   

// =========================================
// 3. دوال نافذة التأكيد والإشعارات
// =========================================

function askToConfirmAdd(sku, name, price) {
    productToConfirm = { sku, name, price };
    const nameElement = document.getElementById('modal-target-product');
    const modalElement = document.getElementById('custom-confirm-modal');
    
    if(nameElement && modalElement) {
        nameElement.textContent = name;
        modalElement.classList.add('active');
    }
}

function closeConfirmModal() {
    const modalElement = document.getElementById('custom-confirm-modal');
    if(modalElement) {
        modalElement.classList.remove('active');
    }
    productToConfirm = null; 
}

function confirmAddToCart() {
    if (!productToConfirm) return;

    const existingItem = cart.find(item => String(item.sku) === String(productToConfirm.sku));
    
    if (existingItem) { 
        existingItem.qty += 1; 
    } else { 
        cart.push({ ...productToConfirm, qty: 1 }); 
    }
    
    localStorage.setItem('arkan_cart', JSON.stringify(cart));
    updateCartCount(); 
    closeConfirmModal(); 
    showToast("تمت الإضافة إلى سلتك بنجاح! 🛒"); 
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> <span>${message}</span>`;
    
    container.appendChild(toast);

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

// ========================================================
// 5. نظام المصادقة (إنشاء حساب + تسجيل دخول) - رسائل أنيقة
// ========================================================

// دالة إنشاء حساب جديد
async function registerUser(event) {
    event.preventDefault(); 
    
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    if (password !== confirmPassword) {
        Swal.fire({
            icon: 'warning',
            title: 'انتبه من فضلك',
            text: 'كلمات المرور غير متطابقة 🧐',
            confirmButtonText: 'حسناً',
            confirmButtonColor: '#f39c12' // لون برتقالي
        });
        return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            data: { full_name: name }
        }
    });

    if (error) {
        Swal.fire({
            icon: 'error',
            title: 'حدث خطأ',
            text: error.message,
            confirmButtonText: 'حسناً',
            confirmButtonColor: '#e74c3c' // لون أحمر
        });
    } else {
        Swal.fire({
            icon: 'success',
            title: 'أهلاً بك في عائلة أركان!',
            text: 'تم إنشاء حسابك بنجاح 🎉',
            confirmButtonText: 'الذهاب لتسجيل الدخول',
            confirmButtonColor: '#2ecc71' // لون أخضر
        }).then(() => {
            // يتم التحويل فقط بعد أن يضغط المستخدم على زر "الذهاب لتسجيل الدخول"
            window.location.href = 'login.html'; 
        });
    }
}

// كود تسجيل الدخول
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            Swal.fire({
                icon: 'error',
                title: 'عذراً!',
                text: 'البريد الإلكتروني أو كلمة المرور غير صحيحة 😔',
                confirmButtonText: 'إعادة المحاولة',
                confirmButtonColor: '#e74c3c'
            });
        } else {
            Swal.fire({
                icon: 'success',
                title: 'مرحباً بعودتك!',
                text: 'تم تسجيل الدخول بنجاح 🌟',
                timer: 2000, // ستختفي الرسالة تلقائياً بعد ثانيتين
                showConfirmButton: false
            }).then(() => {
                window.location.href = 'index.html'; 
            });
        }
    });
}
// =========================================
// 6. إدارة جلسات المستخدمين (Session Management)
// =========================================

// مراقبة حالة تسجيل الدخول تلقائياً
supabaseClient.auth.onAuthStateChange((event, session) => {
    updateAuthUI(session);
});

// دالة لتحديث شكل الهيدر بناءً على حالة المستخدم
// دالة لتحديث شكل الهيدر بناءً على حالة المستخدم
function updateAuthUI(session) {
    const headerLinks = document.querySelector('.header-links');
    if (!headerLinks) return;

    if (session) {
        // المستخدم مسجل الدخول: نخفي كلمة "مرحباً" على الموبايل ونترك الاسم فقط لتوفير المساحة
        const userName = session.user.user_metadata.full_name || "صديق أركان";
        
        headerLinks.innerHTML = `
            <a href="#" style="cursor: default;"><i class="fas fa-user" style="margin-left: 5px;"></i> <span class="hide-on-mobile">مرحباً، </span>${userName}</a>
            <a href="#" onclick="logoutUser(event)" style="color: #e74c3c;"><i class="fas fa-sign-out-alt" style="margin-left: 5px;"></i> خروج</a>
        `;
    } else {
        // المستخدم غير مسجل: نطبق طلبك بتبديل الكلمات للموبايل
        headerLinks.innerHTML = `
            <a href="about.html"><i class="fas fa-info-circle" style="margin-left: 5px;"></i> حول <span class="hide-on-mobile">الشركة</span></a>
            <a href="login.html"><i class="fas fa-user-plus" style="margin-left: 5px;"></i> <span class="desktop-only-text">تسجيل الدخول</span><span class="mobile-only-text">حسابي</span></a>
        `;
    }
}
// دالة تسجيل الخروج
async function logoutUser(event) {
    event.preventDefault();
    const { error } = await supabaseClient.auth.signOut();
    
    if (!error) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: 'إلى اللقاء!',
                text: 'تم تسجيل الخروج بنجاح',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                window.location.reload(); // إعادة تحميل الصفحة لتطبيق التغييرات
            });
        } else {
            window.location.reload();
        }
    }
}