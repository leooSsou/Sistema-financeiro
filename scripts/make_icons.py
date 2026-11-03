import sys
import os
from PIL import Image

def process_icon(input_path):
    os.makedirs('build', exist_ok=True)
    img = Image.open(input_path)
    
    # Ensure RGBA
    if img.mode != 'RGBA':
        img = img.convert('RGBA')

    # Save 512x512 PNG for Linux / Window icon
    img_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
    img_512.save('build/icon.png', 'PNG')
    img_512.save('build/icon-512.png', 'PNG')
    
    # Save 256x256 PNG
    img_256 = img.resize((256, 256), Image.Resampling.LANCZOS)
    img_256.save('build/icon-256.png', 'PNG')

    # Save multi-size Windows .ico
    icon_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    img.save('build/icon.ico', format='ICO', sizes=icon_sizes)
    print("Successfully generated build/icon.ico and build/icon.png!")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        process_icon(sys.argv[1])
    else:
        print("Usage: python3 make_icons.py <input_image>")
