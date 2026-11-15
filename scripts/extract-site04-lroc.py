"""Build the local Site04 LROC NAC map image from NASA Moon Trek WMTS.

Usage: python scripts/extract-site04-lroc.py public/assets/site04-lroc-nac.png
Requires Pillow. Fetches tiles once during asset preparation; the app uses the local PNG.
Source metadata: https://trek.nasa.gov/moon/TrekWS/rest/cat/metadata/fgdc/html?label=LRO_NAC_AvgMosaic_SPole855_1mp
"""
import concurrent.futures
import io
import sys
import urllib.request
from pathlib import Path
from PIL import Image

if len(sys.argv) != 2:
    raise SystemExit('Usage: python scripts/extract-site04-lroc.py OUTPUT.png')

# The mosaic and LOLA Site04 use south polar stereographic metres, 0 E,
# radius 1,737,400 m. NASA's WMTS level 11 is 4.1806411743164 m/pixel.
PIXEL_METRES = 14930.861336844288 * 0.00028
TILE_METRES = 256 * PIXEL_METRES
WEST, NORTH = -5000, -11600
FIRST_COLUMN, FIRST_ROW = 1019, 1034
COLUMNS = range(FIRST_COLUMN, 1022)
ROWS = range(FIRST_ROW, 1038)
BASE = ('https://trek.nasa.gov/tiles/Moon/SP/'
        'LRO_NAC_AvgMosaic_SPole855_1mp/1.0.0/'
        'default/default028mm/11')


def fetch_tile(pair):
    column, row = pair
    with urllib.request.urlopen(f'{BASE}/{row}/{column}.png', timeout=30) as response:
        tile = Image.open(io.BytesIO(response.read())).convert('LA')
    if tile.size != (256, 256):
        raise ValueError(f'Unexpected tile size at {column},{row}: {tile.size}')
    return column, row, tile


sheet = Image.new('LA', (len(COLUMNS) * 256, len(ROWS) * 256), (0, 0))
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    for column, row, tile in pool.map(fetch_tile, ((c, r) for r in ROWS for c in COLUMNS)):
        sheet.paste(tile, ((column - FIRST_COLUMN) * 256, (row - FIRST_ROW) * 256))

sheet_west = -1095930 + FIRST_COLUMN * TILE_METRES
sheet_north = 1095930 - FIRST_ROW * TILE_METRES
scale = 5 / PIXEL_METRES
image = sheet.transform(
    (480, 480), Image.Transform.AFFINE,
    (scale, 0, (WEST - sheet_west) / PIXEL_METRES,
     0, scale, (sheet_north - NORTH) / PIXEL_METRES),
    resample=Image.Resampling.BILINEAR,
)
image.save(Path(sys.argv[1]))
print('Saved 480 x 480 Site04 LROC NAC mosaic: X -5000…-2605 m, Y -11600…-13995 m')
