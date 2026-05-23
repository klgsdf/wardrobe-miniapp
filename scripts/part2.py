import re, os

js_path = 'e:/Vibe Coding/demo/wardrobe-miniapp/pages/ai-outfit/ai-outfit.js'
with open(js_path, 'r', encoding='utf-8') as f:
    c = f.read()

old_data = '    imageAnalysisResult: null,  // ' + chr(22270) + chr(29255) + ' AI ' + chr(20998) + chr(26512) + chr(32467) + chr(26524) + '\n    recommendations: [],\n    scrollIntoView: ' + chr(39)*2 + ',         // ' + chr(28378) + chr(21160) + chr(23450) + chr(20301) + '\n    expandedRecId: null,\n    clothingItems: [],\n    showItemDetailSheet: false,\n    detailItem: null,\n    detailWardrobeName: ' + chr(39)*2 + ',\n    detailZoneName: ' + chr(39)*2 + ','
new_data = '    imageAnalysisResult: null,  // ' + chr(22270) + chr(29255) + ' AI ' + chr(20998) + chr(26512) + chr(32467) + chr(26524) + chr(65288) + chr(26242) + chr(23384) + chr(65292) + chr(36339) + chr(36716) + chr(26102) + chr(20256) + chr(36882) + chr(65289) + '\n    clothingItems: [],'
c = c.replace(old_data, new_data)

old_reset = '      recommendations: [],\n      imageAnalysisResult: null,\n      expandedRecId: null,\n      isAnalyzing: false,\n      analysisStep: 0,\n      scrollIntoView: ' + chr(39)*2 + ','
new_reset = '      isAnalyzing: false,\n      analysisStep: 0,\n      imageAnalysisResult: null,'
c = c.replace(old_reset, new_reset)

old_submit = '      recommendations: [],\n      imageAnalysisResult: null,\n      expandedRecId: null,'
new_submit = '      imageAnalysisResult: null,'
c = c.replace(old_submit, new_submit)

old_build = '    this.setData({\n      recommendations: recommendations,\n      isAnalyzing: false,\n      analysisStep: 3,\n      scrollIntoView: ' + chr(39) + 'resultSection' + chr(39) + ',\n    });\n    wx.showToast({ title: ' + chr(39) + chr(20998) + chr(26512) + chr(23436) + chr(25104) + chr(39) + ', icon: ' + chr(39) + 'none' + chr(39) + ' });'
new_build = '    \n    app.globalData.aiResultData = {\n      imageAnalysisResult: this.data.imageAnalysisResult,\n      recommendations: recommendations,\n    };\n    this.setData({ isAnalyzing: false, analysisStep: 3 });\n    wx.navigateTo({ url: ' + chr(39) + '/pages/ai-result/ai-result' + chr(39) + ' });'
c = c.replace(old_build, new_build)

old_fb = '    this.setData({\n      recommendations: recommendations,\n      isAnalyzing: false,\n      analysisStep: 3,\n      scrollIntoView: ' + chr(39) + 'resultSection' + chr(39) + ',\n    });\n    wx.showToast({ title: ' + chr(39) + chr(20998) + chr(26512) + chr(23436) + chr(25104) + chr(65288) + chr(31163) + chr(32447) + chr(27169) + chr(24335) + chr(65289) + chr(39) + ', icon: ' + chr(39) + 'none' + chr(39) + ' });'
new_fb = '    \n    app.globalData.aiResultData = {\n      imageAnalysisResult: this.data.imageAnalysisResult,\n      recommendations: recommendations,\n    };\n    this.setData({ isAnalyzing: false, analysisStep: 3 });\n    wx.navigateTo({ url: ' + chr(39) + '/pages/ai-result/ai-result' + chr(39) + ' });'
c = c.replace(old_fb, new_fb)

old_methods_start = '  // ===== ' + chr(20132) + chr(20114) + ' ====='
idx = c.find(old_methods_start)
if idx >= 0:
    end_marker = '  goBack() { wx.navigateBack(); },'
    end_idx = c.find(end_marker)
    if end_idx > idx:
        c = c[:idx] + c[end_idx:]

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(c)
print('JS done')