"""Edge sharpness: how many device pixels a block edge takes to go from 10% to 90% of its contrast step.
Crisp is <= 2 px. Usage:
  python scripts/edge-width.py shot.png x0 x1 y [x0 x1 y ...]     horizontal scans (left->right across an edge)
Prints the 10-90 width for the strongest step in each scan, plus the raw luminance profile.
"""
import sys
from PIL import Image


def lum(p):
    r, g, b = p[:3]
    return .2126 * r + .7152 * g + .0722 * b


def width(profile):
    # the steepest step in the scan, widened while neighbouring steps are >10% of it (a flat band, like a drop shadow, ends it);
    # width = pixels strictly between 10% and 90% of that ramp, +1 so a single-pixel jump counts as 1
    n = len(profile)
    k = max(range(n - 1), key=lambda i: abs(profile[i + 1] - profile[i]))
    up = profile[k + 1] > profile[k]
    m = max(1, abs(profile[k + 1] - profile[k]) * .1)  # a gentle tail (bevel highlight, glow) isn't the edge
    a, z = k, k + 1
    while a > 0 and (profile[a] - profile[a - 1] if up else profile[a - 1] - profile[a]) > m: a -= 1
    while z < n - 1 and (profile[z + 1] - profile[z] if up else profile[z] - profile[z + 1]) > m: z += 1
    lo, hi = profile[a] + (profile[z] - profile[a]) * .1, profile[a] + (profile[z] - profile[a]) * .9
    inside = [i for i in range(a, z + 1) if min(lo, hi) < profile[i] < max(lo, hi)]
    return len(inside) + 1, round(abs(profile[z] - profile[a]), 1)


def scan(img, x0, x1, y):
    return [lum(img.getpixel((x, y))) for x in range(x0, x1)]


if __name__ == "__main__":
    img = Image.open(sys.argv[1]).convert("RGB")
    a = list(map(int, sys.argv[2:]))
    for k in range(0, len(a), 3):
        x0, x1, y = a[k:k + 3]
        prof = scan(img, x0, x1, y)
        w, step = width(prof)
        print(f"x {x0}-{x1} y {y}: edge {w} px (step {step})   " + " ".join(f"{v:.0f}" for v in prof))
