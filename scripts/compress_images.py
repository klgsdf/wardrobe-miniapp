"""压缩项目图片，使总包体积低于 2MB"""
import os
from PIL import Image

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGES_DIR = os.path.join(BASE, 'images')

def compress_jpg(path, max_width=750, quality=75):
    """压缩 JPEG，限制宽度和质量"""
    img = Image.open(path)
    w, h = img.size
    if w > max_width:
        ratio = max_width / w
        new_w = max_width
        new_h = int(h * ratio)
        img = img.resize((new_w, new_h), Image.LANCZOS)
    img.save(path, 'JPEG', quality=quality, optimize=True)
    new_size = os.path.getsize(path)
    return new_size

def convert_png_to_jpg(png_path, jpg_path, max_width=750, quality=75):
    """将 PNG 转为 JPEG（大幅减小体积）"""
    img = Image.open(png_path).convert('RGB')  # 去掉 alpha 通道
    w, h = img.size
    if w > max_width:
        ratio = max_width / w
        new_w = max_width
        new_h = int(h * ratio)
        img = img.resize((new_w, new_h), Image.LANCZOS)
    img.save(jpg_path, 'JPEG', quality=quality, optimize=True)
    return os.path.getsize(jpg_path)

def compress_png(path, max_width=400):
    """压缩 PNG（图标类，保持透明）"""
    img = Image.open(path)
    w, h = img.size
    if w > max_width:
        ratio = max_width / w
        new_w = max_width
        new_h = int(h * ratio)
        img = img.resize((new_w, new_h), Image.LANCZOS)
    img.save(path, 'PNG', optimize=True)
    return os.path.getsize(path)

# ===== 1. 最大文件：bg-ai-outfit.png → bg-ai-outfit.jpg =====
print('=== 转换 bg-ai-outfit.png → .jpg ===')
png_path = os.path.join(IMAGES_DIR, 'bg-ai-outfit.png')
jpg_path = os.path.join(IMAGES_DIR, 'bg-ai-outfit.jpg')
old_size = os.path.getsize(png_path)
new_size = convert_png_to_jpg(png_path, jpg_path, max_width=750, quality=75)
print(f'  {old_size/1024:.0f}KB → {new_size/1024:.0f}KB (节省 {(old_size-new_size)/1024:.0f}KB)')
# 删除原 PNG
os.remove(png_path)
print('  已删除原 PNG 文件')

# ===== 2. 压缩背景图 =====
print('\n=== 压缩背景图 ===')
for name in ['bg-cream.jpg', 'bg-mint.jpg', 'bg-haze-blue.jpg', 'bg-graphite.jpg', 'bg-sakura.jpg', 'bg-closet.jpg']:
    path = os.path.join(IMAGES_DIR, name)
    if os.path.exists(path):
        old = os.path.getsize(path)
        new = compress_jpg(path, max_width=750, quality=72)
        print(f'  {name}: {old/1024:.0f}KB → {new/1024:.0f}KB')

# ===== 3. 压缩衣物图片 =====
print('\n=== 压缩衣物图片 ===')
for name in ['cloth-1.jpg', 'cloth-2.jpg', 'cloth-3.jpg', 'cloth-4.jpg', 'cloth-5.jpg', 'cloth-6.jpg']:
    path = os.path.join(IMAGES_DIR, name)
    if os.path.exists(path):
        old = os.path.getsize(path)
        new = compress_jpg(path, max_width=500, quality=72)
        print(f'  {name}: {old/1024:.0f}KB → {new/1024:.0f}KB')

# ===== 4. 压缩搭配缩略图 =====
print('\n=== 压缩搭配缩略图 ===')
for name in ['outfit-thumb-1.jpg', 'outfit-thumb-2.jpg', 'outfit-thumb-3.jpg']:
    path = os.path.join(IMAGES_DIR, name)
    if os.path.exists(path):
        old = os.path.getsize(path)
        new = compress_jpg(path, max_width=300, quality=72)
        print(f'  {name}: {old/1024:.0f}KB → {new/1024:.0f}KB')

# ===== 5. 压缩天气图 =====
print('\n=== 压缩天气图 ===')
for name in ['weather-sunny.jpg', 'weather-cloudy.jpg', 'weather-rain.jpg']:
    path = os.path.join(IMAGES_DIR, name)
    if os.path.exists(path):
        old = os.path.getsize(path)
        new = compress_jpg(path, max_width=500, quality=72)
        print(f'  {name}: {old/1024:.0f}KB → {new/1024:.0f}KB')

# ===== 6. 压缩大 PNG 图标 =====
print('\n=== 压缩 PNG 图标 ===')
for name in os.listdir(IMAGES_DIR):
    if name.endswith('.png'):
        path = os.path.join(IMAGES_DIR, name)
        old = os.path.getsize(path)
        if old > 2048:  # 只处理 > 2KB 的
            new = compress_png(path, max_width=200)
            print(f'  {name}: {old/1024:.0f}KB → {new/1024:.0f}KB')

# ===== 汇总 =====
print('\n=== 汇总 ===')
total = 0
for name in sorted(os.listdir(IMAGES_DIR)):
    path = os.path.join(IMAGES_DIR, name)
    if os.path.isfile(path):
        size = os.path.getsize(path)
        total += size
        if size > 1024:
            print(f'  {size/1024:6.1f}KB  {name}')
print(f'\n  图片总大小: {total/1024:.0f}KB ({total/1024/1024:.1f}MB)')
