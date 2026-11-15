"""Reproduce the exact 480 x 480 Float32 crop bundled with the app.

Usage: python scripts/extract-site04.py ORIGINAL.tif OUTPUT.bin
Requires Pillow. This script checks the TIFF grid and writes no resampled pixels.
"""
import math
import struct
import sys
from pathlib import Path
from PIL import Image

if len(sys.argv) != 3:
    raise SystemExit('Usage: python scripts/extract-site04.py ORIGINAL.tif OUTPUT.bin')
source, target = map(Path, sys.argv[1:])
with Image.open(source) as image:
    if image.size != (3200, 3200) or image.mode != 'F':
        raise ValueError('Expected the 3200x3200 Float32 Site04 DEM')
    scale = tuple(image.tag_v2[33550])
    tiepoint = tuple(image.tag_v2[33922])
    if scale[:2] != (5.0, 5.0) or tiepoint[3:5] != (-9000.0, 1000.0):
        raise ValueError('Unexpected georeferencing')
    crop = image.crop((800, 2520, 1280, 3000))
    values = list(crop.getdata())
    if not all(math.isfinite(value) for value in values):
        raise ValueError('Crop includes NODATA or non-finite elevation')
    with target.open('wb') as output:
        for value in values:
            output.write(struct.pack('<f', value))
print(f'{target}: {len(values)} Float32 cells, 5 m/cell, no resampling')
