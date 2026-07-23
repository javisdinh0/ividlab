import cv2
import numpy as np
import svgwrite

# Đọc hình ảnh logo.jpg
img = cv2.imread('X:/iViDLab/ViDiLab Web/logo/logo.jpg')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Dùng Canny Edge Detection để tìm chính xác đường bao xung quanh tất cả các nét
edges = cv2.Canny(gray, 40, 120)

# Trích xuất tọa độ các đường viền bao (Contours)
contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_TC89_KCOS)

h, w = gray.shape
dwg = svgwrite.Drawing('X:/iViDLab/ViDiLab Web/logo/logo-outline.svg', size=(w, h), viewBox=f"0 0 {w} {h}")

# Vẽ các đường line bao kín quanh các nét
for cnt in contours:
    if len(cnt) > 8: # Lọc bỏ các vết nhiễu nhỏ
        # Làm mịn tọa độ đường bao
        approx = cv2.approxPolyDP(cnt, 0.8, True)
        points = [(float(pt[0][0]), float(pt[0][1])) for pt in approx]
        dwg.add(dwg.polygon(points, stroke='#2B4E64', stroke_width=1.5, fill='none'))

dwg.save()
print("Outline SVG generated successfully!")
