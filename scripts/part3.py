import re, os
wxss_path = 'e:/Vibe Coding/demo/wardrobe-miniapp/pages/ai-outfit/ai-outfit.wxss'
with open(wxss_path, 'r', encoding='utf-8') as f:
    c = f.read()
c = re.sub(r'\n/\* ===== Result Section ===== \*/.+$', '\n', c, flags=re.DOTALL)
with open(wxss_path, 'w', encoding='utf-8') as f:
    f.write(c)
print('WXSS done')