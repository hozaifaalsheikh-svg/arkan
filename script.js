<script>
    const supabaseClient = window.supabase.createClient("https://aalpziidoobrqeppsvmi.supabase.co", "sb_publishable_Dzt7QBcxmcidwgZE3rkQcA_yoKmje1w");

    async function loadProductDetails() {
        const productId = new URLSearchParams(window.location.search).get('id');
        if (!productId) return;

        const { data } = await supabaseClient.from('inventory').select('*').eq('sku', productId).single();
        
        if (data) {
            document.getElementById('loading').style.display = 'none';
            const contentDiv = document.getElementById('product-details-content');
            contentDiv.style.display = 'grid';
            
            // نضع بيانات المنتج داخل الـ HTML الخاص بالزر مباشرة
            contentDiv.innerHTML = `
                <div class="product-image-box"><img src="${data.image_url}" alt="${data.name}"></div>
                <div class="product-info-box">
                    <h1>${data.name}</h1>
                    <div class="price">${data.price} ل.س</div>
                    <button class="btn-add-to-cart" onclick="addToCart('${data.sku}', '${data.name.replace(/'/g, "\\'")}', ${data.price})" style="padding:15px; background:#f27a1a; color:white; border:none; cursor:pointer;">
                       إضافة للسلة
                    </button>
                </div>
            `;
        }
    }

    // هذه الدالة تفتح النافذة وتخزن المنتج في "ذاكرة الجلسة"
    function addToCart(sku, name, price) {
        sessionStorage.setItem('pendingProduct', JSON.stringify({sku, name, price}));
        document.getElementById('modal-product-name').textContent = name;
        document.getElementById('modal-product-price').textContent = price + " ل.س";
        document.getElementById('confirm-modal').style.display = 'flex';
    }

    // زر التأكيد (مربوط مباشرة في الـ HTML أو هنا)
    document.getElementById('confirm-btn').onclick = function() {
        const product = JSON.parse(sessionStorage.getItem('pendingProduct'));
        if (!product) return;
        
        let cart = JSON.parse(localStorage.getItem('arkan_cart')) || [];
        cart.push({ ...product, qty: 1 });
        localStorage.setItem('arkan_cart', JSON.stringify(cart));
        
        document.getElementById('confirm-modal').style.display = 'none';
        alert("تمت الإضافة للسلة!");
    };

    function closeModal() { document.getElementById('confirm-modal').style.display = 'none'; }
    document.addEventListener('DOMContentLoaded', loadProductDetails);
</script>