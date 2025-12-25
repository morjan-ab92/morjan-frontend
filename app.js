/* ===== J&A JEWELRY - GLOBAL JAVASCRIPT ===== */

// DEBUG: Log when app.js loads
console.log("APP.JS loaded", new Date().toISOString(), location.href);

// CRITICAL: Emergency guard to prevent infinite reload loops
if (window.__APP_INITIALIZED__) {
    console.error('🚨 CRITICAL: app.js attempting to load multiple times - This indicates an infinite reload loop!');
    console.error('🚨 Check for: window.location.reload(), storage listeners, or switchLanguage overrides');
    // Don't throw - just log the error and continue (might break but at least we see the error)
}
window.__APP_INITIALIZED__ = true;

const translations = {
  ar: {
    "admin.dashboard": "لوحة التحكم",
    "admin.statistics": "الإحصائيات",
    "admin.all_products": "جميع المنتجات",
    "admin.bulk_upload": "رفع دفعة",
    "admin.add_product": "إضافة منتج جديد",
    "admin.json_label": "رفع ملف JSON",
    "admin.upload_json": "رفع JSON",
    "admin.form.name": "الاسم",
    "admin.form.category": "نوع المنتج",
    "admin.form.gender": "الجنس",
    "admin.form.price_before": "السعر قبل الخصم",
    "admin.form.price_after": "السعر بعد الخصم",
    "admin.form.image_url": "رابط الصورة",
    "admin.table.name": "الاسم",
    "admin.table.category": "الفئة",
    "admin.table.gender": "الجنس",
    "admin.table.price_before": "السعر قبل",
    "admin.table.price_after": "السعر بعد",
    "admin.table.image": "الصورة",
    "admin.table.document_id": "معرّف المستند",
    "admin.table.actions": "الإجراءات",
    "admin.action.add_product": "إضافة منتج",
    "admin.action.save_changes": "حفظ التعديلات",
    "brand-main": "<span dir=\"ltr\" class=\"brand-name\">J&amp;A Jewelry</span>",
    "brand-sub": "حيث يلتقي الذوق الرفيع بالفخامة",
    "brand-slogan": "الفخامة تليق بك.",
    "nav-home": "الرئيسية",
    "nav-perfumes": "العطور",
    "nav-watches": "الساعات",
    "nav-bags": "الحقائب",
    "nav-accessories": "الإكسسوارات",
    "nav-products": "المنتجات",
    "nav-cart": "السلة",
    "nav-about": "عنا",
    "nav-contact": "تواصل",
    "btn-shop": "تسوق الآن",
    "btn-show-all": "عرض الكل",
    "btn-add-to-cart": "أضف إلى السلة",
    "cart.title": "سلة التسوق",
    "cart.subtitle": "راجع العناصر المحددة",
    "cart.items": "عناصر السلة",
    "cart.order_summary": "ملخص الطلب",
    "cart.subtotal": "المجموع الفرعي",
    "cart.shipping": "الشحن",
    "cart.total": "المجموع",
    "cart.checkout": "الدفع",
    "cart.continue_shopping": "متابعة التسوق",
    "cart.empty": "سلة التسوق فارغة",
    "cart.empty_title": "سلة التسوق فارغة",
    "cart.empty_message": "يبدو أنك لم تضيف أي عناصر إلى سلة التسوق بعد.",
    "cart.start_shopping": "ابدأ التسوق",
    "navigation.home": "الرئيسية",
    "navigation.perfumes": "العطور",
    "navigation.watches": "الساعات",
    "navigation.bags": "الحقائب",
    "navigation.accessories": "الإكسسوارات",
    "navigation.about": "عنا",
    "navigation.contact": "تواصل",
    "navigation.products": "المنتجات",
    "navigation.cart": "السلة",
    "navigation.login": "تسجيل الدخول",
    "navigation.logout": "تسجيل الخروج",
    "auth.logout": "تسجيل الخروج",
    "greeting.hello": "مرحبا",
    "login.email": "البريد الإلكتروني",
    "login.password": "كلمة المرور",
    "login.login_button": "تسجيل الدخول",
    "login.google_login": "تسجيل الدخول بواسطة Google",
    "login.create_account": "إنشاء حساب جديد",
    "login-title": "تسجيل الدخول",
    "login-welcome": "مرحباً بك في <span dir=\"ltr\" class=\"brand-name\">J&A Jewelry</span>",
    "login-email": "البريد الإلكتروني",
    "login-password": "كلمة المرور",
    "login-button": "تسجيل الدخول",
    "login-or": "أو",
    "login-google": "تسجيل الدخول بواسطة Google",
    "login-slogan-title": "حيث يلتقي الذوق الرفيع بالفخامة",
    "login-slogan-subtitle": "الفخامة تليق بك.",
    "login-no-account": "ليس لديك حساب؟",
    "login-create-account": "إنشاء حساب جديد",
    "footer.description": "وجهتك المفضلة للحصول على الساعات الفاخرة والعطور والحقائب والإكسسوارات.",
    "footer.quick_links": "روابط سريعة",
    "footer.contact": "معلومات التواصل",
    "footer.rights": "جميع الحقوق محفوظة",
    "categories-perfumes": "العطور الفاخرة",
    "perfumes-description": "اكتشف مجموعتنا المختارة بعناية من العطور المميزة من أشهر العلامات التجارية في العالم",
    "filter-shop-by": "تصفية",
    "filter-view-as": "عرض كـ",
    "filter-brand": "العلامة التجارية",
    "filter-category": "الفئة",
    "filter-material": "المادة",
    "filter-type": "النوع",
    "filter-gender": "الجنس",
    "filter-men": "رجال",
    "filter-women": "نساء",
    "product-gender-men": "👔 رجالي",
    "product-gender-women": "💎 نسائي",
    "filter-travel": "✈️ سفر",
    "filter-unisex": "للجنسين",
    "filter-availability": "التوفر",
    "filter-in-stock": "متوفر",
    "filter-limited": "محدود",
    "filter-price": "السعر",
    "filter-sort-by": "ترتيب حسب",
    "filter-featured": "مميز",
    "filter-price-low": "السعر: من الأقل للأعلى",
    "filter-price-high": "السعر: من الأعلى للأقل",
    "filter-name": "الاسم أ-ي",
    "categories-watches": "الساعات الفاخرة",
    "watches-description": "استكشف مجموعتنا المختارة بعناية من الساعات المميزة من أشهر صانعي الساعات",
    "categories-bags": "الحقائب الفاخرة",
    "bags-description": "اكتشف مجموعتنا الحصرية من حقائب اليد المصممة والإكسسوارات الفاخرة",
    "categories-accessories": "الإكسسوارات الأنيقة",
    "accessories-description": "أكمل إطلالتك مع مجموعتنا المذهلة من المجوهرات والإكسسوارات",
    "about-title": "من نحن",
    "about-text": "<span dir=\"ltr\" class=\"brand-name\">J&amp;A Jewelry</span> هو متجر فاخر يقدم مجموعة مختارة بعناية من العطور الأصلية، الساعات الأنيقة، الإكسسوارات الراقية والحقائب الفخمة للرجال والنساء. نؤمن بأن كل تفصيل صغير يصنع فرقًا كبيرًا، لذا نضمن أن كل قطعة لدينا تعكس الفخامة والأناقة والجودة العالية.",
    "contact-title": "تواصل معنا",
    "contact-address": "العنوان",
    "address-content": "باقة الغربية – شارع بير بورين",
    "contact-whatsapp": "الهاتف وواتساب",
    "contact-social": "وسائل التواصل الاجتماعي",
    "contact-instagram": "إنستغرام",
    "contact-facebook": "فيسبوك",
    "contact-tiktok": "تيك توك",
    "footer-quick": "روابط سريعة",
    "footer-contact": "معلومات التواصل",
    "footer-tagline": "وجهتك المفضلة للحصول على الساعات الفاخرة والعطور والحقائب والإكسسوارات.",
    "footer-copy": "<span class='copyright-text'>© 2025 <span dir=\"ltr\" class=\"brand-name\">J&amp;A Jewelry</span>.</span> جميع الحقوق محفوظة.",
    "show-all-perfumes": "عرض الكل ",
    "show-all-watches": "عرض الكل ",
    "show-all-bags": "عرض الكل ",
    "show-all-accessories": "عرض الكل",
    "checkout.title": "J&A Jewelry - الدفع",
    "checkout.shipping_title": "معلومات الشحن",
    "checkout.payment_title": "طريقة الدفع",
    "checkout.review_title": "مراجعة الطلب",
    "checkout.order_summary": "ملخص الطلب",
    "checkout.first_name": "الاسم الأول",
    "checkout.last_name": "الاسم الأخير",
    "checkout.email": "البريد الإلكتروني",
    "checkout.phone": "رقم الهاتف",
    "checkout.address": "العنوان",
    "checkout.city": "المدينة",
    "checkout.postal_code": "الرمز البريدي",
    "checkout.delivery_method": "طريقة التوصيل",
    "checkout.pickup_store": "استلام من المتجر",
    "checkout.store_pickup": "استلام من المتجر",
    "checkout.home_delivery": "توصيل للمنزل",
    "checkout.choose_area": "اختر المنطقة",
    "checkout.select_region": "اختر المنطقة",
    "checkout.area_local": "باقة / جت / ميسر / زيمر (+₪20)",
    "checkout.region_local": "باقة الغربية / جت / ميسر / زيمر (+₪20)",
    "checkout.area_other": "شمال أو جنوب (+₪70)",
    "checkout.region_other": "شمال أو جنوب (مناطق أخرى) (+₪70)",
    "checkout.pickup_note": "الاستلام متاح من متجر <span dir=\"ltr\" class=\"brand-name\">J&amp;A Jewelry</span> خلال ساعات العمل.",
    "checkout.payment_method_title": "طريقة الدفع",
    "checkout.payment_cash": "نقد (عند الاستلام)",
    "checkout.payment_credit": "بطاقة ائتمان",
    "checkout.payment_apple": "Apple Pay",
    "checkout.payment_bit": "Bit",
    "checkout.place_order": "تأكيد الطلب",
    "checkout.processing": "جاري معالجة طلبك...",
    "checkout.subtotal": "المجموع الفرعي",
    "checkout.shipping": "الشحن",
    "checkout.discount": "الخصم",
    "checkout.total": "المجموع",
    "checkout.total_final": "المجموع النهائي",
    "checkout.auth_title": "تسجيل الدخول أو المتابعة كضيف",
    "checkout.google_signin": "تسجيل الدخول بـ Google",
    "checkout.email_signin": "تسجيل الدخول بالبريد الإلكتروني",
    "checkout.guest_checkout": "المتابعة كضيف",
    "checkout.credit_card": "بطاقة ائتمان",
    "checkout.secure_payment": "دفع آمن",
    "checkout.credit.title": "بطاقة ائتمان",
    "checkout.credit.note": "سيتم إرسال رابط الدفع عبر واتساب",
    "checkout.paypal_desc": "دفع عبر PayPal",
    "checkout.cash_delivery": "الدفع عند الاستلام",
    "checkout.cash_desc": "دفع نقدي عند التسليم",
    "checkout.notes": "ملاحظات إضافية (اختياري)",
    "checkout.discount_code": "كود الخصم (اختياري)",
    "checkout.delivery": "توصيل",
    "checkout.delivery_desc": "نوصل إلى عنوانك",
    "checkout.pickup": "استلام من المتجر",
    "checkout.pickup_desc": "استلم من متجرنا",
    "checkout.delivery_area": "اختر منطقتك",
    "checkout.street": "الشارع",
    "checkout.house_number": "رقم المنزل",
    "checkout.cash": "نقد",
    "checkout.paypal": "PayPal",
    "checkout.bit": "Bit",
    "checkout.select_area": "-- اختر المنطقة --",
    "checkout.area_baqa": "باقة الغربية (₪25)",
    "checkout.area_jatt": "جت (₪25)",
    "checkout.area_meiser": "ميسر (₪25)",
    "checkout.coupon.title": "رمز الكوبون",
    "checkout.coupon.placeholder": "أدخل رمز الكوبون",
    "checkout.coupon.apply": "تطبيق",
    "checkout.coupon.error": "حدث خطأ أثناء تطبيق الكوبون، حاول مرة أخرى",
    "checkout.coupon.empty": "الرجاء إدخال رمز الكوبون",
    "products.add_to_cart": "أضف للسلة",
    "product.materials.gold_filled": "ذهب مملوء",
    "product.materials.silver": "فضة",
    "product.colors.gold": "ذهب",
    "product.colors.silver": "فضة",
    "product.types.bracelet": "سوار",
    "product.types.ring": "خاتم",
    "product.types.set": "طقم",
    "product.types.necklace": "قلادة",
    "sale": "تخفيض"
  },
  he: {
    "admin.dashboard": "לוח ניהול",
    "admin.statistics": "סטטיסטיקה",
    "admin.all_products": "כל המוצרים",
    "admin.bulk_upload": "העלאה מרוכזת",
    "admin.add_product": "הוסף מוצר חדש",
    "admin.json_label": "העלה קובץ JSON",
    "admin.upload_json": "העלה JSON",
    "admin.form.name": "שם",
    "admin.form.category": "סוג מוצר",
    "admin.form.gender": "מין",
    "admin.form.price_before": "מחיר לפני",
    "admin.form.price_after": "מחיר אחרי",
    "admin.form.image_url": "כתובת תמונה",
    "admin.table.name": "שם",
    "admin.table.category": "קטגוריה",
    "admin.table.gender": "מין",
    "admin.table.price_before": "מחיר לפני",
    "admin.table.price_after": "מחיר אחרי",
    "admin.table.image": "תמונה",
    "admin.table.document_id": "מזהה מסמך",
    "admin.table.actions": "פעולות",
    "admin.action.add_product": "הוסף מוצר",
    "admin.action.save_changes": "שמור שינויים",
    "brand-main": "<span dir=\"ltr\" class=\"brand-name\">J&amp;A Jewelry</span>",
    "brand-sub": "כאשר האלגנטיות פוגשת את היוקרה",
    "brand-slogan": "יוקרה שמדברת אליך.",
    "nav-home": "דף הבית",
    "nav-perfumes": "בשמים",
    "nav-watches": "שעונים",
    "nav-bags": "תיקים",
    "nav-accessories": "אקססוריז",
    "nav-products": "מוצרים",
    "nav-cart": "עגלה",
    "nav-about": "עלינו",
    "nav-contact": "צור קשר",
    "btn-shop": "קני עכשיו",
    "btn-show-all": "הצג הכל",
    "btn-add-to-cart": "הוסף לעגלה",
    "cart.title": "עגלת קניות",
    "cart.subtitle": "סקור את הפריטים שנבחרו",
    "cart.items": "פריטים בעגלה",
    "cart.order_summary": "סיכום הזמנה",
    "cart.subtotal": "סכום ביניים",
    "cart.shipping": "משלוח",
    "cart.total": "סה\"כ",
    "cart.checkout": "תשלום",
    "cart.continue_shopping": "המשך קניות",
    "cart.empty": "העגלה ריקה",
    "cart.empty_title": "העגלה ריקה",
    "cart.empty_message": "נראה שעדיין לא הוספת פריטים לעגלה.",
    "cart.start_shopping": "התחל לקנות",
    "navigation.home": "בית",
    "navigation.perfumes": "בשמים",
    "navigation.watches": "שעונים",
    "navigation.bags": "תיקים",
    "navigation.accessories": "אביזרים",
    "navigation.about": "עלינו",
    "navigation.contact": "צור קשר",
    "navigation.products": "מוצרים",
    "navigation.cart": "עגלה",
    "navigation.login": "התחברות",
    "navigation.logout": "התנתקות",
    "auth.logout": "התנתק",
    "greeting.hello": "שלום",
    "login.email": "כתובת אימייל",
    "login.password": "סיסמה",
    "login.login_button": "התחבר",
    "login.google_login": "התחבר עם Google",
    "login.create_account": "צור חשבון חדש",
    "login-title": "התחברות",
    "login-welcome": "ברוך הבא ל־<span dir=\"ltr\" class=\"brand-name\">J&A Jewelry</span>",
    "login-email": "אימייל",
    "login-password": "סיסמה",
    "login-button": "התחברות",
    "login-or": "או",
    "login-google": "התחבר עם Google",
    "login-slogan-title": "כאשר האלגנטיות פוגשת את היוקרה",
    "login-slogan-subtitle": "יוקרה שמדברת אליך",
    "login-no-account": "אין לך חשבון?",
    "login-create-account": "צור חשבון",
    "footer.description": "היעד המוביל שלך לשעונים יוקרתיים, בשמים, תיקים ואביזרים.",
    "footer.quick_links": "קישורים מהירים",
    "footer.contact": "פרטי קשר",
    "footer.rights": "כל הזכויות שמורות.",
    "categories-perfumes": "בשמים יוקרתיים",
    "perfumes-description": "גלה את האוסף הנבחר שלנו של בושם יוקרתי ממותגי היוקרה המפורסמים בעולם",
    "filter-shop-by": "סינון",
    "filter-view-as": "הצג כ",
    "filter-brand": "מותג",
    "filter-category": "קטגוריה",
    "filter-material": "חומר",
    "filter-type": "סוג",
    "filter-gender": "מין",
    "filter-men": "גברים",
    "filter-women": "נשים",
    "product-gender-men": "👔 גברים",
    "product-gender-women": "💎 נשים",
    "filter-travel": "✈️ נסיעות",
    "filter-unisex": "לשני המינים",
    "filter-availability": "זמינות",
    "filter-in-stock": "במלאי",
    "filter-limited": "מוגבל",
    "filter-price": "מחיר",
    "filter-sort-by": "מיון לפי",
    "filter-featured": "מומלץ",
    "filter-price-low": "מחיר: נמוך לגבוה",
    "filter-price-high": "מחיר: גבוה לנמוך",
    "filter-name": "שם א-ת",
    "categories-watches": "שעונים יוקרתיים",
    "watches-description": "גלה את האוסף הנבחר שלנו של שעונים יוקרתיים ממותגי השעונים המפורסמים",
    "categories-bags": "תיקים יוקרתיים",
    "bags-description": "גלה את האוסף הבלעדי שלנו של תיקי יד מעצבים ואביזרי יוקרה",
    "categories-accessories": "אביזרים אלגנטיים",
    "accessories-description": "השלם את המראה שלך עם האוסף המדהים שלנו של תכשיטים ואביזרים",
    "about-title": "אודותינו",
    "about-text": "<span dir=\"ltr\" class=\"brand-name\">J&amp;A Jewelry</span> הוא חנות יוקרתית שמציעה מבחר בשמים מקוריים, שעונים אלגנטיים, תיקים ואביזרי יוקרה לגברים ולנשים. אנו מאמינים שכל פרט קטן עושה הבדל גדול, ולכן אנו מבטיחים שכל פריט באוסף שלנו משדר יוקרה, אלגנטיות ואיכות גבוהה.",
    "contact-title": "צור קשר",
    "contact-address": "כתובת",
    "address-content": "באקה אל-גרביה – רחוב ביר בורין",
    "contact-whatsapp": "טלפון וווטסאפ",
    "contact-social": "רשתות חברתיות",
    "contact-instagram": "אינסטגרם",
    "contact-facebook": "פייסבוק",
    "contact-tiktok": "טיקטוק",
    "footer-quick": "קישורים מהירים",
    "footer-contact": "פרטי התקשרות",
    "footer-tagline": "היעד המועדף שלך לשעונים יוקרתיים, בשמים, תיקים ואביזרים.",
    "footer-copy": "<span class='copyright-text'>© 2025 <span dir=\"ltr\" class=\"brand-name\">J&amp;A Jewelry</span>.</span> כל הזכויות שמורות.",
    "show-all-perfumes": "הצג הכל ",
    "show-all-watches": "הצג הכל ",
    "show-all-bags": "הצג הכל ",
    "show-all-accessories": "הצג הכל",
    "checkout.title": "J&A Jewelry - תשלום",
    "checkout.shipping_title": "פרטי משלוח",
    "checkout.payment_title": "אמצעי תשלום",
    "checkout.review_title": "סקירת הזמנה",
    "checkout.order_summary": "סיכום הזמנה",
    "checkout.first_name": "שם פרטי",
    "checkout.last_name": "שם משפחה",
    "checkout.email": "כתובת אימייל",
    "checkout.phone": "מספר טלפון",
    "checkout.address": "כתובת",
    "checkout.city": "עיר",
    "checkout.postal_code": "מיקוד",
    "checkout.delivery_method": "שיטת משלוח",
    "checkout.pickup_store": "איסוף מהחנות",
    "checkout.store_pickup": "איסוף מהחנות",
    "checkout.home_delivery": "משלוח לבית",
    "checkout.choose_area": "בחר אזור",
    "checkout.select_region": "בחר אזור",
    "checkout.area_local": "באקה / ג'ת / מייסר / זימר (+₪20)",
    "checkout.region_local": "באקה אל-גרביה / ג'ת / מייסר / זימר (+₪20)",
    "checkout.area_other": "צפון או דרום (+₪70)",
    "checkout.region_other": "צפון או דרום (אזורים אחרים) (+₪70)",
    "checkout.pickup_note": "איסוף זמין מחנות <span dir=\"ltr\" class=\"brand-name\">J&amp;A Jewelry</span> בשעות העבודה.",
    "checkout.payment_method_title": "אמצעי תשלום",
    "checkout.payment_cash": "מזומן (במסירה)",
    "checkout.payment_credit": "כרטיס אשראי",
    "checkout.payment_apple": "Apple Pay",
    "checkout.payment_bit": "Bit",
    "checkout.place_order": "אשר הזמנה",
    "checkout.processing": "מעבד את ההזמנה שלך...",
    "checkout.subtotal": "סכום ביניים",
    "checkout.shipping": "משלוח",
    "checkout.discount": "הנחה",
    "checkout.total": "סה\"כ",
    "checkout.total_final": "סה\"כ סופי",
    "checkout.auth_title": "התחבר או המשך כאורח",
    "checkout.google_signin": "התחבר עם Google",
    "checkout.email_signin": "התחבר עם אימייל",
    "checkout.guest_checkout": "המשך כאורח",
    "checkout.credit_card": "כרטיס אשראי",
    "checkout.secure_payment": "תשלום מאובטח",
    "checkout.credit.title": "כרטיס אשראי",
    "checkout.credit.note": "קישור לתשלום יישלח אליך בוואטסאפ",
    "checkout.paypal_desc": "תשלום דרך PayPal",
    "checkout.cash_delivery": "תשלום במסירה",
    "checkout.cash_desc": "תשלום מזומן במסירה",
    "checkout.notes": "הערות נוספות (אופציונלי)",
    "checkout.discount_code": "קוד הנחה (אופציונלי)",
    "checkout.delivery": "משלוח",
    "checkout.delivery_desc": "אנו מספקים לכתובת שלך",
    "checkout.pickup": "איסוף מהחנות",
    "checkout.pickup_desc": "אסוף מהחנות שלנו",
    "checkout.delivery_area": "בחר את האזור שלך",
    "checkout.street": "רחוב",
    "checkout.house_number": "מספר בית",
    "checkout.cash": "מזומן",
    "checkout.paypal": "PayPal",
    "checkout.bit": "Bit",
    "checkout.select_area": "-- בחר אזור --",
    "checkout.area_baqa": "באקה אל-גרביה (₪25)",
    "checkout.area_jatt": "ג'ת (₪25)",
    "checkout.area_meiser": "מייסר (₪25)",
    "checkout.coupon.title": "קוד קופון",
    "checkout.coupon.placeholder": "הזן קוד קופון",
    "checkout.coupon.apply": "החל",
    "checkout.coupon.error": "שגיאה בהחלת הקופון. אנא נסה שוב",
    "checkout.coupon.empty": "אנא הזן קוד קופון",
    "products.add_to_cart": "הוסף לעגלה",
    "product.materials.gold_filled": "זהב מלא",
    "product.materials.silver": "כסף",
    "product.colors.gold": "זהב",
    "product.colors.silver": "כסף",
    "product.types.bracelet": "צמיד",
    "product.types.ring": "טבעת",
    "product.types.set": "סט",
    "product.types.necklace": "שרשרת",
    "sale": "מבצע"
  },
  en: {
    "admin.dashboard": "Admin Dashboard",
    "admin.statistics": "Statistics",
    "admin.all_products": "All Products",
    "admin.bulk_upload": "Bulk Upload",
    "admin.add_product": "Add New Product",
    "admin.json_label": "Upload JSON File",
    "admin.upload_json": "Upload JSON",
    "admin.form.name": "Name",
    "admin.form.category": "Product Type",
    "admin.form.gender": "Gender",
    "admin.form.price_before": "Price Before",
    "admin.form.price_after": "Price After",
    "admin.form.image_url": "Image URL",
    "admin.table.name": "Name",
    "admin.table.category": "Category",
    "admin.table.gender": "Gender",
    "admin.table.price_before": "Price Before",
    "admin.table.price_after": "Price After",
    "admin.table.image": "Image",
    "admin.table.document_id": "Document ID",
    "admin.table.actions": "Actions",
    "admin.action.add_product": "Add Product",
    "admin.action.save_changes": "Save Changes",
    "brand-main": "<span dir=\"ltr\" class=\"brand-name\">J&amp;A Jewelry</span>",
    "brand-sub": "Where elegance meets luxury",
    "brand-slogan": "Luxury that defines you.",
    "nav-home": "Home",
    "nav-perfumes": "Perfumes",
    "nav-watches": "Watches",
    "nav-bags": "Bags",
    "nav-accessories": "Accessories",
    "nav-products": "Products",
    "nav-cart": "Cart",
    "nav-about": "About",
    "nav-contact": "Contact",
    "btn-shop": "Shop Now",
    "btn-show-all": "Show All",
    "btn-add-to-cart": "Add to Cart",
    "cart.title": "Shopping Cart",
    "cart.subtitle": "Review your selected items",
    "cart.items": "Cart Items",
    "cart.order_summary": "Order Summary",
    "cart.subtotal": "Subtotal",
    "cart.shipping": "Shipping",
    "cart.total": "Total",
    "cart.checkout": "Checkout",
    "cart.continue_shopping": "Continue Shopping",
    "cart.empty": "Your cart is empty",
    "cart.empty_title": "Your cart is empty",
    "cart.empty_message": "Looks like you haven't added any items to your cart yet.",
    "cart.start_shopping": "Start Shopping",
    "navigation.home": "Home",
    "navigation.perfumes": "Perfumes",
    "navigation.watches": "Watches",
    "navigation.bags": "Bags",
    "navigation.accessories": "Accessories",
    "navigation.about": "About",
    "navigation.contact": "Contact",
    "navigation.products": "Products",
    "navigation.cart": "Cart",
    "navigation.login": "Login",
    "navigation.logout": "Logout",
    "auth.logout": "Logout",
    "greeting.hello": "Hello",
    "login.email": "Email Address",
    "login.password": "Password",
    "login.login_button": "Login",
    "login.google_login": "Login with Google",
    "login.create_account": "Create New Account",
    "login-title": "Login",
    "login-welcome": "Welcome to <span dir=\"ltr\" class=\"brand-name\">J&A Jewelry</span>",
    "login-email": "Email",
    "login-password": "Password",
    "login-button": "Login",
    "login-or": "or",
    "login-google": "Login with Google",
    "login-slogan-title": "Where elegance meets luxury",
    "login-slogan-subtitle": "Luxury that defines you",
    "login-no-account": "Don't have an account?",
    "login-create-account": "Create an account",
    "footer.description": "Your premier destination for luxury watches, perfumes, bags, and accessories.",
    "footer.quick_links": "Quick Links",
    "footer.contact": "Contact Info",
    "footer.rights": "All rights reserved.",
    "categories-perfumes": "Luxury Perfumes",
    "perfumes-description": "Discover our exquisite collection of premium fragrances from the world's most prestigious brands",
    "filter-shop-by": "SHOP BY",
    "filter-view-as": "VIEW AS",
    "filter-brand": "BRAND",
    "filter-category": "CATEGORY",
    "filter-material": "MATERIAL",
    "filter-type": "TYPE",
    "filter-gender": "GENDER",
    "filter-men": "Men",
    "filter-women": "Women",
    "product-gender-men": "👔 Men",
    "product-gender-women": "💎 Women",
    "filter-travel": "✈️ Travel",
    "filter-unisex": "Unisex",
    "filter-availability": "AVAILABILITY",
    "filter-in-stock": "In Stock",
    "filter-limited": "Limited",
    "filter-price": "PRICE",
    "filter-sort-by": "SORT BY",
    "filter-featured": "Featured",
    "filter-price-low": "Price: Low to High",
    "filter-price-high": "Price: High to Low",
    "filter-name": "Name A-Z",
    "categories-watches": "Luxury Watches",
    "watches-description": "Explore our curated collection of premium timepieces from renowned watchmakers",
    "categories-bags": "Luxury Bags",
    "bags-description": "Discover our exclusive collection of designer handbags and luxury accessories",
    "categories-accessories": "Elegant Accessories",
    "accessories-description": "Complete your look with our stunning collection of jewelry and accessories",
    "about-title": "About Us",
    "about-text": "<span dir=\"ltr\" class=\"brand-name\">J&amp;A Jewelry</span> is a luxury store that offers a carefully selected collection of original perfumes, elegant watches, stylish accessories and luxury bags for men and women. We believe that every small detail makes a big difference, so we ensure that every piece in our collection reflects luxury, elegance and high quality.",
    "contact-title": "Contact Us",
    "contact-address": "Address",
    "address-content": "Baqa Al-Gharbiyye – Bir Borin Street",
    "contact-whatsapp": "Phone & WhatsApp",
    "contact-social": "Social Media",
    "contact-instagram": "Instagram",
    "contact-facebook": "Facebook",
    "contact-tiktok": "TikTok",
    "footer-quick": "Quick Links",
    "footer-contact": "Contact Info",
    "footer-tagline": "Your preferred destination for luxury watches, perfumes, bags, and accessories.",
    "footer-copy": "<span class='copyright-text'>© 2025 <span dir=\"ltr\" class=\"brand-name\">J&amp;A Jewelry</span>.</span> All rights reserved.",
    "show-all-perfumes": "Show all ",
    "show-all-watches": "Show all ",
    "show-all-bags": "Show all ",
    "show-all-accessories": "Show all",
    "checkout.title": "J&A Jewelry - Checkout",
    "checkout.shipping_title": "Shipping Information",
    "checkout.payment_title": "Payment Method",
    "checkout.review_title": "Order Review",
    "checkout.order_summary": "Order Summary",
    "checkout.first_name": "First Name",
    "checkout.last_name": "Last Name",
    "checkout.email": "Email Address",
    "checkout.phone": "Phone Number",
    "checkout.address": "Address",
    "checkout.city": "City",
    "checkout.postal_code": "Postal Code",
    "checkout.delivery_method": "Delivery Method",
    "checkout.pickup_store": "Pickup from Store",
    "checkout.store_pickup": "Store Pickup",
    "checkout.home_delivery": "Home Delivery",
    "checkout.choose_area": "Choose Area",
    "checkout.select_region": "Select Region",
    "checkout.area_local": "Baqa / Jatt / Meiser / Zemer (+₪20)",
    "checkout.region_local": "Baqa al-Gharbiya / Jatt / Meiser / Zemer (+₪20)",
    "checkout.area_other": "North or South (+₪70)",
    "checkout.region_other": "North & South (Other Areas) (+₪70)",
    "checkout.pickup_note": "Pickup available from <span dir=\"ltr\" class=\"brand-name\">J&amp;A Jewelry</span> store during working hours.",
    "checkout.payment_method_title": "Payment Method",
    "checkout.payment_cash": "Cash (on delivery)",
    "checkout.payment_credit": "Credit Card",
    "checkout.payment_apple": "Apple Pay",
    "checkout.payment_bit": "Bit",
    "checkout.place_order": "Place Order",
    "checkout.processing": "Processing your order...",
    "checkout.subtotal": "Subtotal",
    "checkout.shipping": "Shipping",
    "checkout.discount": "Discount",
    "checkout.total": "Total",
    "checkout.total_final": "Final Total",
    "checkout.auth_title": "Login or Continue as Guest",
    "checkout.google_signin": "Sign in with Google",
    "checkout.email_signin": "Sign in with Email",
    "checkout.guest_checkout": "Continue as Guest",
    "checkout.credit_card": "Credit Card",
    "checkout.secure_payment": "Secure Payment",
    "checkout.credit.title": "Credit Card",
    "checkout.credit.note": "Payment link will be sent via WhatsApp",
    "checkout.paypal_desc": "Pay via PayPal",
    "checkout.cash_delivery": "Cash on Delivery",
    "checkout.cash_desc": "Cash payment on delivery",
    "checkout.notes": "Additional Notes (Optional)",
    "checkout.discount_code": "Discount Code (Optional)",
    "checkout.delivery": "Delivery",
    "checkout.delivery_desc": "We deliver to your address",
    "checkout.pickup": "Pickup from Store",
    "checkout.pickup_desc": "Collect from our store",
    "checkout.delivery_area": "Choose your area",
    "checkout.street": "Street",
    "checkout.house_number": "House Number",
    "checkout.cash": "Cash",
    "checkout.paypal": "PayPal",
    "checkout.bit": "Bit",
    "checkout.select_area": "-- Select Area --",
    "checkout.area_baqa": "Baqa al-Gharbiyye (₪25)",
    "checkout.area_jatt": "Jatt (₪25)",
    "checkout.area_meiser": "Meiser (₪25)",
    "checkout.coupon.title": "Coupon Code",
    "checkout.coupon.placeholder": "Enter coupon code",
    "checkout.coupon.apply": "Apply",
    "checkout.coupon.error": "Error applying coupon. Please try again.",
    "checkout.coupon.empty": "Please enter a coupon code",
    "products.add_to_cart": "Add to Cart",
    "product.materials.gold_filled": "Gold Filled",
    "product.materials.silver": "Silver",
    "product.colors.gold": "Gold",
    "product.colors.silver": "Silver",
    "product.types.bracelet": "Bracelet",
    "product.types.ring": "Ring",
    "product.types.set": "Set",
    "product.types.necklace": "Necklace",
    "sale": "SALE"
  }
};

// Global variables
let currentLanguage = 'ar';
// cartItems is now managed in cart.js - removed from here to avoid duplicate declaration
let currentSlide = 0;
let carouselInterval;

// API Configuration
const API_BASE_URL = 'http://127.0.0.1:8081';

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Guard: Prevent duplicate app initialization
    if (window.__appInitialized) {
        console.log('🛈 App already initialized, skipping');
        return;
    }
    if (window && window.SKIP_APP_INIT) {
        console.log('🛈 App initialization skipped on this page');
        return;
    }
    window.__appInitialized = true;
    initializeApp();
});

// Initialize the application
function initializeApp() {
    try {
        // Set initial language and direction
        document.documentElement.dir = 'rtl';
        document.documentElement.lang = 'ar';
        
        // Initialize components
        initializeHeader();
        initializeCarousel();
        initializeScrollAnimations();
        initializeCart();
        
        // Initialize language system - check multiple localStorage keys for compatibility
        const savedLang = localStorage.getItem("preferred_lang") || 
                          localStorage.getItem("language") || 
                          (navigator.language && navigator.language.startsWith('ar') ? 'ar' : 
                           navigator.language && navigator.language.startsWith('he') ? 'he' : 'en');
        switchLanguage(savedLang);
        localStorage.setItem("preferred_lang", savedLang);
        localStorage.setItem("language", savedLang);

        // Language toggle button - cycle through ar -> he -> en -> ar
        const langToggle = document.getElementById("lang-toggle");
        if (langToggle) {
          // Remove any existing listeners to prevent duplicates
          const newLangToggle = langToggle.cloneNode(true);
          langToggle.parentNode.replaceChild(newLangToggle, langToggle);
          
          newLangToggle.addEventListener("click", () => {
            // Cycle through languages: ar -> he -> en -> ar
            let newLang;
            if (currentLanguage === "ar") {
              newLang = "he";
            } else if (currentLanguage === "he") {
              newLang = "en";
            } else {
              newLang = "ar";
            }
            switchLanguage(newLang);
            translatePage();
          });
        }
        
        console.log('J&A Jewelry app initialized successfully');
        
        // Ensure mobile menu exists on all pages
        // Note: initializeApp() is already called from DOMContentLoaded, so we can access DOM directly
        const menu = document.getElementById("mobile-menu");
        const overlay = document.getElementById("mobile-menu-overlay");
        const menuToggleBtn = document.querySelector(".menu-toggle");

        if (!menu || !overlay || !menuToggleBtn) {
            console.warn("❌ Mobile menu elements NOT found on this page.");
        } else {
            console.log("✅ Mobile menu elements detected");
            // Use window.toggleMobileMenu to ensure it's globally available
            // Only add event listener to button if it doesn't already have onclick (to prevent double-firing)
            if (!menuToggleBtn.getAttribute("onclick")) {
                menuToggleBtn.addEventListener("click", window.toggleMobileMenu);
            }
            overlay.addEventListener("click", window.toggleMobileMenu);
        }
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
}

// === Language System ===
function loadTranslations(lang) {
  return translations[lang] || translations.en;
}

/**
 * Global getProductName function - SINGLE SOURCE OF TRUTH
 * Returns product name in the current language
 * Supports: name_ar, name_en, name_he (separate fields)
 * Also supports legacy: name as object {ar, en, he} or string
 */
window.getProductName = function getProductName(product, lang = null) {
  if (!product) {
    return "Unknown Product";
  }
  
  // Get current language from localStorage or document
  const currentLang = lang || 
    localStorage.getItem("language") || 
    localStorage.getItem("preferred_lang") || 
    document.documentElement.lang || 
    'ar';
  const langCode = currentLang.split('-')[0];
  
  // Priority 1: Check separate fields (name_ar, name_en, name_he)
  if (langCode === 'ar' && product.name_ar) {
    return product.name_ar;
  }
  if (langCode === 'en' && product.name_en) {
    return product.name_en;
  }
  if (langCode === 'he' && product.name_he) {
    return product.name_he;
  }
  
  // Priority 2: If name is an object with language keys
  if (product.name && typeof product.name === 'object' && product.name !== null) {
    // Try current language first
    if (product.name[langCode]) {
      return product.name[langCode];
    }
    
    // Fallback to Arabic
    if (product.name.ar) {
      return product.name.ar;
    }
    
    // Fallback to English
    if (product.name.en) {
      return product.name.en;
    }
    
    // Fallback to any available language
    const availableLang = Object.keys(product.name)[0];
    if (availableLang) {
      return product.name[availableLang];
    }
  }
  
  // Priority 3: Fallback to separate fields in order: Arabic -> English -> Hebrew
  if (product.name_ar) {
    return product.name_ar;
  }
  if (product.name_en) {
    return product.name_en;
  }
  if (product.name_he) {
    return product.name_he;
  }
  
  // Priority 4: Backward compatibility - if name is a string, return it
  if (product.name && typeof product.name === 'string') {
    return product.name;
  }
  
  return "Unknown Product";
};

function getTranslation(key) {
    if (!translations[currentLanguage]) {
        console.warn(`No translations loaded for language: ${currentLanguage}`);
        return key;
    }
    
    const langTranslations = translations[currentLanguage];
    
    // First, try to find it as a flat key (e.g., "login.email")
    if (langTranslations.hasOwnProperty(key)) {
        return langTranslations[key] || key;
    }
    
    // If not found as flat key, try nested navigation (e.g., login.email -> login: { email: "value" })
    const keys = key.split('.');
    let value = langTranslations;
    
    for (const k of keys) {
        if (value && typeof value === 'object' && value.hasOwnProperty(k)) {
            value = value[k];
        } else {
            // Key not found - return the key itself
            console.warn(`Translation key not found: ${key} in language: ${currentLanguage}`);
            return key;
        }
    }
    
    return value || key;
}

function translatePage() {
    console.log('🌐 translatePage called, currentLanguage:', currentLanguage);
    
    // First, handle all elements with data-translate (text content)
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        const translation = getTranslation(key);
        
        if (translation && translation !== key) {
            // For input/textarea/select elements, only update value if they have data-translate-value
            if ((element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') 
                && element.hasAttribute('data-translate-value')) {
                element.value = translation;
            }
            // For option elements inside select
            else if (element.tagName === 'OPTION') {
                element.textContent = translation;
            }
            // For labels, buttons, links, and other text elements
            else if (element.tagName === 'LABEL' || element.tagName === 'BUTTON' || element.tagName === 'A' || element.tagName === 'SPAN' || element.tagName === 'H1' || element.tagName === 'H2' || element.tagName === 'H3' || element.tagName === 'H4' || element.tagName === 'H5' || element.tagName === 'H6' || element.tagName === 'P' || element.tagName === 'DIV') {
                // Use innerHTML for HTML content, textContent for plain text
                if (typeof translation === 'string' && (translation.includes('<span') || translation.includes('<div') || translation.includes('<p'))) {
                    element.innerHTML = translation;
                } else {
                    element.textContent = translation;
                }
            }
            // Default: use textContent
            else {
                element.textContent = translation;
            }
        }
    });
    
    // Second, handle all elements with data-translate-placeholder (placeholder text)
    const placeholderElements = document.querySelectorAll('[data-translate-placeholder]');
    console.log('Found', placeholderElements.length, 'elements with data-translate-placeholder');
    
    placeholderElements.forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        const translation = getTranslation(key);
        console.log('Translating placeholder key:', key, 'element:', element.id || element.tagName, 'to:', translation);
        
        if (translation && translation !== key) {
            element.placeholder = translation;
            console.log('Updated placeholder for', element.id || element.tagName, 'to:', translation);
        }
    });
    
    // Release translation lock
    setTimeout(() => {
      window.__isTranslating = false;
    }, 100);
    
    // Update footer location translation
    const footerLocation = document.getElementById("footer-location");
    if (footerLocation) {
        const locationTranslation = getTranslation("footer.location");
        if (locationTranslation && locationTranslation !== "footer.location") {
            footerLocation.textContent = locationTranslation;
        }
    }
    
    // Also explicitly target login form elements with new IDs
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    if (loginEmailInput && loginEmailInput.hasAttribute('data-translate-placeholder')) {
        const emailPlaceholder = getTranslation('login.email');
        if (emailPlaceholder) {
            loginEmailInput.placeholder = emailPlaceholder;
            console.log('Force updated email placeholder to:', emailPlaceholder);
        }
    }
    if (loginPasswordInput && loginPasswordInput.hasAttribute('data-translate-placeholder')) {
        const passwordPlaceholder = getTranslation('login.password');
        if (passwordPlaceholder) {
            loginPasswordInput.placeholder = passwordPlaceholder;
            console.log('Force updated password placeholder to:', passwordPlaceholder);
        }
    }
}

// This function is now replaced by the one below - keeping for compatibility
// The switchLanguage function below (around line 1001) is the active one

// === Header Functionality ===
function initializeHeader() {
    const header = document.querySelector('.header');
    const loginBtn = document.querySelector('.login-btn');
    
    // Header scroll effect - only if header exists
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
    
    // Cart icon is already a link to cart.html in the header, no need for event listener
    
    // Login button click
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const token = localStorage.getItem('jwt_token');
            if (token) {
                // User is logged in, redirect to admin
                console.warn("🔴 NAVIGATION TRIGGERED: window.location.href = 'admin.html'", new Error().stack);
                window.location.href = 'admin.html';
            } else {
                // Show login form or redirect to login page
                showLoginForm();
            }
        });
    }
    
    // DO NOT call updateCartBadge() here - it will be called by onAuthStateChanged
    // This prevents race conditions where badge updates before auth is ready
    console.log('✅ Header initialized - badge will update when auth state is known');
}

// === Navigation ===
function showPage(pageId, event) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Update navigation buttons
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// === Carousel Functionality ===
function initializeCarousel() {
    const track = document.querySelector('.carousel-track');
    const slides = document.querySelectorAll('.carousel-slide');
    const prevBtn = document.querySelector('.carousel-nav.prev');
    const nextBtn = document.querySelector('.carousel-nav.next');
    const dots = document.querySelectorAll('.carousel-dot');
    
    if (!track || slides.length === 0) return;
    
    // Set up navigation
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            updateCarousel();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentSlide = (currentSlide + 1) % slides.length;
            updateCarousel();
        });
    }
    
    // Set up dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            updateCarousel();
        });
    });
    
    // Auto-play
    startCarouselAutoPlay();
    
    // Pause on hover
    const carousel = document.querySelector('.carousel-container');
    if (carousel) {
        carousel.addEventListener('mouseenter', stopCarouselAutoPlay);
        carousel.addEventListener('mouseleave', startCarouselAutoPlay);
    }
}

function updateCarousel() {
    const track = document.querySelector('.carousel-track');
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');
    
    if (!track) return;
    
    // Update track position
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    // Update dots
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

function startCarouselAutoPlay() {
    stopCarouselAutoPlay(); // Clear any existing interval
    carouselInterval = setInterval(() => {
        const slides = document.querySelectorAll('.carousel-slide');
        currentSlide = (currentSlide + 1) % slides.length;
        updateCarousel();
    }, 5000);
}

function stopCarouselAutoPlay() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
    }
}

// === Scroll Animations ===
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // Observe elements with animation classes
    document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right').forEach(el => {
        observer.observe(el);
    });
}

// === Cart Functionality ===
// NOTE: Cart is now stored ONLY in Firestore for logged-in users
// Guest users cannot add items to cart - login is required
function initializeCart() {
    // Cart is now managed entirely through Firestore
    // No localStorage cart storage allowed
    console.log('✅ Cart system initialized - Firestore only (login required)');
}

// OLD updateCartBadge removed - now using async version that checks auth state
// This ensures cart badge uses Firestore for logged-in users and localStorage for guests


function proceedToCheckout() {
    // Redirect to cart page or checkout
    console.warn("🔴 NAVIGATION TRIGGERED: window.location.href = 'cart.html'", new Error().stack);
    window.location.href = 'cart.html';
}

// === Product Management ===
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/client/products/`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const products = await response.json();
        return products;
    } catch (error) {
        console.error('Failed to load products:', error);
        return [];
    }
}

async function addProduct(productData) {
    try {
        const token = localStorage.getItem('jwt_token');
        const response = await fetch(`${API_BASE_URL}/admin/products/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        showNotification('Product added successfully!');
        return result;
    } catch (error) {
        console.error('Failed to add product:', error);
        showNotification('Failed to add product', 'error');
        throw error;
    }
}

// === Authentication ===
async function login(username, password) {
    try {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.token) {
            localStorage.setItem('jwt_token', data.token);
            if (data.role) {
                localStorage.setItem('jwt_role', data.role);
            }
            
            showNotification('Login successful!');
            
            // Redirect based on role
            if (data.role === 'admin') {
                console.warn("🔴 NAVIGATION TRIGGERED: window.location.href = 'admin.html' (admin role)", new Error().stack);
                window.location.href = 'admin.html';
            } else if (data.role === 'client') {
                console.warn("🔴 NAVIGATION TRIGGERED: window.location.href = 'client.html' (client role)", new Error().stack);
                window.location.href = 'client.html';
            }
            
            return data;
        } else {
            throw new Error('No token received');
        }
    } catch (error) {
        console.error('Login failed:', error);
        showNotification('Login failed. Please check your credentials.', 'error');
        throw error;
    }
}

// REMOVED: Fake logout function - use window.logout from userMenu.js instead
// The real logout function is signOut() in auth_frontend.js which:
// - Signs out from Firebase
// - Clears all localStorage items
// - Clears sessionStorage
// - Updates UI state
// - Verifies logout succeeded
// - Redirects after logout is complete
// window.logout in userMenu.js calls the real logout function

function isAuthenticated() {
    return !!localStorage.getItem('jwt_token');
}

function getAuthToken() {
    return localStorage.getItem('jwt_token');
}

function getUserRole() {
    return localStorage.getItem('jwt_role');
}

// === Notifications ===
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ff4444' : '#4CAF50'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// === Utility Functions ===
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// === Image Loading ===
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// === Form Handling ===
function handleFormSubmit(form, callback) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        // Show loading state
        submitBtn.textContent = 'Loading...';
        submitBtn.disabled = true;
        
        try {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            await callback(data);
        } catch (error) {
            console.error('Form submission error:', error);
        } finally {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// === Mobile Menu ===
function toggleMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  const overlay = document.getElementById("mobile-menu-overlay");

  if (!menu || !overlay) return;

  menu.classList.toggle("open");
  overlay.classList.toggle("active");
}

window.toggleMobileMenu = toggleMobileMenu;

// === User Menu ===
function toggleUserMenu() {
  const menu = document.getElementById("user-menu");
  if (!menu) return;

  menu.classList.toggle("open");
}

window.toggleUserMenu = toggleUserMenu;

// === Search Functionality ===
function initializeSearch() {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        const debouncedSearch = debounce((query) => {
            performSearch(query);
        }, 300);
        
        searchInput.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });
    }
}

function performSearch(query) {
    // Implement search functionality
    console.log('Searching for:', query);
}

// === Export functions for global access ===
// Note: addToCart, removeFromCart, updateCartQuantity are defined later
// We'll create JAJewelry object after those functions are defined

// Function to update header icon titles based on language
function updateHeaderIconTitles(lang) {
  const langCode = lang.split('-')[0];
  const iconLinks = document.querySelectorAll('.header-icons .icon[data-en-title]');
  
  iconLinks.forEach(icon => {
    const titleAttr = `data-${langCode}-title`;
    const title = icon.getAttribute(titleAttr);
    if (title) {
      icon.setAttribute('title', title);
      icon.setAttribute('aria-label', title);
    }
  });
}

// Cycle through languages: ar -> he -> en -> ar
function cycleLanguage() {
    const langCycle = ['ar', 'he', 'en'];
    const currentIndex = langCycle.indexOf(currentLanguage);
    const nextIndex = (currentIndex + 1) % langCycle.length;
    const nextLang = langCycle[nextIndex];
    switchLanguage(nextLang);
}

// Make key functions available globally
window.switchLanguage = switchLanguage;
window.translatePage = translatePage;
window.reorderNavigation = reorderNavigation;
window.getTranslation = getTranslation;
window.cycleLanguage = cycleLanguage;

// === Multilanguage System ===
// Translations are now embedded directly in the JavaScript file

// Removed duplicate translatePage function - using the one above with debugging

function switchLanguage(lang) {
  // Guard: Prevent rapid repeated language switches
  if (window.__isSwitchingLanguage) {
    console.log('🌐 Language switch already in progress, skipping');
    return;
  }
  window.__isSwitchingLanguage = true;
  
  console.log('🌐 switchLanguage called with:', lang);
  currentLanguage = lang;

  // Save to localStorage for persistence
  localStorage.setItem("preferred_lang", lang);
  localStorage.setItem("language", lang);

  // تحديد الاتجاه حسب اللغة
  const dir = (lang === "ar" || lang === "he") ? "rtl" : "ltr";
  document.documentElement.lang = lang;
  document.documentElement.dir = dir;
  
  // Apply RTL/LTR styles to body as well
  if (document.body) {
    document.body.setAttribute('dir', dir);
    document.body.style.direction = dir;
  }
  
  // Remove RTL styles when switching to LTR (English)
  if (dir === "ltr") {
    // Remove inline direction: rtl from elements (except those explicitly marked to keep RTL)
    document.querySelectorAll('*').forEach(el => {
      // Skip elements that should remain RTL (like Arabic/Hebrew content)
      if (el.hasAttribute('data-keep-rtl') || el.classList.contains('rtl-content') || 
          (el.hasAttribute('lang') && ['ar', 'he'].includes(el.getAttribute('lang')))) {
        return;
      }
      
      // Remove inline direction: rtl
      if (el.style.direction === 'rtl') {
        el.style.direction = '';
      }
      
      // Remove inline text-align: right for most elements (except brand-main which should stay right)
      if (el.style.textAlign === 'right' && !el.classList.contains('brand-main') && !el.classList.contains('brand-name')) {
        el.style.textAlign = '';
      }
      
      // Remove dir="rtl" attribute from elements (except those explicitly marked)
      if (el.getAttribute('dir') === 'rtl' && !el.hasAttribute('data-keep-rtl')) {
        el.removeAttribute('dir');
      }
    });
    
    // Add a global style to override any CSS rules that force RTL when document is LTR
    let ltrOverrideStyle = document.getElementById('ltr-override-style');
    if (!ltrOverrideStyle) {
      ltrOverrideStyle = document.createElement('style');
      ltrOverrideStyle.id = 'ltr-override-style';
      document.head.appendChild(ltrOverrideStyle);
    }
    ltrOverrideStyle.textContent = `
      /* Force LTR direction when document is LTR, except explicitly marked RTL elements */
      html[dir="ltr"] body *:not([data-keep-rtl]):not(.rtl-content):not(.brand-main):not(.brand-name):not([lang="ar"]):not([lang="he"]) {
        direction: ltr !important;
      }
      html[dir="ltr"] [dir="rtl"]:not([data-keep-rtl]):not(.rtl-content):not([lang="ar"]):not([lang="he"]) {
        direction: ltr !important;
      }
      /* Reset text alignment for LTR - only for elements that don't have explicit alignment */
      html[dir="ltr"] body *:not([data-keep-rtl]):not(.rtl-content):not(.brand-main):not(.brand-name):not([lang="ar"]):not([lang="he"]):not([style*="text-align"]) {
        text-align: left !important;
      }
      /* Override any inline text-align: right when in LTR mode */
      html[dir="ltr"] [style*="text-align: right"]:not(.brand-main):not(.brand-name):not([data-keep-rtl]) {
        text-align: left !important;
      }
    `;
  } else {
    // Remove LTR override style when switching to RTL
    const ltrOverrideStyle = document.getElementById('ltr-override-style');
    if (ltrOverrideStyle) {
      ltrOverrideStyle.remove();
    }
    
    // Ensure RTL is applied properly - CSS [dir="rtl"] selectors will handle it
    // Just make sure elements that should be LTR (like brand names) stay LTR
    document.querySelectorAll('.brand-main, .brand-name, [data-keep-ltr], .ltr-content').forEach(el => {
      el.style.direction = 'ltr';
      if (el.classList.contains('brand-main')) {
        el.style.textAlign = 'right'; // Brand main should be right-aligned even in RTL
      }
    });
  }

  // Update language toggle buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const langBtn = document.querySelector(`[data-lang="${lang}"]`);
  if (langBtn) {
    langBtn.classList.add('active');
  }

  // ✅ Update page text - call translatePage() to update all elements including login form
  translatePage();
  
    // ✅ Update welcome message if user is logged in
    if (typeof window.checkLoginState === 'function') {
      window.checkLoginState();
    }
    
    // Also call global welcome function if available
    if (typeof window.displayWelcomeMessage === 'function') {
      window.displayWelcomeMessage();
    }
  
  // ✅ Update gender labels in product cards (from shop.js)
  if (window.updateGenderLabels && typeof window.updateGenderLabels === 'function') {
    window.updateGenderLabels();
  }
  
  // Update type labels on bag product cards
  if (window.updateTypeLabels && typeof window.updateTypeLabels === 'function') {
    window.updateTypeLabels();
  }
  
  // ✅ Update product details on accessories page (from accessories.html)
  if (window.updateAccessoriesProductDetails && typeof window.updateAccessoriesProductDetails === 'function') {
    window.updateAccessoriesProductDetails();
  }
  
  // ✅ Update filter translations on accessories page (from accessories.html)
  if (window.updateAccessoriesFilterTranslations && typeof window.updateAccessoriesFilterTranslations === 'function') {
    window.updateAccessoriesFilterTranslations();
  }
  
  // ✅ Update product card translations (buttons, labels) on accessories page
  if (window.updateProductCardTranslations && typeof window.updateProductCardTranslations === 'function') {
    window.updateProductCardTranslations();
  }
  
  // ✅ Update product names on perfumes page
  if (window.updatePerfumeNames && typeof window.updatePerfumeNames === 'function') {
    window.updatePerfumeNames();
  }
  
  // ✅ Update product names on bags page
  if (window.updateBagNames && typeof window.updateBagNames === 'function') {
    window.updateBagNames();
  }
  
  // ✅ Update product names on watches page
  if (window.updateWatchNames && typeof window.updateWatchNames === 'function') {
    window.updateWatchNames();
  }
  
  // ✅ Update product names on homepage (shop.js)
  if (window.updateHomepageProductNames && typeof window.updateHomepageProductNames === 'function') {
    window.updateHomepageProductNames();
  }
  
  // ✅ Update filter dropdowns on watches page (from watches.js)
  if (window.translateFilterDropdowns && typeof window.translateFilterDropdowns === 'function') {
    window.translateFilterDropdowns();
  }
  
  // ✅ Re-render cart on language change
  if (window.renderCart && typeof window.renderCart === 'function') {
    window.renderCart();
  }
  
  // ✅ Re-render favorites on language change
  if (window.renderFavorites && typeof window.renderFavorites === 'function') {
    window.renderFavorites();
  }
  
  // ✅ Re-render checkout order summary on language change
  if (window.renderOrderSummary && typeof window.renderOrderSummary === 'function') {
    window.renderOrderSummary();
  }
  
  // ✅ Update header icon titles (multilingual)
  updateHeaderIconTitles(lang);
  
  // ✅ Update signup page if we're on signup.html
  if (window.translateSignupPage) {
    window.translateSignupPage();
    if (window.updatePageDirection) {
      window.updatePageDirection();
    }
  }
  
  // ✅ Update greeting for logged-in user if applicable
  // Import and call updateGreetingForCurrentUser from auth_frontend.js
  import('./assets/js/auth_frontend.js').then(module => {
    if (module.updateGreetingForCurrentUser) {
      module.updateGreetingForCurrentUser();
    }
  }).catch(err => {
    // Module might not be loaded yet, that's okay
    console.log('Auth module not available for greeting update');
  });
  
  // ✅ Reorder navigation based on language
  console.log('Attempting to reorder navigation for language:', lang);
  setTimeout(() => {
    if (typeof reorderNavigation === 'function') {
      console.log('reorderNavigation function exists, calling it');
      reorderNavigation(lang);
    } else {
      console.log('reorderNavigation function not found');
    }
    // Call translatePage again after a short delay to ensure all elements are updated
    translatePage();
    
    // Update signup page if we're on signup.html
    if (window.translateSignupPage) {
      window.translateSignupPage();
      if (window.updatePageDirection) {
        window.updatePageDirection();
      }
    }
    
    // Also update greeting after navigation reordering
    import('./assets/js/auth_frontend.js').then(module => {
      if (module.updateGreetingForCurrentUser) {
        module.updateGreetingForCurrentUser();
      }
    }).catch(err => {
      // Module might not be loaded yet, that's okay
    });
  }, 100);
  
  // Release lock after language switch completes
  setTimeout(() => {
    window.__isSwitchingLanguage = false;
  }, 300);
  
  console.log(`✅ Language switched to: ${lang}`);

    // تحديث زر اللغة - Check for both main page and cart page language buttons
    const langToggle = document.getElementById("lang-toggle");
    const langToggleBtn = document.querySelector('.lang-toggle-btn');
    
    if (langToggle) {
      langToggle.classList.add('active');
    } else if (langToggleBtn) {
      // Update cart page language toggle button
      const currentLangSpan = document.getElementById('current-lang');
      if (currentLangSpan) {
        const langTexts = {
          'ar': 'العربية',
          'he': 'עברית',
          'en': 'English'
        };
        currentLangSpan.textContent = langTexts[lang];
      }
    } else {
      console.warn(`⚠️ No language button found`);
    }

  // تحديث تسمية الزر ديناميكياً - Update all language toggle buttons
  const langLabels = {
    ar: "العربية",
    he: "עברית",
    en: "English"
  };
  
  // Update all language toggle buttons on the page
  document.querySelectorAll('#lang-toggle, .lang-toggle, .lang-btn').forEach(btn => {
    btn.textContent = langLabels[lang] || "Language";
    btn.setAttribute("data-lang", lang);
    btn.classList.remove('active');
    if (btn.getAttribute("data-lang") === lang) {
      btn.classList.add('active');
    }
  });
}

// === Cart Functionality ===
// Global addToCart function - accepts either productId (string) or product (object)
// REQUIRES USER TO BE LOGGED IN - shows login alert for guests
// IMPORTANT: This must be defined BEFORE window.JAJewelry is created
window.addToCart = async function addToCart(productIdOrProduct) {
  try {
    // DEBUG: Log exactly what we receive
    console.log('🔍 DEBUG: addToCart called with:', productIdOrProduct);
    console.log('🔍 DEBUG: typeof:', typeof productIdOrProduct);
    console.log('🔍 DEBUG: isArray:', Array.isArray(productIdOrProduct));
    if (typeof productIdOrProduct === 'object' && productIdOrProduct !== null) {
      console.log('🔍 DEBUG: object keys:', Object.keys(productIdOrProduct));
      console.log('🔍 DEBUG: product.id:', productIdOrProduct.id, 'typeof id:', typeof productIdOrProduct.id);
    }
    
    // Check if user is logged in FIRST
    const authModule = await import('./assets/js/auth_frontend.js');
    const { auth } = authModule;
    const currentUser = auth?.currentUser;
    
    if (!currentUser) {
      // User is not logged in - show login alert
      const loginMessage = 'You must log in first to add items to your cart.';
      if (typeof JAJewelry !== 'undefined' && JAJewelry.showNotification) {
        JAJewelry.showNotification(loginMessage, 'error');
      } else {
        alert(loginMessage);
      }
      console.log('⚠️ Guest user attempted to add to cart - login required');
      return;
    }
    
    // User is logged in - proceed with adding to Firestore
    
    // OPTION A ENFORCEMENT: All buttons MUST pass full product objects
    // String productIds are NO LONGER SUPPORTED - they require collection searching which is unreliable
    // If a string is passed, it's an error in the button implementation
    if (typeof productIdOrProduct === 'string') {
      console.error('❌ DEBUG: addToCart received STRING productId - this is NOT supported!');
      console.error('❌ DEBUG: Buttons must pass full product objects via data-product attribute');
      console.error('❌ DEBUG: Received string:', productIdOrProduct);
      const errorMsg = 'Error: Button implementation issue. Please pass full product object.';
      if (typeof JAJewelry !== 'undefined' && JAJewelry.showNotification) {
        JAJewelry.showNotification(errorMsg, 'error');
      } else {
        alert(errorMsg);
      }
      return;
    }
    
    // Otherwise, it's a product object (OPTION A: All buttons pass full product objects)
    if (typeof productIdOrProduct !== 'object' || productIdOrProduct === null) {
      console.error("❌ DEBUG: addToCart received non-object:", productIdOrProduct, typeof productIdOrProduct);
      const errorMsg = 'Invalid product data. Expected product object.';
      if (typeof JAJewelry !== 'undefined' && JAJewelry.showNotification) {
        JAJewelry.showNotification(errorMsg, 'error');
      } else {
        alert(errorMsg);
      }
      return;
    }
    
    if (!productIdOrProduct.id) {
      console.error("❌ DEBUG: Product object missing id:", productIdOrProduct);
      const errorMsg = 'Invalid product data. Product object must have an id.';
      if (typeof JAJewelry !== 'undefined' && JAJewelry.showNotification) {
        JAJewelry.showNotification(errorMsg, 'error');
      } else {
        alert(errorMsg);
      }
      return;
    }
    
    const product = productIdOrProduct;
    console.log("✅ DEBUG: ADD_TO_CART PASSED VALIDATION - Product object:", product);
    
    // Add to Firestore cart
    if (authModule.addToFirestoreCart) {
      // Ensure product.id is a string for consistent comparison
      const productIdString = String(product.id || '').trim();
      if (!productIdString) {
        throw new Error('Product ID is required');
      }
      
      await authModule.addToFirestoreCart({
        id: productIdString,
        name: product.name || 'Unknown Product',
        price: product.price || product.price_after || product.priceAfter || 0,
        image: product.image || product.image_url || 'assets/images/products/placeholder.jpg',
        category: product.category || ''
      });
      console.log('✅ Product added to Firestore cart');
      
      // Show notification
      if (typeof JAJewelry !== 'undefined' && JAJewelry.showNotification) {
        JAJewelry.showNotification('Added to cart!', 'success');
      } else {
        alert("Added to cart!");
      }
      
      // Update cart badge
      await updateCartBadge();
    } else {
      throw new Error('addToFirestoreCart function not available');
    }
    
  } catch (error) {
    console.error('❌ Error adding product to cart:', error);
    const errorMsg = error.message === 'User must be logged in to add items to cart' 
      ? 'You must log in first to add items to your cart.'
      : 'Error adding product to cart. Please try again.';
    
    if (typeof JAJewelry !== 'undefined' && JAJewelry.showNotification) {
      JAJewelry.showNotification(errorMsg, 'error');
    } else {
      alert(errorMsg);
    }
  }
};

// Function to initialize JAJewelry object after all cart functions are defined
// This must be called AFTER window.addToCart, window.removeFromCart, etc. are defined
function initializeJAJewelryObject() {
  if (typeof window.JAJewelry === 'undefined') {
    window.JAJewelry = {
      switchLanguage,
      translatePage,
      showPage,
      addToCart: window.addToCart, // Now this reference will work because addToCart is already defined
      removeFromCart: window.removeFromCart || function() { console.warn('removeFromCart not available'); },
      updateCartQuantity: window.updateCartQuantity || function() { console.warn('updateCartQuantity not available'); },
      login,
      logout,
      isAuthenticated,
      getAuthToken,
      getUserRole,
      loadProducts,
      addProduct,
      showNotification,
      debounce,
      throttle,
      toggleMobileMenu
    };
    console.log('✅ JAJewelry object initialized with addToCart:', typeof window.JAJewelry.addToCart);
  }
}

// Initialize JAJewelry object after addToCart is defined
initializeJAJewelryObject();

async function updateCartBadge() {
  // Guard: Prevent duplicate cart badge updates
  if (window.__cartBadgeUpdating) {
    console.log('Cart badge update already in progress, skipping');
    return;
  }
  window.__cartBadgeUpdating = true;
  
  // Update all cart badges on the page (including header icons)
  // This function should ONLY be called from onAuthStateChanged callbacks
  // to ensure Firebase auth is fully initialized before checking auth state
  // GUEST USERS: Always show 0 - no localStorage cart allowed
  const badges = document.querySelectorAll('.cart-badge');
  if (badges.length > 0) {
    try {
      let totalItems = 0;
      
      // Import auth module - this should already be initialized if called from onAuthStateChanged
      const authModule = await import('./assets/js/auth_frontend.js');
      const { auth, getFirestoreCart } = authModule;
      
      // Get current user - auth.currentUser is guaranteed to be accurate
      // when this is called from onAuthStateChanged callback
      const currentUser = auth.currentUser;
      
      if (currentUser && getFirestoreCart) {
        // User is logged in - MUST use Firestore cart only
        try {
          const firestoreCartItems = await getFirestoreCart();
          totalItems = firestoreCartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
          console.log('✅ Cart badge updated from Firestore (logged-in user):', totalItems, 'items');
        } catch (error) {
          console.error('❌ Error fetching Firestore cart:', error);
          // If Firestore fails, show 0
          totalItems = 0;
          console.log('⚠️ Firestore cart fetch failed, showing 0 items');
        }
      } else {
        // User is NOT logged in - show 0 (guests cannot have cart)
        totalItems = 0;
        console.log('✅ Cart badge updated: 0 items (guest user - login required)');
      }
      
      // Update all badges
      badges.forEach(badge => {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'block' : 'none';
      });
      
    } catch (error) {
      console.error('❌ Error updating cart badge:', error);
      badges.forEach(badge => {
        badge.textContent = '0';
        badge.style.display = 'none';
      });
    } finally {
      // Release cart badge update lock
      setTimeout(() => {
        window.__cartBadgeUpdating = false;
      }, 200);
    }
  }
}

// Make updateCartBadge available globally for auth state changes
// IMPORTANT: This should ONLY be called from onAuthStateChanged callbacks
window.updateCartBadge = updateCartBadge;

/**
 * Update wishlist badge count from Firestore
 * GUEST USERS: Always show 0 - no localStorage wishlist allowed
 */
async function updateWishlistBadge() {
  const badges = document.querySelectorAll('.wishlist-badge, .favorites-badge');
  if (badges.length > 0) {
    try {
      let totalItems = 0;
      
      const authModule = await import('./assets/js/auth_frontend.js');
      const { auth, getFirestoreWishlist } = authModule;
      
      const currentUser = auth.currentUser;
      
      if (currentUser && getFirestoreWishlist) {
        try {
          const wishlistItems = await getFirestoreWishlist();
          totalItems = wishlistItems.length;
          console.log('✅ Wishlist badge updated from Firestore (logged-in user):', totalItems, 'items');
        } catch (error) {
          console.error('❌ Error fetching Firestore wishlist:', error);
          totalItems = 0;
        }
      } else {
        // Guest user - show 0
        totalItems = 0;
        console.log('✅ Wishlist badge updated: 0 items (guest user - login required)');
      }
      
      badges.forEach(badge => {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'block' : 'none';
      });
    } catch (error) {
      console.error('❌ Error updating wishlist badge:', error);
      badges.forEach(badge => {
        badge.textContent = '0';
        badge.style.display = 'none';
      });
    }
  }
}

// Make updateWishlistBadge available globally
window.updateWishlistBadge = updateWishlistBadge;

// Function to reorder navigation based on language
function reorderNavigation(language) {
    console.log('reorderNavigation called with language:', language);
    
    // Try different navigation selectors
    let nav = document.querySelector('.nav');
    if (!nav) {
        nav = document.querySelector('.nav-links');
    }
    if (!nav) {
        nav = document.querySelector('nav');
    }
    
    if (!nav) {
        console.log('Navigation element not found - trying alternative selectors');
        return;
    }

    const links = Array.from(nav.querySelectorAll('.nav-link, a[data-translate]'));
    console.log('Found links:', links.length);
    
        // Define the order for each language
        const navigationOrder = {
            'ar': ['nav-home', 'nav-perfumes', 'nav-watches', 'nav-bags', 'nav-accessories', 'nav-about', 'nav-contact'],
            'he': ['nav-home', 'nav-perfumes', 'nav-watches', 'nav-bags', 'nav-accessories', 'nav-about', 'nav-contact'],
            'en': ['nav-home', 'nav-perfumes', 'nav-watches', 'nav-bags', 'nav-accessories', 'nav-about', 'nav-contact'] // Keep English unchanged
        };
        
        // For cart page, use simplified order
        const cartPageOrder = {
            'ar': ['nav-home', 'nav-products', 'nav-cart'],
            'he': ['nav-home', 'nav-products', 'nav-cart'],
            'en': ['nav-products', 'nav-cart', 'nav-home']
        };

    const order = links.length === 3 ? cartPageOrder[language] || cartPageOrder['en'] : navigationOrder[language] || navigationOrder['en'];
    console.log('Using order:', order);
    
    // Create a map of links by their data-translate attribute
    const linkMap = {};
    links.forEach(link => {
        const translateKey = link.getAttribute('data-translate');
        console.log('Link translate key:', translateKey);
        if (translateKey) {
            linkMap[translateKey] = link;
        }
    });

    console.log('Link map:', linkMap);

    // Clear the nav and reorder
    nav.innerHTML = '';
    order.forEach(key => {
        if (linkMap[key]) {
            console.log('Adding link:', key);
            nav.appendChild(linkMap[key]);
        } else {
            console.log('Link not found for key:', key);
        }
    });
    
    // Release navigation update lock
    setTimeout(() => {
      window.__navUpdating = false;
    }, 200);
    
    console.log('Navigation reordered successfully');
}
