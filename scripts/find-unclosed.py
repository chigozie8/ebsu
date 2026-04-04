#!/usr/bin/env python3
"""
Find JSX balance issues in AdminDashboard.tsx.
Tracks every <div open and </div close from the main return() onward,
and reports where the stack goes negative or is non-zero at end.
"""
import re, sys

import os, glob as _glob

# Try multiple candidate paths
_candidates = [
    '/vercel/share/v0-project/src/pages/admin/AdminDashboard.tsx',
    os.path.join(os.getcwd(), 'src/pages/admin/AdminDashboard.tsx'),
]
FILE = next((p for p in _candidates if os.path.exists(p)), None)
if FILE is None:
    # Last resort: glob search
    _found = _glob.glob('**/AdminDashboard.tsx', recursive=True)
    FILE = _found[0] if _found else None
if FILE is None:
    print('ERROR: Cannot locate AdminDashboard.tsx. cwd=' + os.getcwd())
    sys.exit(1)
print(f'Reading: {FILE}')

with open(FILE, encoding='utf-8') as f:
    lines = f.readlines()

# Only analyse from the main component return (line 1833, 0-indexed 1832)
START = 1832

OPEN_RE  = re.compile(r'<div[\s>]')
CLOSE_RE = re.compile(r'</div>')

depth = 0
last_opens = []   # keep a rolling window of last 5 open positions

for i, line in enumerate(lines[START:], START + 1):
    opens  = len(OPEN_RE.findall(line))
    closes = len(CLOSE_RE.findall(line))
    if opens or closes:
        depth += opens - closes
        for _ in range(opens):
            last_opens.append(i)
            if len(last_opens) > 5:
                last_opens.pop(0)
        if depth < 0:
            print(f"WENT NEGATIVE at line {i}: depth={depth}")
            print(f"  line: {line.rstrip()}")
            print(f"  Last opens were at: {last_opens}")
            sys.exit(1)
        # Report lines where depth changes significantly
        if depth <= 2:
            print(f"Line {i:5d}  depth={depth:3d}  opens={opens}  closes={closes}  | {line.rstrip()[:100]}")

print(f"\nFinal depth after line {START + len(lines[START:])}: {depth}")
if depth != 0:
    print(f"IMBALANCE: net unclosed divs = {depth}")
    print(f"Last open positions: {last_opens}")
else:
    print("DIV tags are balanced.")
