"""
Draw Lucide-style icons using Pillow
Generates high-quality PNG icons matching Caelum UI design
"""
from PIL import Image, ImageDraw
import os

OUTPUT_SIZE = 60  # 20x20 * 3 for retina
STROKE_WIDTH = 3  # 2 * 1.5 for retina

ICON_COLORS = {
    'home': '#7A6E62',
    'calendar': '#7A6E62',
    'shirt': '#7A6E62',
    'layout-grid': '#7A6E62',
    'grid': '#7A6E62',
    'settings': '#7A6E62',
    'sparkles': '#7A6E62',
    'cloud': '#7A6E62',
    'chevron-down': '#9C8E82',
    'chevron-right': '#9C8E82',
    'icon-back': '#7A6E62',
    'icon-calendar': '#9C8E82',
}

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def create_icon(name, color_hex, size=60):
    """Create a Lucide-style icon"""
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    color = hex_to_rgb(color_hex)
    sw = max(2, int(size / 10))  # stroke width scaled
    
    # Scale factor: viewBox 24x24 -> output size
    s = size / 24
    
    def x(v): return v * s
    def y(v): return v * s
    
    if name == 'home':
        # House shape: roof + walls
        roof = [(x(3), y(9)), (x(12), y(2)), (x(21), y(9))]
        draw.line(roof, fill=color, width=sw, joint='curve')
        # Walls
        draw.line([(x(5), y(9)), (x(5), y(20)), (x(19), y(20)), (x(19), y(9))], 
                  fill=color, width=sw, joint='curve')
        # Door
        draw.line([(x(9), y(20)), (x(9), y(12)), (x(15), y(12)), (x(15), y(20))], 
                  fill=color, width=sw, joint='curve')
    
    elif name == 'calendar':
        # Calendar body
        draw.rounded_rectangle([x(4), y(4), x(20), y(20)], radius=x(2), 
                               outline=color, width=sw)
        # Top line
        draw.line([(x(4), y(10)), (x(20), y(10))], fill=color, width=sw)
        # Hooks
        draw.line([(x(8), y(2)), (x(8), y(6))], fill=color, width=sw)
        draw.line([(x(16), y(2)), (x(16), y(6))], fill=color, width=sw)
    
    elif name == 'shirt':
        # T-shirt shape
        points = [
            (x(8), y(2)), (x(16), y(2)),  # shoulders
            (x(20), y(6)), (x(20), y(10)),  # right sleeve
            (x(16), y(10)), (x(16), y(20)),  # right side
            (x(8), y(20)),  # bottom
            (x(8), y(10)), (x(4), y(10)),  # left sleeve
            (x(4), y(6)),  # left shoulder
        ]
        draw.line(points + [points[0]], fill=color, width=sw, joint='curve')
    
    elif name in ('layout-grid', 'grid'):
        # 2x2 grid
        gap = x(1)
        cell = x(7)
        positions = [
            (x(3), y(3), x(3)+cell, y(3)+cell),
            (x(14), y(3), x(14)+cell, y(3)+cell),
            (x(14), y(14), x(14)+cell, y(14)+cell),
            (x(3), y(14), x(3)+cell, y(14)+cell),
        ]
        for box in positions:
            draw.rounded_rectangle(box, radius=x(1), outline=color, width=sw)
    
    elif name == 'settings':
        # Gear with center circle
        cx, cy = x(12), y(12)
        r_outer = x(8)
        r_inner = x(5)
        r_center = x(3)
        
        # Draw 8 gear teeth as lines
        import math
        for i in range(8):
            angle = math.radians(i * 45)
            x1 = cx + r_inner * math.cos(angle)
            y1 = cy + r_inner * math.sin(angle)
            x2 = cx + r_outer * math.cos(angle)
            y2 = cy + r_outer * math.sin(angle)
            draw.line([(x1, y1), (x2, y2)], fill=color, width=sw)
        
        # Connect teeth with arcs (approximated as short lines)
        for i in range(8):
            a1 = math.radians(i * 45 + 15)
            a2 = math.radians(i * 45 + 30)
            draw.arc([cx-r_outer, cy-r_outer, cx+r_outer, cy+r_outer], 
                     start=i*45+15, end=i*45+30, fill=color, width=sw)
        
        # Center circle
        draw.ellipse([cx-r_center, cy-r_center, cx+r_center, cy+r_center], 
                     outline=color, width=sw)
    
    elif name == 'sparkles':
        # 4-point star
        cx, cy = x(12), y(12)
        import math
        points = []
        for i in range(8):
            angle = math.radians(i * 45 - 90)
            r = x(9) if i % 2 == 0 else x(3)
            points.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
        draw.line(points + [points[0]], fill=color, width=sw, joint='curve')
    
    elif name == 'cloud':
        # Cloud shape using ellipses
        draw.ellipse([x(6), y(10), x(14), y(18)], outline=color, width=sw)
        draw.ellipse([x(10), y(6), x(18), y(14)], outline=color, width=sw)
        draw.ellipse([x(2), y(8), x(10), y(16)], outline=color, width=sw)
        # Bottom line to close
        draw.line([(x(6), y(17)), (x(14), y(17))], fill=color, width=sw)
    
    elif name == 'chevron-down':
        draw.line([(x(6), y(8)), (x(12), y(14)), (x(18), y(8))], 
                  fill=color, width=sw, joint='curve')
    
    elif name == 'chevron-right':
        draw.line([(x(8), y(6)), (x(14), y(12)), (x(8), y(18))], 
                  fill=color, width=sw, joint='curve')
    
    elif name == 'icon-back':
        # Chevron left
        draw.line([(x(15), y(6)), (x(9), y(12)), (x(15), y(18))], 
                  fill=color, width=sw, joint='curve')
    
    elif name == 'icon-calendar':
        # Same as calendar but smaller visual weight
        draw.rounded_rectangle([x(4), y(4), x(20), y(20)], radius=x(2), 
                               outline=color, width=sw)
        draw.line([(x(4), y(10)), (x(20), y(10))], fill=color, width=sw)
        draw.line([(x(8), y(2)), (x(8), y(6))], fill=color, width=sw)
        draw.line([(x(16), y(2)), (x(16), y(6))], fill=color, width=sw)
    
    return img

def main():
    images_dir = os.path.join(os.path.dirname(__file__), '..', 'images')
    
    for name, color in ICON_COLORS.items():
        png_path = os.path.join(images_dir, f'{name}.png')
        print(f"Drawing: {name}.png (color: {color})")
        
        img = create_icon(name, color, OUTPUT_SIZE)
        img.save(png_path, 'PNG')
        
        size = os.path.getsize(png_path)
        print(f"  ✓ Saved ({size} bytes)")
    
    print("\nDone!")

if __name__ == '__main__':
    main()
