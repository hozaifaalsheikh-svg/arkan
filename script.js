const SUPABASE_URL = "https://aalpziidoobrqeppsvmi.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_Dzt7QBcxmcidwgZE3rkQcA_yoKmje1w"; 

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let localProducts = [];
let cart = JSON.parse(localStorage.getItem('arkan_cart')) || [];
let productToConfirm = null; 
let currentSypRate = 14000; // سعر صرف افتراضي للطوارئ

// =========================================
// 1. جلب سعر الصرف من قاعدة البيانات
// =========================================
async function fetchExchangeRate() {
    try {
        const { data, error } = await supabaseClient
            .from('app_settings')
            .select('current_syp_rate')
            .eq('id', 1)
            .single();

        if (error) throw error;
        
        if (data && data.current_syp_rate) {
            currentSypRate = data.current_syp_rate;
            console.log("تم جلب سعر الصرف بنجاح:", currentSypRate);
        }
    } catch (err) {
        console.error("فشل جلب سعر الصرف، سيتم استخدام السعر الافتراضي:", err);
    }
}

// =========================================
// 2. جلب المنتجات من Supabase وحساب السعر
// =========================================
async function loadProductsFromSupabase() {
    try {
        const { data, error } = await supabaseClient.from('inventory').select('*');
        if (error) { console.error("خطأ:", error); return; }

        localProducts = data.map(product => {
            const priceInUSD = product.price || 0;
            const priceInSYP = Math.round(priceInUSD * currentSypRate); // ضرب السعر بالدولار بسعر الصرف المحدث

            return {
                sku: product.sku,
                name: product.name,
                description: product.description || "منتج أركان فارما المميز.",
                priceUSD: priceInUSD, // نحتفظ بسعر الدولار كمرجع إذا لزم الأمر
                priceSYP: priceInSYP, // السعر النهائي بالليرة السورية
                category: product.category || "عام",
                brand: product.brand || "Bioxcin", 
                imageUrl: product.image_url 
            };
        });
        renderProducts(localProducts); 
    } catch (err) { console.error("فشل الاتصال:", err); }
}

// =========================================
// تشغيل الأكواد عند تحميل الصفحة (مدمجة ومنظمة)
// =========================================
document.addEventListener('DOMContentLoaded', async () => {
    // 1. جلب سعر الصرف أولاً
    await fetchExchangeRate();
    
    // 2. جلب المنتجات وعرضها (إذا كنا في الصفحة التي تحتوي على المنتجات)
    const grid = document.getElementById('products-grid');
    if (grid) {
        await loadProductsFromSupabase();
    }

    // 3. تحديث السلة والأزرار
    updateCartCount();
    const confirmBtn = document.getElementById('modal-btn-confirm');
    if(confirmBtn) {
        confirmBtn.addEventListener('click', confirmAddToCart);
    }
});

// =========================================
// 3. عرض المنتجات في الصفحة الرئيسية
// =========================================
function renderProducts(productsList) {
    const grid = document.getElementById('products-grid');
    if(!grid) return; 
    grid.innerHTML = '';
    
    productsList.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => { window.location.href = `product-details.html?id=${product.sku}`; };
        
        let descText = product.description || "منتج أركان فارما المميز.";
        let readMoreHtml = '';
        
        if (descText.length > 60) {
            readMoreHtml = '<span class="read-more">اقرأ المزيد</span>';
        }

        // تنسيق السعر ليحتوي على فواصل (مثال: 150,000)
        const formattedPriceSYP = product.priceSYP.toLocaleString('ar-SY');

        card.innerHTML = `
            <div class="image-container"><img src="${product.imageUrl || 'https://via.placeholder.com/200'}" alt="${product.name}"></div>
            <div class="product-info">
                <span class="product-brand">${product.brand}</span>
                <h4 class="product-title">${product.name}</h4>
                <div class="desc-wrapper">
                    <p class="product-description">${descText}</p>
                    ${readMoreHtml}
                </div>

                <div class="price-row">${formattedPriceSYP} ل.س</div>
                <button type="button" class="btn-add-to-cart" onclick="event.stopPropagation(); askToConfirmAdd('${product.sku}', '${product.name}', ${product.priceSYP})">إضافة إلى السلة</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// =========================================
// 4. دوال نافذة التأكيد والإشعارات
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
// 5. دوال السلة والفلترة والبحث 
// =========================================
function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if(cartCount) cartCount.textContent = cart.reduce((acc, item) => acc + item.qty, 0);
    
    const cartBadge = document.getElementById('cart-counter-badge');
    if (cartBadge) cartBadge.textContent = cart.length; 
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
// 6. نظام المصادقة (إنشاء حساب + تسجيل دخول)
// ========================================================
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
            confirmButtonColor: '#f39c12' 
        });
        return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: { data: { full_name: name } }
    });

    if (error) {
        Swal.fire({
            icon: 'error',
            title: 'حدث خطأ',
            text: error.message,
            confirmButtonText: 'حسناً',
            confirmButtonColor: '#e74c3c' 
        });
    } else {
        Swal.fire({
            icon: 'success',
            title: 'أهلاً بك في عائلة أركان!',
            text: 'تم إنشاء حسابك بنجاح 🎉',
            confirmButtonText: 'الذهاب لتسجيل الدخول',
            confirmButtonColor: '#2ecc71' 
        }).then(() => {
            window.location.href = 'login.html'; 
        });
    }
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
    const savedEmail = localStorage.getItem("arkan_remembered_email");
    if (savedEmail) {
        document.getElementById('login-email').value = savedEmail;
        document.getElementById('remember-me').checked = true;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const rememberCheckbox = document.getElementById('remember-me'); 

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
            if (rememberCheckbox && rememberCheckbox.checked) {
                localStorage.setItem("arkan_remembered_email", email); 
            } else {
                localStorage.removeItem("arkan_remembered_email"); 
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

// =========================================
// 7. إدارة جلسات المستخدمين (Session Management)
// =========================================
supabaseClient.auth.onAuthStateChange((event, session) => {
    updateAuthUI(session);
});

function updateAuthUI(session) {
    const authContainer = document.getElementById('auth-container') || document.querySelector('.header-links');
    if (!authContainer) return;

    if (session) {
        let fullName = session.user.user_metadata?.full_name || "حسابي";
        let firstName = fullName.split(' ')[0]; 

        authContainer.innerHTML = `
            <a href="#" onclick="askToLogout(event)" class="header-action-btn" style="text-decoration: none;" title="تسجيل الخروج">
                <i class="fas fa-user" style="color: var(--primary-color);"></i> 
                <span style="margin: 0 6px; font-weight: bold; font-size: 14px;">${firstName}</span>
                <i class="fas fa-sign-out-alt" style="color: #dc3545; font-size: 15px;" title="خروج"></i>
            </a>
        `;
    } else {
        authContainer.innerHTML = `
            <a href="login.html" class="header-action-btn" style="text-decoration: none;">
                <i class="fas fa-user-plus"></i> 
                <span class="hide-on-mobile">تسجيل الدخول</span>
                <span class="mobile-only-text">حسابي</span>
            </a>
        `;
    }
}

function askToLogout(event) {
    event.preventDefault();
    
    Swal.fire({
        title: 'تسجيل الخروج؟',
        text: 'هل تود مغادرة الحساب؟', 
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c',
        cancelButtonColor: '#1a365d',
        confirmButtonText: 'نعم', 
        cancelButtonText: 'إلغاء',
        reverseButtons: true,
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
                window.location.reload(); 
            });
        } else {
            window.location.reload();
        }
    }
}

// دالة تبديل اللوحات (Panels)
function showPanel(panelId, element) {
    document.querySelectorAll('.content-panel').forEach(p => p.style.display = 'none');
    const target = document.getElementById(panelId);
    if (target) target.style.display = 'block';

    document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
    if (element) element.classList.add('active');
}

function saveProfile() {
    const name = document.getElementById('full-name').value;
    const phone = document.getElementById('phone-number').value;
    console.log("جاري حفظ:", name, phone);
    alert("تم حفظ البيانات بنجاح!");
}