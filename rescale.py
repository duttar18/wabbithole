from skimage.transform import resize
import cv2

img = cv2.imread('wabby.png')
sizes = [16, 48, 128]
for i in sizes:
    resized = cv2.resize(img, dsize=(i, i), interpolation=cv2.INTER_AREA)
    filename = "wabby" + str(i) + ".png"
    cv2.imwrite(filename, resized)