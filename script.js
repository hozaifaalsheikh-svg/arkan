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
            brand: product.brand || "Bioxcin", // جلب البراند من قاعدة البيانات
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
function renderProducts(productsList) {
    const grid = document.getElementById('products-grid');
    if(!grid) return; 
    grid.innerHTML = '';
    
    productsList.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        // النقر على الكرت ينقلك لصفحة التفاصيل
        card.onclick = () => { window.location.href = `product-details.html?id=${product.sku}`; };
        
        let descText = product.description || "منتج أركان فارما المميز.";
        let readMoreHtml = '';
        
        // إذا كان النص أطول من 60 حرف، سيقوم بإنشاء زر "اقرأ المزيد"
        if (descText.length > 60) {
            readMoreHtml = '<span class="read-more">اقرأ المزيد</span>';
        }

        // قمنا بتعديل محتوى البطاقة (card.innerHTML) هنا
        card.innerHTML = `
            <div class="image-container"><img src="${product.imageUrl || 'https://via.placeholder.com/200'}" alt="${product.name}"></div>
            <div class="product-info">
                <span class="product-brand">${product.brand}</span>
                <h4 class="product-title">${product.name}</h4>
                <div class="desc-wrapper">
                    <p class="product-description">${descText}</p>
                    ${readMoreHtml}
                </div>

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
    document.getElementById('cart-counter-badge').textContent = cart.length; // أو مجموع الكميات حسب برمجتك
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
    // 1. استرجاع الإيميل المحفوظ تلقائياً عند فتح صفحة تسجيل الدخول
    const savedEmail = localStorage.getItem("arkan_remembered_email");
    if (savedEmail) {
        document.getElementById('login-email').value = savedEmail;
        document.getElementById('remember-me').checked = true;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const rememberCheckbox = document.getElementById('remember-me'); // جلب حالة زر تذكرني

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
            // 2. إذا نجح تسجيل الدخول، نتحقق من زر "تذكرني"
            if (rememberCheckbox && rememberCheckbox.checked) {
                localStorage.setItem("arkan_remembered_email", email); // حفظ الإيميل
            } else {
                localStorage.removeItem("arkan_remembered_email"); // مسحه إذا ألغى التحديد
            }

            Swal.fire({
                icon: 'success',
                title: 'مرحباً بعودتك!',
                text: 'تم تسجيل الدخول بنجاح 🌟',
                timer: 2000, 
                showConfirmButton: false
            }).then(() => {
                window.location.href = 'index.html'; 
            });
        }
    });
}
// 6. إدارة جلسات المستخدمين (Session Management)
// =========================================

// مراقبة حالة تسجيل الدخول تلقائياً
supabaseClient.auth.onAuthStateChange((event, session) => {
    updateAuthUI(session);
});

// دالة لتحديث شكل الهيدر بناءً على حالة المستخدم
// دالة لتحديث شكل الهيدر بناءً على حالة المستخدم
function updateAuthUI(session) {
    // استهداف الحاوية الديناميكية فقط
    const authContainer = document.getElementById('auth-container') || document.querySelector('.header-links');
    if (!authContainer) return;

    if (session) {
        // إذا كان المستخدم مسجلاً
        const userName = session.user.user_metadata?.full_name || "حسابي";
        
        authContainer.innerHTML = `
            <a href="#" onclick="askToLogout(event)" class="header-action-btn" style="text-decoration: none;" title="تسجيل الخروج">
                <i class="fas fa-user"></i> 
                <span class="hide-on-mobile">${userName}</span>
                <span class="mobile-only-text">خروج</span>
            </a>
        `;
    } else {
        // إذا لم يكن مسجلاً
        authContainer.innerHTML = `
            <a href="login.html" class="header-action-btn" style="text-decoration: none;">
                <i class="fas fa-user-plus"></i> 
                <span class="hide-on-mobile">تسجيل الدخول</span>
                <span class="mobile-only-text">حسابي</span>
            </a>
        `;
    }
}
// دالة تأكيد تسجيل الخروج

function askToLogout(event) {
    event.preventDefault();
    
    Swal.fire({
        title: 'تسجيل الخروج؟',
        text: 'هل تود مغادرة الحساب؟', // نص مختصر ليناسب النافذة الصغيرة
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c',
        cancelButtonColor: '#1a365d',
        confirmButtonText: 'نعم', // اختصار الزر ليناسب المساحة
        cancelButtonText: 'إلغاء',
        reverseButtons: true,
        // هذه الكلاسات هي التي تربط الكود بالتنسيق الجديد في الـ CSS
        customClass: {
            popup: 'my-swal-popup',
            title: 'my-swal-title'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            logoutUser(event);
        }
    });
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
// دالة تبديل اللوحات (Panels)
function showPanel(panelId, element) {
    // إخفاء جميع اللوحات
    document.querySelectorAll('.content-panel').forEach(p => p.style.display = 'none');
    // إظهار اللوحة المطلوبة
    const target = document.getElementById(panelId);
    if (target) target.style.display = 'block';

    // تحديث تفعيل الزر في القائمة
    document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
    if (element) element.classList.add('active');
}

// دالة حفظ البروفايل (مبدئية)
function saveProfile() {
    const name = document.getElementById('full-name').value;
    const phone = document.getElementById('phone-number').value;
    console.log("جاري حفظ:", name, phone);
    alert("تم حفظ البيانات بنجاح!");
}

// حماية الكود من الانهيار عند فتح صفحة الحساب
window.addEventListener('DOMContentLoaded', () => {
    // إذا كنت في الصفحة الرئيسية، حمل المنتجات
    const grid = document.getElementById('products-grid');
    if (grid) {
        loadProductsFromSupabase();
    }
});