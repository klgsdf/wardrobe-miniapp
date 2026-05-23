import re, os

# WXML modifications
wxml_path = 'e:/Vibe Coding/demo/wardrobe-miniapp/pages/ai-outfit/ai-outfit.wxml'
with open(wxml_path, 'r', encoding='utf-8') as f:
    c = f.read()

# Remove scroll-into-view attribute
old = 'scroll-into-view=' + chr(34) + '{{scrollIntoView}}' + chr(34) + ' scroll-with-animation'
c = c.replace(old, '')

# Remove result sections
c = re.sub(r'\n\s*<!-- AI Image Analysis Result -->.*?<!-- Spacer -->', '\n\n    <!-- Spacer -->', c, flags=re.DOTALL)
c = re.sub(r'\n\s*<!-- Item Detail Bottom Sheet -->.*$', '', c, flags=re.DOTALL)
c = re.sub(r'\n{3,}', '\n\n', c)

with open(wxml_path, 'w', encoding='utf-8') as f:
    f.write(c)
print('WXML done')