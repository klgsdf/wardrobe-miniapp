import re

# ===== 1. ai-outfit.wxml =====
wxml_path = r'e:/Vibe Coding/demo/wardrobe-miniapp/pages/ai-outfit/ai-outfit.wxml'
with open(wxml_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('scroll-into-view={{scrollIntoView}} scroll-with-animation', '')

pattern_analysis = r'\n\s*<!-- AI Image Analysis Result -->.*?<!-- Recommendations Result -->'
content = re.sub(pattern_analysis, '\n\n    <!-- Recommendations Result -->', content, flags=re.DOTALL)

pattern_recs = r'\n\s*<!-- Recommendations Result -->.*?<!-- Spacer -->'
content = re.sub(pattern_recs, '\n\n    <!-- Spacer -->', content, flags=re.DOTALL)

pattern_sheet = r'\n\s*<!-- Item Detail Bottom Sheet -->.*$'
content = re.sub(pattern_sheet, '', content, flags=re.DOTALL)

content = re.sub(r'\n{3,}', '\n\n', content)

with open(wxml_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('1. WXML OK')
