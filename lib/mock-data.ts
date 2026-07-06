import type {
    Cafe,
    CafeOrder,
    InventoryItem,
    OrderItem,
    Product,
    StockMovement,
    User,
} from "./types";

export const users: User[] = [
    {
        id: "u1",
        name: "کامیار رضایی",
        username: "owner",
        role: "owner",
        status: "active",
        locationName: "دفتر مدیریت",
    },
    {
        id: "u2",
        name: "مریم احمدی",
        username: "manager",
        role: "manager",
        status: "active",
        locationName: "دفتر مدیریت",
    },
    {
        id: "u3",
        name: "پرسنل Penza",
        username: "cafe1",
        role: "cafe_staff",
        status: "active",
        locationName: "Penza",
    },
    {
        id: "u4",
        name: "انباردار Penza",
        username: "storage",
        role: "storage_staff",
        status: "active",
        locationName: "انبار مرکزی",
    },
];

export const cafes: Cafe[] = [
    {
        id: "c1",
        name: "Penza",
        managerName: "پرسنل Penza",
        address: "گرگان، عدالت 81",
    },
];

//
// Real stock seed imported from uploaded Excel:
// «انبار گردانی اردیبهشت 1405.xlsx»
// Source columns used:
// - نام کالا
// - واحد
// - مانده as currentQuantity
//
export const products: Product[] = [
    {
        "id": "p1",
        "name": "سیروپ گل رز",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p2",
        "name": "سیروپ رز fo",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p3",
        "name": "سیروپ آمارتو",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p4",
        "name": "سیروپ تریپل سک کاراسائو",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p5",
        "name": "سیروپ کارامل",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p6",
        "name": "سیروپ سیب سبز",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p7",
        "name": "سیروپ موهیتو",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p8",
        "name": "سیروپ بلوبری",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p9",
        "name": "سیروپ آیریش",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p10",
        "name": "سیروپ دارچین زنجبیل",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p11",
        "name": "سیروپ نارگیل",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p12",
        "name": "سیروپ فندق",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p13",
        "name": "سیروپ پشن فروت",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p14",
        "name": "سیروپ بلو کاراساِئو",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p15",
        "name": "سیروپ گرانادین",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p16",
        "name": "سیروپ وانیل",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p17",
        "name": "سیروپ تیرامیسو",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p18",
        "name": "سیروپ رام",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p19",
        "name": "شربت سکنجبین",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p20",
        "name": "عرق بهار نارنج",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p21",
        "name": "عرق نسترن",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p22",
        "name": "گلاب اعلاء",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p23",
        "name": "بیسکویت پتی بور",
        "category": "bakery",
        "unit": "بسته"
    },
    {
        "id": "p24",
        "name": "سرکه بالزامیک",
        "category": "other",
        "unit": "لیتر"
    },
    {
        "id": "p25",
        "name": "نمک آرومات",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p26",
        "name": "کبریت",
        "category": "other",
        "unit": "بسته"
    },
    {
        "id": "p27",
        "name": "فیلتر کمکس 3 کاب",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p28",
        "name": "بیسکویت لوتوس کرمدار",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p29",
        "name": "بیسکویت لوتوس بدون کرم(بیسکوف)",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p30",
        "name": "روغن هسته انگور",
        "category": "other",
        "unit": "لیتر"
    },
    {
        "id": "p31",
        "name": "عسل",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p32",
        "name": "سان استار آناناس",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p33",
        "name": "سویا سس",
        "category": "other",
        "unit": "لیتر"
    },
    {
        "id": "p34",
        "name": "آب آلویه ورا",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p35",
        "name": "مغز سه تخم",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p36",
        "name": "ادویه چیکن ماسالا",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p37",
        "name": "ادویه فیش ماسالا",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p38",
        "name": "ادویه تنوری ماسالا",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p39",
        "name": "کرم لوتوس",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p40",
        "name": "دمنوش کوین بری",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p41",
        "name": "اسپری روغن",
        "category": "cleaning",
        "unit": "لیتر"
    },
    {
        "id": "p42",
        "name": "دمنوش ویکتوریا سان ست",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p43",
        "name": "روغن زیتون پالایش شده",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p44",
        "name": "عصاره مرغ",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p45",
        "name": "عصاره گوشت",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p46",
        "name": "چاشنی سیب زمینی",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p47",
        "name": "چای ماسالا",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p48",
        "name": "شیره توت",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p49",
        "name": "فیلتر v60",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p50",
        "name": "ادویه دود",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p51",
        "name": "سرور v60",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p52",
        "name": "سس بطری فلفلی کاله",
        "category": "dairy",
        "unit": "عدد"
    },
    {
        "id": "p53",
        "name": "پودر قهوه مومنتی",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p54",
        "name": "قهوه 80/20",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p55",
        "name": "قهوه 50/50",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p56",
        "name": "رب گوجه فرنگی",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p57",
        "name": "زغال",
        "category": "other",
        "unit": "بسته"
    },
    {
        "id": "p58",
        "name": "آرد مافین",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p59",
        "name": "آرد ایزی چاپاتا",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p60",
        "name": "آرد ایزی تست",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p61",
        "name": "آرد ایزی برگر",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p62",
        "name": "چای احمد",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p63",
        "name": "آرد ذرت",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p64",
        "name": "عرق بیدمشک",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p65",
        "name": "عرق هزار گیاه",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p66",
        "name": "سبزی سورل",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p67",
        "name": "رب انار",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p68",
        "name": "شیشه کلد برو",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p69",
        "name": "وایتکس",
        "category": "cleaning",
        "unit": "کیلوگرم"
    },
    {
        "id": "p70",
        "name": "رایت",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p71",
        "name": "روغن زیتون با بو",
        "category": "other",
        "unit": "لیتر"
    },
    {
        "id": "p72",
        "name": "روغن زیتون بدون  بو",
        "category": "other",
        "unit": "لیتر"
    },
    {
        "id": "p73",
        "name": "تاید",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p74",
        "name": "مایع ظرفشویی",
        "category": "cleaning",
        "unit": "عدد"
    },
    {
        "id": "p75",
        "name": "مایع دستشویی",
        "category": "cleaning",
        "unit": "عدد"
    },
    {
        "id": "p76",
        "name": "تخم مرغ معمولی",
        "category": "dairy",
        "unit": "عدد",
        "stockUnit": "عدد",
        "orderUnit": "شانه",
        "orderUnitQuantity": 30,
        "orderQuantityStep": 1
    },
    {
        "id": "p77",
        "name": "سس گلوریا",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p78",
        "name": "شربت شکر",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p79",
        "name": "شکلات سطلی فندقی",
        "category": "cleaning",
        "unit": "کیلوگرم"
    },
    {
        "id": "p80",
        "name": "سس شکلات دارک 500 گرمی کاله",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p81",
        "name": "سرکه سفید وردا",
        "category": "other",
        "unit": "لیتر"
    },
    {
        "id": "p82",
        "name": "سس گوجه فرنگی سطلی رعنا",
        "category": "cleaning",
        "unit": "کیلوگرم"
    },
    {
        "id": "p83",
        "name": "آرد نول",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p84",
        "name": "آرد ستاره",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p85",
        "name": "سس کارامل 500 گرمی کاله",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p86",
        "name": "پاستا پنه",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p87",
        "name": "مغز گردو",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p88",
        "name": "گردو خرد شده",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p89",
        "name": "بادام زمینی خام",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p90",
        "name": "نی نبات",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p91",
        "name": "جو دو سر پرک",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p92",
        "name": "سویا خشک",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p93",
        "name": "لوبیا چیتی فله",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p94",
        "name": "جوش شیرین",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p95",
        "name": "پلاستیک دسته دار بزرگ",
        "category": "packaging",
        "unit": "کیلوگرم"
    },
    {
        "id": "p96",
        "name": "پلاستیک دسته دار متوسط",
        "category": "packaging",
        "unit": "کیلوگرم"
    },
    {
        "id": "p97",
        "name": "پلاستیک دسته دار کوچک",
        "category": "packaging",
        "unit": "کیلوگرم"
    },
    {
        "id": "p98",
        "name": "قند پرسنلی",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p99",
        "name": "سس کچاپ تک نفره(ساشه)",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p100",
        "name": "پارچه طی",
        "category": "cleaning",
        "unit": "عدد"
    },
    {
        "id": "p101",
        "name": "دستمال  پارچه ای رنگی نظافت",
        "category": "cleaning",
        "unit": "عدد"
    },
    {
        "id": "p102",
        "name": "لباس پرسنل پنزا",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p103",
        "name": "شکلات چیپسی تلخ",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p104",
        "name": "بیکینگ پودر",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p105",
        "name": "ارده کنجد",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p106",
        "name": "وانیل",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p107",
        "name": "کرن بری",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p108",
        "name": "چوب شور",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p109",
        "name": "ذرت شیرین",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p110",
        "name": "کره بادام زمینی",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p111",
        "name": "S500",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p112",
        "name": "کپسول مافین",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p113",
        "name": "پودر سوخاری",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p114",
        "name": "کاغذ روغنی",
        "category": "packaging",
        "unit": "کیلوگرم"
    },
    {
        "id": "p115",
        "name": "نمک",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p116",
        "name": "پودر قند",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p117",
        "name": "نمک دریا",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p118",
        "name": "کنسرو لوبیا",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p119",
        "name": "خمیر مایه",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p120",
        "name": "کنجد طلایی",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p121",
        "name": "شکلات سکه ای سفید سوربن",
        "category": "bakery",
        "unit": "کیلوگرم",
        "stockUnit": "کیلوگرم",
        "orderUnit": "بسته",
        "orderUnitQuantity": 3.5,
        "orderQuantityStep": 1
    },
    {
        "id": "p122",
        "name": "کنجد سفید",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p123",
        "name": "پرک بادام درختی",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p124",
        "name": "پرک بادام زمینی",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p125",
        "name": "عدس فله",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p126",
        "name": "نخود",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p127",
        "name": "لوبیا سفید",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p128",
        "name": "پودر کاکائو ترک",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p129",
        "name": "پودر کاکائو هلندی",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p130",
        "name": "سس خردل سطلی",
        "category": "cleaning",
        "unit": "کیلوگرم"
    },
    {
        "id": "p131",
        "name": "سس مایونز سطلی",
        "category": "cleaning",
        "unit": "کیلوگرم"
    },
    {
        "id": "p132",
        "name": "سس فرانسوی سطلی",
        "category": "cleaning",
        "unit": "کیلوگرم"
    },
    {
        "id": "p133",
        "name": "سوسیس پنزا(چوریتسو)0.35",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p134",
        "name": "سوسیس آمریکایی (ایتالی)0.22",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p135",
        "name": "سوسیس انگلیسی (انگلیسی)0.35",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p136",
        "name": "سوسیس سوسچن( حلزونی )0.2",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p137",
        "name": "هات داگ باربیکیو0.4",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p138",
        "name": "هات داگ کبابی پنیری",
        "category": "dairy",
        "unit": "عدد"
    },
    {
        "id": "p139",
        "name": "پودر دارچین",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p140",
        "name": "پودر فلفل سفید",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p141",
        "name": "پودر مرزن جوش",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p142",
        "name": "تخم شربتی",
        "category": "syrup",
        "unit": "کیلوگرم"
    },
    {
        "id": "p143",
        "name": "پودر فلفل سیاه",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p144",
        "name": "پودر آویشن",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p145",
        "name": "پودر زیره سیاه",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p146",
        "name": "پودر زنجبیل",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p147",
        "name": "پودر خردل",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p148",
        "name": "پودر رازیانه",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p149",
        "name": "پودر زیره سبز",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p150",
        "name": "خاکشیر",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p151",
        "name": "چوب دارچین",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p152",
        "name": "بستنی وانیل",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p153",
        "name": "بستنی شکلاتی",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p154",
        "name": "خامه صبحانه بزرگ",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p155",
        "name": "بیکن کاله",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p156",
        "name": "بیکن فرانسوی 202--0.3",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p157",
        "name": "پنیر ویلی",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p158",
        "name": "پنیر پستو قالبی",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p159",
        "name": "پنیر کبابی",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p160",
        "name": "پنیر دودی",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p161",
        "name": "پنیر موتزارلا",
        "category": "dairy",
        "unit": "کیلوگرم",
        "stockUnit": "کیلوگرم",
        "orderUnit": "بسته",
        "orderUnitQuantity": 2,
        "orderQuantityStep": 1
    },
    {
        "id": "p162",
        "name": "پنیر لبنه",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p163",
        "name": "پنیر ماسکار پونه",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p164",
        "name": "شکلات سکه ای تلخ سوربن",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p165",
        "name": "شکلات سکه ای شیری سوربن",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p166",
        "name": "شیر بادام",
        "category": "bakery",
        "unit": "لیتر"
    },
    {
        "id": "p167",
        "name": "شیر فندق",
        "category": "bakery",
        "unit": "لیتر"
    },
    {
        "id": "p168",
        "name": "شیر جو دو",
        "category": "other",
        "unit": "لیتر"
    },
    {
        "id": "p169",
        "name": "شکلات تلخ کنار قهوه 75%",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p170",
        "name": "خامه 33%",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p171",
        "name": "سس کارامل",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p172",
        "name": "سس شکلات",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p173",
        "name": "کاپ اسپرسو",
        "category": "coffee",
        "unit": "عدد"
    },
    {
        "id": "p174",
        "name": "کاپ لته",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p175",
        "name": "کاپ کاپوچینو",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p176",
        "name": "درب لته",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p177",
        "name": "درب کاپوچینو",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p178",
        "name": "دربه اسپرسو",
        "category": "coffee",
        "unit": "عدد"
    },
    {
        "id": "p179",
        "name": "آواکادو",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p180",
        "name": "سس باربی کیو سطلی",
        "category": "cleaning",
        "unit": "کیلوگرم"
    },
    {
        "id": "p181",
        "name": "شکر قهوه ای",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p182",
        "name": "گلوکز مایع",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p183",
        "name": "قند تکنفره",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p184",
        "name": "قالب سینما رول",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p185",
        "name": "سبوس خوراکی",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p186",
        "name": "شکلات چیبسی کلبوت",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p187",
        "name": "شکلات چیپسی شیری سوربن",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p188",
        "name": "فلفل قرمز",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p189",
        "name": "نشاسته ذرت",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p190",
        "name": "خامه مینارین",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p191",
        "name": "پاکت سوخاری کوچک (متوسط)",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p192",
        "name": "پاکت سوخاری بزرگ",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p193",
        "name": "کره کاله",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p194",
        "name": "ظرف پاستا و سالاد گرد با درب",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p195",
        "name": "جوهر استامپ",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p196",
        "name": "سیم ظرفشویی",
        "category": "cleaning",
        "unit": "عدد"
    },
    {
        "id": "p197",
        "name": "پلاستیک زباله بزرگ",
        "category": "cleaning",
        "unit": "عدد"
    },
    {
        "id": "p198",
        "name": "قیف پلاستیکی قنادی",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p199",
        "name": "پاکت آجیلی کوچک",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p200",
        "name": "پاکت بیرون بر سرویس قاشق و چنگال",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p201",
        "name": "پاکت بیرون بر سیب زمینی",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p202",
        "name": "دستکش یک بار مصرف",
        "category": "cleaning",
        "unit": "عدد"
    },
    {
        "id": "p203",
        "name": "سفره یک بار مصرف",
        "category": "other",
        "unit": "رول"
    },
    {
        "id": "p204",
        "name": "قاشق یک بار مصرف بزرگ",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p205",
        "name": "چنگال یک بار مصرف",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p206",
        "name": "چاقو یک بار مصرف",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p207",
        "name": "کلاه یک بار مصرف",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p208",
        "name": "سلفون کوچک",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p209",
        "name": "فویل آلمینیومی",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p210",
        "name": "پلاستیک فریزر رولی",
        "category": "packaging",
        "unit": "رول"
    },
    {
        "id": "p211",
        "name": "هولدر دو تایی",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p212",
        "name": "هولدر چهار تایی",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p213",
        "name": "اسکاج معمولی",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p214",
        "name": "پلاستیک زبال بار سایز متوسط",
        "category": "packaging",
        "unit": "رول"
    },
    {
        "id": "p215",
        "name": "پاکت بیرون بر برگر درب از بالا",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p216",
        "name": "پاکت بیرون بر متوسط",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p217",
        "name": "پاکت بیرون بر بزرگ",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p218",
        "name": "پاکت بیرون بر چاپاتا",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p219",
        "name": "لیوان بیرون بر شیک",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p220",
        "name": "کاپ لته مشکی با درب",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p221",
        "name": "قهوه دمی هرا",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p222",
        "name": "ظرف سس قارچ",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p223",
        "name": "ظرف بیرون بر سس با درب",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p224",
        "name": "ظرف سالاد سوسچن (دلی 250)",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p225",
        "name": "نی سایز 6",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p226",
        "name": "نی سایز 8",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p227",
        "name": "نی سایز 10 شیک",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p228",
        "name": "لیبل پنزا",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p229",
        "name": "کاغذ رول(پرینتر)",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p230",
        "name": "ظرف بیرون بر کیک سایز کوچک",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p231",
        "name": "ظرف بیرون بر کیک سایز بزرگ",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p232",
        "name": "ظرف عدسی",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p233",
        "name": "ظرف سالاد سزارو پاستا(کرافت)",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p234",
        "name": "دستمال اقتصادی",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p235",
        "name": "دستمال کوکتل",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p236",
        "name": "ظرف سیب ویژه و لازانیا",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p237",
        "name": "ظرف بیرون بر استیک",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p238",
        "name": "سس چیلی تای کاله",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p239",
        "name": "قاشق هم زن 3 سوراخه",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p240",
        "name": "جعبه برگر سفره کرافت",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p241",
        "name": "ظرف سالاد کوچک",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p242",
        "name": "لیوان نوشیدنی شیشه ای کازا بلند",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p243",
        "name": "دستکش لاتکس",
        "category": "cleaning",
        "unit": "عدد"
    },
    {
        "id": "p244",
        "name": "خلال دندان",
        "category": "packaging",
        "unit": "بسته"
    },
    {
        "id": "p245",
        "name": "سوزن منگنه",
        "category": "other",
        "unit": "بسته"
    },
    {
        "id": "p246",
        "name": "دستکش رز مریم",
        "category": "cleaning",
        "unit": "عدد"
    },
    {
        "id": "p247",
        "name": "پلاستیک زباله سایز کوچک",
        "category": "cleaning",
        "unit": "رول"
    },
    {
        "id": "p248",
        "name": "شیر نارگیل کاله یک لیتری",
        "category": "dairy",
        "unit": "لیتر"
    },
    {
        "id": "p249",
        "name": "ظرف وافل",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p250",
        "name": "سیخ چوبی بامبو",
        "category": "other",
        "unit": "بسته"
    },
    {
        "id": "p251",
        "name": "سیخ چوبی",
        "category": "other",
        "unit": "بسته"
    },
    {
        "id": "p252",
        "name": "چای ماچا",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p253",
        "name": "اسمارتیس",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p254",
        "name": "پاکت دو نفره خام",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p255",
        "name": "پاکت بیرون بر باگد",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p256",
        "name": "محافظ برق",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p257",
        "name": "روغن پخت و پز کانولا",
        "category": "other",
        "unit": "لیتر"
    },
    {
        "id": "p258",
        "name": "روغن سرخ کردنی",
        "category": "other",
        "unit": "لیتر"
    },
    {
        "id": "p259",
        "name": "بطری بیرون بر کوچک 350CC",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p260",
        "name": "بطری بیرون بر بزرگ 500CC",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p261",
        "name": "دراژه رنگی",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p262",
        "name": "مغز تخمه آفتابگردان",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p263",
        "name": "شکلات گالاردو",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p264",
        "name": "پنیر گودا ورقه ای",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p265",
        "name": "سبزی میکس",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p266",
        "name": "ریحان ایتالیایی",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p267",
        "name": "سبزی روکولا",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p268",
        "name": "سبزی جعفری فری",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p269",
        "name": "شیر بطری",
        "category": "dairy",
        "unit": "بطری",
        "stockUnit": "بطری",
        "orderUnit": "شلف",
        "orderUnitQuantity": 6,
        "orderQuantityStep": 1
    },
    {
        "id": "p270",
        "name": "کاهو بنفش",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p271",
        "name": "کاهو فرانسه",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p272",
        "name": "سوسیس پرسنل(هات داگ پطروس)",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p273",
        "name": "آب انار",
        "category": "other",
        "unit": "لیتر"
    },
    {
        "id": "p274",
        "name": "سیب منجمد",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p275",
        "name": "پنیر پیتزا همسفر",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p276",
        "name": "پنیر پیتزا مطهر",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p277",
        "name": "پنیر پارمسان",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p278",
        "name": "پنیر بلوچیز",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p279",
        "name": "خامه قنادی سولیانو",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p280",
        "name": "انواع میوه های یخی تابستانی",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p281",
        "name": "آرد بربری",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p282",
        "name": "شکلات چیپسی نسوز کارات",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p283",
        "name": "مویز",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p284",
        "name": "شکلات  سطلی چیپسی سینما رول",
        "category": "cleaning",
        "unit": "عدد"
    },
    {
        "id": "p285",
        "name": "گوشت فیله گوساله",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p286",
        "name": "گوشت راسته گوساله",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p287",
        "name": "کشمش",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p288",
        "name": "سبزی خورد شده آشی یخ زده",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p289",
        "name": "سیروپ دارچین",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p290",
        "name": "شیر تتراپک",
        "category": "other",
        "unit": "لیتر"
    },
    {
        "id": "p291",
        "name": "آب گاز دار کوچک",
        "category": "other",
        "unit": "لیتر"
    },
    {
        "id": "p292",
        "name": "آب گاز دار کریستال 1 لیتری کاله",
        "category": "dairy",
        "unit": "لیتر"
    },
    {
        "id": "p293",
        "name": "نوشابه فانتا",
        "category": "other",
        "unit": "عدد",
        "stockUnit": "عدد",
        "orderUnit": "پک",
        "orderUnitQuantity": 24,
        "orderQuantityStep": 1
    },
    {
        "id": "p294",
        "name": "نوشابه زیرو",
        "category": "other",
        "unit": "عدد",
        "stockUnit": "عدد",
        "orderUnit": "پک",
        "orderUnitQuantity": 24,
        "orderQuantityStep": 1
    },
    {
        "id": "p295",
        "name": "نوشابه کوکا",
        "category": "other",
        "unit": "عدد",
        "stockUnit": "عدد",
        "orderUnit": "پک",
        "orderUnitQuantity": 24,
        "orderQuantityStep": 1
    },
    {
        "id": "p296",
        "name": "نوشابه اسپرایت",
        "category": "other",
        "unit": "عدد",
        "stockUnit": "عدد",
        "orderUnit": "پک",
        "orderUnitQuantity": 24,
        "orderQuantityStep": 1
    },
    {
        "id": "p297",
        "name": "آب معدنی",
        "category": "other",
        "unit": "عدد",
        "stockUnit": "عدد",
        "orderUnit": "پک",
        "orderUnitQuantity": 12,
        "orderQuantityStep": 1
    },
    {
        "id": "p298",
        "name": "خیار شور حلبی 17 کیلویی",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p299",
        "name": "کره بزگ کاله(خرد شده) داخل همه یخچال ها",
        "category": "dairy",
        "unit": "عدد"
    },
    {
        "id": "p300",
        "name": "شکر سفید",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p301",
        "name": "خمیر کروسان",
        "category": "bakery",
        "unit": "عدد"
    },
    {
        "id": "p302",
        "name": "پودر سیر",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p303",
        "name": "پول بیبر",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p304",
        "name": "شکلات میله ای کلبوت",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p305",
        "name": "قهوه ترک",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p306",
        "name": "قهوه فوری",
        "category": "coffee",
        "unit": "عدد"
    },
    {
        "id": "p307",
        "name": "قهوه آناسورا",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p308",
        "name": "قهوه پامبوجیلا",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p309",
        "name": "اسپاگتی",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p310",
        "name": "کیسه زباله متوسط",
        "category": "cleaning",
        "unit": "رول"
    },
    {
        "id": "p311",
        "name": "سلفون",
        "category": "packaging",
        "unit": "رول"
    },
    {
        "id": "p312",
        "name": "پاکت آجیلی متوسط",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p313",
        "name": "پاکت آجیلی بزرگ",
        "category": "packaging",
        "unit": "کیلوگرم"
    },
    {
        "id": "p314",
        "name": "کلاه یک بار مصرف",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p315",
        "name": "کاور کفش",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p316",
        "name": "قاشق یک بار مصرف کوچک",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p317",
        "name": "چنگال یک بار مصرف",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p318",
        "name": "کارد یکبار مصرف",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p319",
        "name": "فویل آلمینیومی",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p320",
        "name": "پاکت بیرون بر هات داگ",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p321",
        "name": "پاکت بیرون بر برگر",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p322",
        "name": "کارتن شیرینی",
        "category": "packaging",
        "unit": "کیلوگرم"
    },
    {
        "id": "p323",
        "name": "پنیر گودا قالبی",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p324",
        "name": "شاه توت منجمد",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p325",
        "name": "زردآلو منجمد",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p326",
        "name": "هلو منجمد",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p327",
        "name": "انگور سیاه منجمد",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p328",
        "name": "انگور سفید منجمد",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p329",
        "name": "انبه منجمد",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p330",
        "name": "آلبالو منجمد",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p331",
        "name": "سیر رنده منجمد",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p332",
        "name": "کامکوآت منجمد",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p333",
        "name": "حمص منجمد",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p334",
        "name": "تخم مرغ تلاونگ",
        "category": "dairy",
        "unit": "عدد",
        "stockUnit": "عدد",
        "orderUnit": "شانه",
        "orderUnitQuantity": 30,
        "orderQuantityStep": 1
    },
    {
        "id": "p335",
        "name": "تخم مرغ درین",
        "category": "dairy",
        "unit": "عدد",
        "stockUnit": "عدد",
        "orderUnit": "شانه",
        "orderUnitQuantity": 30,
        "orderQuantityStep": 1
    },
    {
        "id": "p336",
        "name": "پنیر صبحانه کاله",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p337",
        "name": "پنیر پستوسبز ورقه ای",
        "category": "dairy",
        "unit": "عدد"
    },
    {
        "id": "p338",
        "name": "گل محمدی",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p339",
        "name": "پودر هل",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p340",
        "name": "زیتون اسلایس",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p341",
        "name": "بیبی کورن",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p342",
        "name": "بهلیمو",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p343",
        "name": "گوجه خشک",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p344",
        "name": "زردچوبه",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p345",
        "name": "پودر پاپریکا",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p346",
        "name": "سیاه دانه",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p347",
        "name": "آرد سمولینا",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p348",
        "name": "سس ورچستر",
        "category": "other",
        "unit": "لیتر"
    },
    {
        "id": "p349",
        "name": "دمنوش رویال جاسمین",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p350",
        "name": "دمنوش لمون گرس جینجر",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p351",
        "name": "سلفون برگر",
        "category": "packaging",
        "unit": "کیلوگرم"
    },
    {
        "id": "p352",
        "name": "چای سبز",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p353",
        "name": "گل بنفشه",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p354",
        "name": "گل گاو زبان",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p355",
        "name": "جوز هندی",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p356",
        "name": "گلوتن",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p357",
        "name": "بهبود دهنده xxl(مخصوص کروسان)",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p358",
        "name": "استونیش چربی زدا",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p359",
        "name": "سیروپ زنجبیل",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p360",
        "name": "بیبی اسفناج",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p361",
        "name": "جعبه شیرینی بزرگ",
        "category": "packaging",
        "unit": "کیلوگرم"
    },
    {
        "id": "p362",
        "name": "قهوه کوما 80/20 روبوستا",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p363",
        "name": "قهوه کوما 60/40 عربیکا",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p364",
        "name": "سبزی کیل",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p365",
        "name": "قهوه lem",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p366",
        "name": "سلفون بزرگ کیت لاین",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p367",
        "name": "ظرف پلاستیکی کوچک کد 310",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p368",
        "name": "خامه قنادی میهن سبز",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p369",
        "name": "شیر زیرو 1 لیتری",
        "category": "other",
        "unit": "لیتر"
    },
    {
        "id": "p370",
        "name": "لیوان شیک جدید",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p371",
        "name": "قهوه 50 batsam",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p372",
        "name": "قهوه 70 فورزا batsam",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p373",
        "name": "قهوه 70 لجرو batsam",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p374",
        "name": "قهوه دلیکاتو batsam",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p375",
        "name": "قهوه بنگستو batsam",
        "category": "coffee",
        "unit": "کیلوگرم"
    },
    {
        "id": "p376",
        "name": "لیوان نوشیدنی شیشه ای کوتاه کازا",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p377",
        "name": "شات شیشه ای کازا",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p378",
        "name": "اسپری تمیز کننده سیف(cif)",
        "category": "cleaning",
        "unit": "عدد"
    },
    {
        "id": "p379",
        "name": "آرد بادام درختی",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p380",
        "name": "بیسکوییت لتاس ایرانی",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p381",
        "name": "لیوان شیک شیشه ای",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p382",
        "name": "سوسچن کاله",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p383",
        "name": "تمشک",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p384",
        "name": "سیروپ نعناع",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p385",
        "name": "پنیر پیتزا کاله",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p386",
        "name": "جعبه شیرینی کوچک",
        "category": "packaging",
        "unit": "کیلوگرم"
    },
    {
        "id": "p387",
        "name": "ظرف سس پمپی",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p388",
        "name": "انجیر خشک",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p389",
        "name": "استونیش سرویس بهداشتی",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p390",
        "name": "استونیش مبلمان",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p391",
        "name": "استونیش خوشبو کننده",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p392",
        "name": "استونیش آشپزخانه",
        "category": "other",
        "unit": "عدد"
    },
    {
        "id": "p393",
        "name": "لیوان موکا",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p394",
        "name": "کاغذ ساندویچ",
        "category": "packaging",
        "unit": "کیلوگرم"
    },
    {
        "id": "p395",
        "name": "ماست سون کاله",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p396",
        "name": "توت فرنگی",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p397",
        "name": "سیروپ لاوندر fo",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p398",
        "name": "سیروپ کدو حلوایی fo",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p399",
        "name": "سیروپ کوکی fo",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p400",
        "name": "سیروپ توت فرنگی fo",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p401",
        "name": "سیروپ کارامل fo",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p402",
        "name": "سیروپ دارچین fo",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p403",
        "name": "سیروپ وانیل fo",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p404",
        "name": "سیروپ فندق fo",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p405",
        "name": "عسل پنزا استور",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p406",
        "name": "شیره انگور پنزا استور",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p407",
        "name": "جو پرک پنزا استور",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p408",
        "name": "فلافل",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p409",
        "name": "لیبل شیشه ترشی پنزا استور",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p410",
        "name": "لیبل درب شیشه ترشی پنزا استور",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p411",
        "name": "لیبل گرانول پنزا استور",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p412",
        "name": "جعبه کاپ کیک",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p413",
        "name": "جعبه لانچ",
        "category": "packaging",
        "unit": "عدد"
    },
    {
        "id": "p414",
        "name": "پودر گشنیز",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p415",
        "name": "شکلات چیپسی آنیه",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p416",
        "name": "مربای کامکوات",
        "category": "other",
        "unit": "کیلوگرم"
    },
    {
        "id": "p417",
        "name": "اب گازدار r8",
        "category": "syrup",
        "unit": "لیتر"
    },
    {
        "id": "p418",
        "name": "شکر دونه ریز",
        "category": "bakery",
        "unit": "کیلوگرم"
    },
    {
        "id": "p419",
        "name": "پنیر صبحانه اماه",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p420",
        "name": "پنیر پستو سبز قالبی",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p421",
        "name": "پنیر پستو قرمز قالبی",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p422",
        "name": "کره 200 گرمی کاله",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p423",
        "name": "علی کافه",
        "category": "coffee",
        "unit": "عدد"
    },
    {
        "id": "p424",
        "name": "پنیر زرد ورقه ای 10 عددی",
        "category": "dairy",
        "unit": "کیلوگرم"
    },
    {
        "id": "p425",
        "name": "شیر نارگیل 200ml کاله",
        "category": "dairy",
        "unit": "لیتر"
    },
    {
        "id": "p426",
        "name": "پودر پیاز",
        "category": "bakery",
        "unit": "کیلوگرم"
    }
];

export const inventoryItems: InventoryItem[] = [
    {
        "id": "i1",
        "productId": "p1",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i2",
        "productId": "p2",
        "currentQuantity": 0.7,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i3",
        "productId": "p3",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i4",
        "productId": "p4",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i5",
        "productId": "p5",
        "currentQuantity": 6,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i6",
        "productId": "p6",
        "currentQuantity": 1.4,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i7",
        "productId": "p7",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i8",
        "productId": "p8",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i9",
        "productId": "p9",
        "currentQuantity": 1.4,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i10",
        "productId": "p10",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i11",
        "productId": "p11",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i12",
        "productId": "p12",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i13",
        "productId": "p13",
        "currentQuantity": 1.4,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i14",
        "productId": "p14",
        "currentQuantity": 2.1,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i15",
        "productId": "p15",
        "currentQuantity": 4.2,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i16",
        "productId": "p16",
        "currentQuantity": 1.5,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i17",
        "productId": "p17",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i18",
        "productId": "p18",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i19",
        "productId": "p19",
        "currentQuantity": 2.8,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i20",
        "productId": "p20",
        "currentQuantity": 15,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i21",
        "productId": "p21",
        "currentQuantity": 2,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i22",
        "productId": "p22",
        "currentQuantity": 10,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i23",
        "productId": "p23",
        "currentQuantity": 14,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i24",
        "productId": "p24",
        "currentQuantity": 2,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i25",
        "productId": "p25",
        "currentQuantity": 1,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i26",
        "productId": "p26",
        "currentQuantity": 40,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i27",
        "productId": "p27",
        "currentQuantity": 40,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i28",
        "productId": "p28",
        "currentQuantity": 0.15,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i29",
        "productId": "p29",
        "currentQuantity": 4.25,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i30",
        "productId": "p30",
        "currentQuantity": 0.75,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i31",
        "productId": "p31",
        "currentQuantity": 9,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i32",
        "productId": "p32",
        "currentQuantity": 2,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i33",
        "productId": "p33",
        "currentQuantity": 6,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i34",
        "productId": "p34",
        "currentQuantity": 18,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i35",
        "productId": "p35",
        "currentQuantity": 0.36,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i36",
        "productId": "p36",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i37",
        "productId": "p37",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i38",
        "productId": "p38",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i39",
        "productId": "p39",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i40",
        "productId": "p40",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i41",
        "productId": "p41",
        "currentQuantity": 1.5,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i42",
        "productId": "p42",
        "currentQuantity": 0.25,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i43",
        "productId": "p43",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i44",
        "productId": "p44",
        "currentQuantity": 408,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i45",
        "productId": "p45",
        "currentQuantity": 480,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i46",
        "productId": "p46",
        "currentQuantity": 3.5,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i47",
        "productId": "p47",
        "currentQuantity": 2,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i48",
        "productId": "p48",
        "currentQuantity": 4.5,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i49",
        "productId": "p49",
        "currentQuantity": 40,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i50",
        "productId": "p50",
        "currentQuantity": 0.8,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i51",
        "productId": "p51",
        "currentQuantity": 2,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i52",
        "productId": "p52",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i53",
        "productId": "p53",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i54",
        "productId": "p54",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i55",
        "productId": "p55",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i56",
        "productId": "p56",
        "currentQuantity": 16.8,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i57",
        "productId": "p57",
        "currentQuantity": 2,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i58",
        "productId": "p58",
        "currentQuantity": 40,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i59",
        "productId": "p59",
        "currentQuantity": 10,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i60",
        "productId": "p60",
        "currentQuantity": 20,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i61",
        "productId": "p61",
        "currentQuantity": 10,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i62",
        "productId": "p62",
        "currentQuantity": 3.5,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i63",
        "productId": "p63",
        "currentQuantity": 0.4,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i64",
        "productId": "p64",
        "currentQuantity": 4,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i65",
        "productId": "p65",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i66",
        "productId": "p66",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i67",
        "productId": "p67",
        "currentQuantity": 2,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i68",
        "productId": "p68",
        "currentQuantity": 93,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i69",
        "productId": "p69",
        "currentQuantity": 12,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i70",
        "productId": "p70",
        "currentQuantity": 10,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i71",
        "productId": "p71",
        "currentQuantity": 3.6,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i72",
        "productId": "p72",
        "currentQuantity": 18,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i73",
        "productId": "p73",
        "currentQuantity": 7,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i74",
        "productId": "p74",
        "currentQuantity": 5,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i75",
        "productId": "p75",
        "currentQuantity": 4,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i76",
        "productId": "p76",
        "currentQuantity": 690,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i77",
        "productId": "p77",
        "currentQuantity": 0.088,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i78",
        "productId": "p78",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i79",
        "productId": "p79",
        "currentQuantity": 18,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i80",
        "productId": "p80",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i81",
        "productId": "p81",
        "currentQuantity": 24.5,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i82",
        "productId": "p82",
        "currentQuantity": 26.1,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i83",
        "productId": "p83",
        "currentQuantity": 25,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i84",
        "productId": "p84",
        "currentQuantity": 40,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i85",
        "productId": "p85",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i86",
        "productId": "p86",
        "currentQuantity": 84.5,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i87",
        "productId": "p87",
        "currentQuantity": 2.7,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i88",
        "productId": "p88",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i89",
        "productId": "p89",
        "currentQuantity": 5,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i90",
        "productId": "p90",
        "currentQuantity": 1602,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i91",
        "productId": "p91",
        "currentQuantity": 0.5,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i92",
        "productId": "p92",
        "currentQuantity": 0.33,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i93",
        "productId": "p93",
        "currentQuantity": 1.62,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i94",
        "productId": "p94",
        "currentQuantity": 3.65,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i95",
        "productId": "p95",
        "currentQuantity": 2.295,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i96",
        "productId": "p96",
        "currentQuantity": 9.5,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i97",
        "productId": "p97",
        "currentQuantity": 2.2,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i98",
        "productId": "p98",
        "currentQuantity": 10,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i99",
        "productId": "p99",
        "currentQuantity": 300,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i100",
        "productId": "p100",
        "currentQuantity": 4,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i101",
        "productId": "p101",
        "currentQuantity": 15,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i102",
        "productId": "p102",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i103",
        "productId": "p103",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i104",
        "productId": "p104",
        "currentQuantity": 2,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i105",
        "productId": "p105",
        "currentQuantity": 0.8,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i106",
        "productId": "p106",
        "currentQuantity": 0.5,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i107",
        "productId": "p107",
        "currentQuantity": 1.4,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i108",
        "productId": "p108",
        "currentQuantity": 37,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i109",
        "productId": "p109",
        "currentQuantity": 4.07,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i110",
        "productId": "p110",
        "currentQuantity": 3.85,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i111",
        "productId": "p111",
        "currentQuantity": 1.2,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i112",
        "productId": "p112",
        "currentQuantity": 600,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i113",
        "productId": "p113",
        "currentQuantity": 58,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i114",
        "productId": "p114",
        "currentQuantity": 7.2,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i115",
        "productId": "p115",
        "currentQuantity": 18,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i116",
        "productId": "p116",
        "currentQuantity": 20,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i117",
        "productId": "p117",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i118",
        "productId": "p118",
        "currentQuantity": 29.64,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i119",
        "productId": "p119",
        "currentQuantity": 7,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i120",
        "productId": "p120",
        "currentQuantity": 1.11,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i121",
        "productId": "p121",
        "currentQuantity": 2.35,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i122",
        "productId": "p122",
        "currentQuantity": 5,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i123",
        "productId": "p123",
        "currentQuantity": 1.95,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i124",
        "productId": "p124",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i125",
        "productId": "p125",
        "currentQuantity": 11.3,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i126",
        "productId": "p126",
        "currentQuantity": 4.975,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i127",
        "productId": "p127",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i128",
        "productId": "p128",
        "currentQuantity": 5.8,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i129",
        "productId": "p129",
        "currentQuantity": 2,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i130",
        "productId": "p130",
        "currentQuantity": 24,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i131",
        "productId": "p131",
        "currentQuantity": 24,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i132",
        "productId": "p132",
        "currentQuantity": 24,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i133",
        "productId": "p133",
        "currentQuantity": 4.83,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i134",
        "productId": "p134",
        "currentQuantity": 4.325,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i135",
        "productId": "p135",
        "currentQuantity": 3.025,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i136",
        "productId": "p136",
        "currentQuantity": 3.005,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i137",
        "productId": "p137",
        "currentQuantity": 1.97,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i138",
        "productId": "p138",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i139",
        "productId": "p139",
        "currentQuantity": 1.215,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i140",
        "productId": "p140",
        "currentQuantity": 1,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i141",
        "productId": "p141",
        "currentQuantity": 0.335,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i142",
        "productId": "p142",
        "currentQuantity": 1.5,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i143",
        "productId": "p143",
        "currentQuantity": 2.7,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i144",
        "productId": "p144",
        "currentQuantity": 0.995,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i145",
        "productId": "p145",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i146",
        "productId": "p146",
        "currentQuantity": 0.29,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i147",
        "productId": "p147",
        "currentQuantity": 0.63,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i148",
        "productId": "p148",
        "currentQuantity": 0.425,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i149",
        "productId": "p149",
        "currentQuantity": 0.625,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i150",
        "productId": "p150",
        "currentQuantity": 2,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i151",
        "productId": "p151",
        "currentQuantity": 0.125,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i152",
        "productId": "p152",
        "currentQuantity": 22.75,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i153",
        "productId": "p153",
        "currentQuantity": 3.25,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i154",
        "productId": "p154",
        "currentQuantity": 2,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i155",
        "productId": "p155",
        "currentQuantity": 7.5,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i156",
        "productId": "p156",
        "currentQuantity": 0.3,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i157",
        "productId": "p157",
        "currentQuantity": 4,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i158",
        "productId": "p158",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i159",
        "productId": "p159",
        "currentQuantity": 11,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i160",
        "productId": "p160",
        "currentQuantity": 0.536,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i161",
        "productId": "p161",
        "currentQuantity": 4,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i162",
        "productId": "p162",
        "currentQuantity": 1,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i163",
        "productId": "p163",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i164",
        "productId": "p164",
        "currentQuantity": 3.5,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i165",
        "productId": "p165",
        "currentQuantity": 4.76,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i166",
        "productId": "p166",
        "currentQuantity": 0.4,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i167",
        "productId": "p167",
        "currentQuantity": 1.2,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i168",
        "productId": "p168",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i169",
        "productId": "p169",
        "currentQuantity": 1.75,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i170",
        "productId": "p170",
        "currentQuantity": 4,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i171",
        "productId": "p171",
        "currentQuantity": 3.6,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i172",
        "productId": "p172",
        "currentQuantity": 15.4,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i173",
        "productId": "p173",
        "currentQuantity": 860,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i174",
        "productId": "p174",
        "currentQuantity": 1700,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i175",
        "productId": "p175",
        "currentQuantity": 2725,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i176",
        "productId": "p176",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i177",
        "productId": "p177",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i178",
        "productId": "p178",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i179",
        "productId": "p179",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i180",
        "productId": "p180",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i181",
        "productId": "p181",
        "currentQuantity": 5.5,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i182",
        "productId": "p182",
        "currentQuantity": 1.44,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i183",
        "productId": "p183",
        "currentQuantity": 595,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i184",
        "productId": "p184",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i185",
        "productId": "p185",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i186",
        "productId": "p186",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i187",
        "productId": "p187",
        "currentQuantity": 3.5,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i188",
        "productId": "p188",
        "currentQuantity": 0.71,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i189",
        "productId": "p189",
        "currentQuantity": 0.725,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i190",
        "productId": "p190",
        "currentQuantity": 2.25,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i191",
        "productId": "p191",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i192",
        "productId": "p192",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i193",
        "productId": "p193",
        "currentQuantity": 27.47,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i194",
        "productId": "p194",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i195",
        "productId": "p195",
        "currentQuantity": 4,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i196",
        "productId": "p196",
        "currentQuantity": 12,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i197",
        "productId": "p197",
        "currentQuantity": 13,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i198",
        "productId": "p198",
        "currentQuantity": 300,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i199",
        "productId": "p199",
        "currentQuantity": 155,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i200",
        "productId": "p200",
        "currentQuantity": 6050,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i201",
        "productId": "p201",
        "currentQuantity": 100,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i202",
        "productId": "p202",
        "currentQuantity": 4000,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i203",
        "productId": "p203",
        "currentQuantity": 8,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i204",
        "productId": "p204",
        "currentQuantity": 1400,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i205",
        "productId": "p205",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i206",
        "productId": "p206",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i207",
        "productId": "p207",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i208",
        "productId": "p208",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i209",
        "productId": "p209",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i210",
        "productId": "p210",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i211",
        "productId": "p211",
        "currentQuantity": 700,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i212",
        "productId": "p212",
        "currentQuantity": 400,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i213",
        "productId": "p213",
        "currentQuantity": 48,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i214",
        "productId": "p214",
        "currentQuantity": 21,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i215",
        "productId": "p215",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i216",
        "productId": "p216",
        "currentQuantity": 1900,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i217",
        "productId": "p217",
        "currentQuantity": 575,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i218",
        "productId": "p218",
        "currentQuantity": 50,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i219",
        "productId": "p219",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i220",
        "productId": "p220",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i221",
        "productId": "p221",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i222",
        "productId": "p222",
        "currentQuantity": 200,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i223",
        "productId": "p223",
        "currentQuantity": 400,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i224",
        "productId": "p224",
        "currentQuantity": 294,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i225",
        "productId": "p225",
        "currentQuantity": 3500,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i226",
        "productId": "p226",
        "currentQuantity": 1450,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i227",
        "productId": "p227",
        "currentQuantity": 1750,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i228",
        "productId": "p228",
        "currentQuantity": 1190,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i229",
        "productId": "p229",
        "currentQuantity": 20,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i230",
        "productId": "p230",
        "currentQuantity": 1270,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i231",
        "productId": "p231",
        "currentQuantity": 209,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i232",
        "productId": "p232",
        "currentQuantity": 250,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i233",
        "productId": "p233",
        "currentQuantity": 150,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i234",
        "productId": "p234",
        "currentQuantity": 9,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i235",
        "productId": "p235",
        "currentQuantity": 27,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i236",
        "productId": "p236",
        "currentQuantity": 677,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i237",
        "productId": "p237",
        "currentQuantity": 250,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i238",
        "productId": "p238",
        "currentQuantity": 9,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i239",
        "productId": "p239",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i240",
        "productId": "p240",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i241",
        "productId": "p241",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i242",
        "productId": "p242",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i243",
        "productId": "p243",
        "currentQuantity": 200,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i244",
        "productId": "p244",
        "currentQuantity": 2,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i245",
        "productId": "p245",
        "currentQuantity": 4,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i246",
        "productId": "p246",
        "currentQuantity": 2,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i247",
        "productId": "p247",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i248",
        "productId": "p248",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i249",
        "productId": "p249",
        "currentQuantity": 50,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i250",
        "productId": "p250",
        "currentQuantity": 1,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i251",
        "productId": "p251",
        "currentQuantity": 1,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i252",
        "productId": "p252",
        "currentQuantity": 0.4,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i253",
        "productId": "p253",
        "currentQuantity": 1.825,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i254",
        "productId": "p254",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i255",
        "productId": "p255",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i256",
        "productId": "p256",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i257",
        "productId": "p257",
        "currentQuantity": 27,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i258",
        "productId": "p258",
        "currentQuantity": 22.5,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i259",
        "productId": "p259",
        "currentQuantity": 170,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i260",
        "productId": "p260",
        "currentQuantity": 260,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i261",
        "productId": "p261",
        "currentQuantity": 1.4,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i262",
        "productId": "p262",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i263",
        "productId": "p263",
        "currentQuantity": 3.84,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i264",
        "productId": "p264",
        "currentQuantity": 3,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i265",
        "productId": "p265",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i266",
        "productId": "p266",
        "currentQuantity": 0.455,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i267",
        "productId": "p267",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i268",
        "productId": "p268",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i269",
        "productId": "p269",
        "currentQuantity": 48,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i270",
        "productId": "p270",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i271",
        "productId": "p271",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i272",
        "productId": "p272",
        "currentQuantity": 2.375,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i273",
        "productId": "p273",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i274",
        "productId": "p274",
        "currentQuantity": 2.5,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i275",
        "productId": "p275",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i276",
        "productId": "p276",
        "currentQuantity": 4,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i277",
        "productId": "p277",
        "currentQuantity": 3,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i278",
        "productId": "p278",
        "currentQuantity": 3.34,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i279",
        "productId": "p279",
        "currentQuantity": 5,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i280",
        "productId": "p280",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i281",
        "productId": "p281",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i282",
        "productId": "p282",
        "currentQuantity": 3.2,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i283",
        "productId": "p283",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i284",
        "productId": "p284",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i285",
        "productId": "p285",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i286",
        "productId": "p286",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i287",
        "productId": "p287",
        "currentQuantity": 0.68,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i288",
        "productId": "p288",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i289",
        "productId": "p289",
        "currentQuantity": 4.9,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i290",
        "productId": "p290",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i291",
        "productId": "p291",
        "currentQuantity": 6,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i292",
        "productId": "p292",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i293",
        "productId": "p293",
        "currentQuantity": 24,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i294",
        "productId": "p294",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i295",
        "productId": "p295",
        "currentQuantity": 72,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i296",
        "productId": "p296",
        "currentQuantity": 24,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i297",
        "productId": "p297",
        "currentQuantity": 2316,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i298",
        "productId": "p298",
        "currentQuantity": 34,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i299",
        "productId": "p299",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i300",
        "productId": "p300",
        "currentQuantity": 29.69,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i301",
        "productId": "p301",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i302",
        "productId": "p302",
        "currentQuantity": 1,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i303",
        "productId": "p303",
        "currentQuantity": 1,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i304",
        "productId": "p304",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i305",
        "productId": "p305",
        "currentQuantity": 1,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i306",
        "productId": "p306",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i307",
        "productId": "p307",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i308",
        "productId": "p308",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i309",
        "productId": "p309",
        "currentQuantity": 19.6,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i310",
        "productId": "p310",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i311",
        "productId": "p311",
        "currentQuantity": 3,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i312",
        "productId": "p312",
        "currentQuantity": 655,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i313",
        "productId": "p313",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i314",
        "productId": "p314",
        "currentQuantity": 95,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i315",
        "productId": "p315",
        "currentQuantity": 300,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i316",
        "productId": "p316",
        "currentQuantity": 1800,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i317",
        "productId": "p317",
        "currentQuantity": 950,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i318",
        "productId": "p318",
        "currentQuantity": 1850,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i319",
        "productId": "p319",
        "currentQuantity": 7,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i320",
        "productId": "p320",
        "currentQuantity": 200,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i321",
        "productId": "p321",
        "currentQuantity": 500,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i322",
        "productId": "p322",
        "currentQuantity": 14.17,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i323",
        "productId": "p323",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i324",
        "productId": "p324",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i325",
        "productId": "p325",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i326",
        "productId": "p326",
        "currentQuantity": 3.7,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i327",
        "productId": "p327",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i328",
        "productId": "p328",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i329",
        "productId": "p329",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i330",
        "productId": "p330",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i331",
        "productId": "p331",
        "currentQuantity": 5.13,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i332",
        "productId": "p332",
        "currentQuantity": 0.71,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i333",
        "productId": "p333",
        "currentQuantity": 4.935,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i334",
        "productId": "p334",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i335",
        "productId": "p335",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i336",
        "productId": "p336",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i337",
        "productId": "p337",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i338",
        "productId": "p338",
        "currentQuantity": 0.1,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i339",
        "productId": "p339",
        "currentQuantity": 0.315,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i340",
        "productId": "p340",
        "currentQuantity": 18,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i341",
        "productId": "p341",
        "currentQuantity": 3.47,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i342",
        "productId": "p342",
        "currentQuantity": 0.08,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i343",
        "productId": "p343",
        "currentQuantity": 0.975,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i344",
        "productId": "p344",
        "currentQuantity": 4,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i345",
        "productId": "p345",
        "currentQuantity": 1,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i346",
        "productId": "p346",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i347",
        "productId": "p347",
        "currentQuantity": 2.8,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i348",
        "productId": "p348",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i349",
        "productId": "p349",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i350",
        "productId": "p350",
        "currentQuantity": 0.5,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i351",
        "productId": "p351",
        "currentQuantity": 1.82,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i352",
        "productId": "p352",
        "currentQuantity": 1.52,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i353",
        "productId": "p353",
        "currentQuantity": 0.045,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i354",
        "productId": "p354",
        "currentQuantity": 0.1,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i355",
        "productId": "p355",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i356",
        "productId": "p356",
        "currentQuantity": 5,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i357",
        "productId": "p357",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i358",
        "productId": "p358",
        "currentQuantity": 9,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i359",
        "productId": "p359",
        "currentQuantity": 1.4,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i360",
        "productId": "p360",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i361",
        "productId": "p361",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i362",
        "productId": "p362",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i363",
        "productId": "p363",
        "currentQuantity": 2,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i364",
        "productId": "p364",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i365",
        "productId": "p365",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i366",
        "productId": "p366",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i367",
        "productId": "p367",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i368",
        "productId": "p368",
        "currentQuantity": 10,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i369",
        "productId": "p369",
        "currentQuantity": 12,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i370",
        "productId": "p370",
        "currentQuantity": 500,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i371",
        "productId": "p371",
        "currentQuantity": 61,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i372",
        "productId": "p372",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i373",
        "productId": "p373",
        "currentQuantity": 8,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i374",
        "productId": "p374",
        "currentQuantity": 25,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i375",
        "productId": "p375",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i376",
        "productId": "p376",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i377",
        "productId": "p377",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i378",
        "productId": "p378",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i379",
        "productId": "p379",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i380",
        "productId": "p380",
        "currentQuantity": 1.4,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i381",
        "productId": "p381",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i382",
        "productId": "p382",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i383",
        "productId": "p383",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i384",
        "productId": "p384",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i385",
        "productId": "p385",
        "currentQuantity": 6,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i386",
        "productId": "p386",
        "currentQuantity": 14,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i387",
        "productId": "p387",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i388",
        "productId": "p388",
        "currentQuantity": 1,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i389",
        "productId": "p389",
        "currentQuantity": 4,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i390",
        "productId": "p390",
        "currentQuantity": 5,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i391",
        "productId": "p391",
        "currentQuantity": 3,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i392",
        "productId": "p392",
        "currentQuantity": 4,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i393",
        "productId": "p393",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i394",
        "productId": "p394",
        "currentQuantity": 10.155,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i395",
        "productId": "p395",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i396",
        "productId": "p396",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i397",
        "productId": "p397",
        "currentQuantity": 0.7,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i398",
        "productId": "p398",
        "currentQuantity": 0.7,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i399",
        "productId": "p399",
        "currentQuantity": 1.4,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i400",
        "productId": "p400",
        "currentQuantity": 1.4,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i401",
        "productId": "p401",
        "currentQuantity": 1.4,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i402",
        "productId": "p402",
        "currentQuantity": 3,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i403",
        "productId": "p403",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i404",
        "productId": "p404",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i405",
        "productId": "p405",
        "currentQuantity": 8,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i406",
        "productId": "p406",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i407",
        "productId": "p407",
        "currentQuantity": 1.2,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i408",
        "productId": "p408",
        "currentQuantity": 3.06,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i409",
        "productId": "p409",
        "currentQuantity": 960,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i410",
        "productId": "p410",
        "currentQuantity": 960,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i411",
        "productId": "p411",
        "currentQuantity": 960,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i412",
        "productId": "p412",
        "currentQuantity": 300,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i413",
        "productId": "p413",
        "currentQuantity": 760,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i414",
        "productId": "p414",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i415",
        "productId": "p415",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i416",
        "productId": "p416",
        "currentQuantity": 1.5,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i417",
        "productId": "p417",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i418",
        "productId": "p418",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i419",
        "productId": "p419",
        "currentQuantity": 7.6,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i420",
        "productId": "p420",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i421",
        "productId": "p421",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i422",
        "productId": "p422",
        "currentQuantity": 0.8,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i423",
        "productId": "p423",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i424",
        "productId": "p424",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i425",
        "productId": "p425",
        "currentQuantity": 0.8,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    },
    {
        "id": "i426",
        "productId": "p426",
        "currentQuantity": 0,
        "minimumQuantity": 0,
        "criticalQuantity": 0
    }
];

export const cafeOrders: CafeOrder[] = [];

export const orderItems: OrderItem[] = [];

export const stockMovements: StockMovement[] = [];
