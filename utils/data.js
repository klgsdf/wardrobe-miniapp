// ===== 全局数据与常量 =====

/** 主题名称列表 */
const THEME_OPTIONS = [
  { value: 'cream-morandi', label: '奶油莫兰迪', desc: '冬日暖阳下的燕麦拿铁', keywords: '暖棕、治愈、复古、柔软', color: '#B08968', bgColor: '#F5F1E8' },
  { value: 'mint-latte', label: '薄荷拿铁', desc: '春日清晨的一杯奶绿', keywords: '薄荷绿、清新、自然、呼吸感', color: '#7DB9A8', bgColor: '#FFFBF5' },
  { value: 'haze-blue', label: '雾霾蓝', desc: '雨后初晴的天空', keywords: '氧气蓝、清透、静谧、冷感', color: '#8ECAE6', bgColor: '#F8FBFF' },
  { value: 'graphite-tangerine', label: '石墨橙光', desc: '都市日落时分的活力', keywords: '亮橙、现代、极简、扁平', color: '#F97316', bgColor: '#F3F4F6' },
  { value: 'sakura-pink', label: '浪漫樱花', desc: '樱花树下的粉色气泡', keywords: '樱花粉、柔美、甜美、少女心', color: '#FFB7C5', bgColor: '#FFF5F7' },
];

/** 风格选项 */
const STYLE_OPTIONS = ['休闲', '正式', '运动', '甜美', '简约', '复古', '街头', '职场'];

/** 季节选项 */
const SEASON_OPTIONS = ['春', '夏', '秋', '冬'];

/** 分类配置 */
const CATEGORY_CONFIG = {
  '上衣': { icon: 'Shirt', subCategories: ['T恤', '衬衫', '卫衣', '毛衣', '外套', '西装', '马甲', '风衣'] },
  '下装': { icon: 'Minus', subCategories: ['裤子', '半身裙', '短裤', '打底裤'] },
  '全身装': { icon: 'PersonStanding', subCategories: ['连衣裙', '连体衣', '睡衣套装'] },
  '内衣类': { icon: 'Heart', subCategories: ['文胸', '内裤', '保暖衣', '秋衣秋裤', '打底衫'] },
  '配饰服饰': { icon: 'Sparkles', subCategories: ['帽子', '围巾', '袜子', '手套', '腰带'] },
  '鞋类': { icon: 'Footprints', subCategories: ['休闲鞋', '运动鞋', '皮鞋', '女士时装鞋', '靴子', '拖鞋'] },
};

/** 分区类型 */
const ZONE_TYPES = [
  { name: '隔板层', icon: 'Layers', desc: '叠放衣物' },
  { name: '挂衣区', icon: 'Hanger', desc: '悬挂衣物' },
  { name: '抽屉', icon: 'Archive', desc: '小件收纳' },
  { name: '收纳盒', icon: 'Box', desc: '分类存放' },
  { name: '鞋区', icon: 'Footprints', desc: '鞋履存放' },
];

/** 初始衣柜数据 */
const INITIAL_WARDROBES = [
  {
    id: 'w1', name: '主柜1', description: '季节', type: '主柜',
    icon: 'Cabinet', zoneCount: 5, itemCount: 0,
    zones: [],
  },
  {
    id: 'w2', name: '主柜', description: '日常衣物存放', type: '主柜',
    icon: 'Cabinet', zoneCount: 3, itemCount: 2,
    zones: [],
  },
  {
    id: 'w3', name: '鞋柜', description: '鞋子收纳', type: '鞋柜',
    icon: 'Footprints', zoneCount: 2, itemCount: 2,
    zones: [],
  },
  {
    id: 'w4', name: '配饰抽屉', description: '围巾、帽子、腰带', type: '抽屉',
    icon: 'Sparkles', zoneCount: 3, itemCount: 2,
    zones: [],
  },
];

/** 初始衣物数据 */
const INITIAL_CLOTHING_ITEMS = [
  {
    id: 'c1', name: '休闲棒球帽', image: '/images/cloth-1.jpg',
    category: '配饰服饰', subCategory: '帽子', colors: ['#2D2D2D'], seasons: ['春', '夏', '秋'], style: '休闲',
    zoneId: '', wardrobeId: 'w1',
  },
  {
    id: 'c2', name: '粉色碎花连衣裙', image: '/images/cloth-2.jpg',
    category: '全身装', subCategory: '连衣裙', colors: ['#F06292'], seasons: ['春', '夏'], style: '甜美',
    zoneId: '', wardrobeId: 'w1',
  },
  {
    id: 'c3', name: '浅色牛仔裤', image: '/images/cloth-3.jpg',
    category: '下装', subCategory: '裤子', colors: ['#42A5F5'], seasons: ['春', '夏', '秋', '冬'], style: '简约',
    zoneId: '', wardrobeId: 'w2',
  },
  {
    id: 'c4', name: '白色T恤', image: '/images/cloth-4.jpg',
    category: '上衣', subCategory: 'T恤', colors: ['#F5F5F5'], seasons: ['春', '夏'], style: '简约',
    zoneId: '', wardrobeId: 'w2',
  },
  {
    id: 'c5', name: '米色风衣', image: '/images/cloth-5.jpg',
    category: '上衣', subCategory: '风衣', colors: ['#F5DEB3'], seasons: ['春', '秋'], style: '职场',
    zoneId: '', wardrobeId: 'w1',
  },
  {
    id: 'c6', name: '运动卫衣', image: '/images/cloth-6.jpg',
    category: '上衣', subCategory: '卫衣', colors: ['#9E9E9E'], seasons: ['春', '秋', '冬'], style: '运动',
    zoneId: '', wardrobeId: 'w2',
  },
];

/** 初始日记数据 */
const INITIAL_DIARY_OUTFITS = [
  {
    id: 'd1', name: '休闲帽搭配', photos: ['/images/outfit-thumb-1.jpg'], style: '休闲',
    note: '适合周末逛街', clothingItemIds: ['c1'], date: '2026-05-17',
  },
  {
    id: 'd2', name: '甜美约会装', photos: ['/images/outfit-thumb-2.jpg'], style: '甜美',
    note: '约会穿搭', clothingItemIds: ['c2'], date: '2026-05-16',
  },
  {
    id: 'd3', name: '日常简约风', photos: ['/images/outfit-thumb-3.jpg'], style: '简约',
    note: '日常通勤', clothingItemIds: ['c3'], date: '2026-05-15',
  },
];

/** 主题背景配置 */
const THEME_BACKGROUNDS = {
  'cream-morandi': { presets: ['/images/bg-cream.jpg'], custom: [], activeIndex: 0 },
  'mint-latte': { presets: ['/images/bg-mint.jpg'], custom: [], activeIndex: 0 },
  'haze-blue': { presets: ['/images/bg-haze-blue.jpg'], custom: [], activeIndex: 0 },
  'graphite-tangerine': { presets: ['/images/bg-graphite.jpg'], custom: [], activeIndex: 0 },
  'sakura-pink': { presets: ['/images/bg-sakura.jpg'], custom: [], activeIndex: 0 },
};

/** 背景选项配置（按主题分组） */
const BG_OPTIONS = {
  'cream-morandi': [
    { value: 'bg-cream', label: '奶油纹理', image: '/images/bg-cream.jpg' },
  ],
  'mint-latte': [
    { value: 'bg-mint', label: '薄荷清新', image: '/images/bg-mint.jpg' },
  ],
  'haze-blue': [
    { value: 'bg-haze', label: '雾霾蓝调', image: '/images/bg-haze-blue.jpg' },
  ],
  'graphite-tangerine': [
    { value: 'bg-graphite', label: '石墨质感', image: '/images/bg-graphite.jpg' },
  ],
  'sakura-pink': [
    { value: 'bg-sakura', label: '樱花浪漫', image: '/images/bg-sakura.jpg' },
  ],
};

/** 默认应用状态 */
function getDefaultState() {
  return {
    theme: 'cream-morandi',
    bgImage: '/images/bg-cream.jpg',
    wardrobeName: '胖胖子的衣柜',
    city: '广州市',
    weather: '小毛毛雨',
    temperature: 24,
    greeting: '晚上好,',
    userNickname: '胖胖子',
    outfitCount: 5,
    monthlyWorn: 4,
    idleCount: 1,
    idleDays: 30,
    activeNavIndex: 0,
    wardrobes: JSON.parse(JSON.stringify(INITIAL_WARDROBES)),
    clothingItems: JSON.parse(JSON.stringify(INITIAL_CLOTHING_ITEMS)),
    diaryOutfits: JSON.parse(JSON.stringify(INITIAL_DIARY_OUTFITS)),
    backgrounds: JSON.parse(JSON.stringify(THEME_BACKGROUNDS)),
  };
}

module.exports = {
  THEME_OPTIONS,
  STYLE_OPTIONS,
  SEASON_OPTIONS,
  CATEGORY_CONFIG,
  ZONE_TYPES,
  INITIAL_WARDROBES,
  INITIAL_CLOTHING_ITEMS,
  INITIAL_DIARY_OUTFITS,
  THEME_BACKGROUNDS,
  BG_OPTIONS,
  getDefaultState,
};
