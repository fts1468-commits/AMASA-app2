#!/usr/bin/env python3
import os
import zipfile
import shutil

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = os.path.join(ROOT_DIR, 'dist')
PUBLIC_DIR = os.path.join(ROOT_DIR, 'public')
TEMPLATES_DIR = os.path.join(ROOT_DIR, 'scripts', 'server_templates')

os.makedirs(PUBLIC_DIR, exist_ok=True)

# 0. Copy offline server templates into dist/
if os.path.exists(TEMPLATES_DIR):
    for f in os.listdir(TEMPLATES_DIR):
        src_path = os.path.join(TEMPLATES_DIR, f)
        dst_path = os.path.join(DIST_DIR, f)
        shutil.copy2(src_path, dst_path)
        print(f"Copied template to dist: {f}")

# 1. Create amasa-dist.zip (Pure production distribution only)
dist_zip_path = os.path.join(PUBLIC_DIR, 'amasa-dist.zip')
if os.path.exists(dist_zip_path):
    os.remove(dist_zip_path)

print(f"Creating {dist_zip_path} (Pure production distribution)...")
DIST_ALLOWED_PREFIXES = ('index.html', 'assets', 'serve.cjs', 'serve.mjs', 'serve.py', 'README.txt')

with zipfile.ZipFile(dist_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(DIST_DIR):
        for file in files:
            abs_path = os.path.join(root, file)
            rel_path = os.path.relpath(abs_path, DIST_DIR)
            if any(rel_path == item or rel_path.startswith(item + os.sep) for item in DIST_ALLOWED_PREFIXES):
                zipf.write(abs_path, rel_path)
                print(f"  + dist: {rel_path}")

print("amasa-dist.zip created successfully.")

# 2. Create amasa-source.zip (Clean source code only)
source_zip_path = os.path.join(PUBLIC_DIR, 'amasa-source.zip')
if os.path.exists(source_zip_path):
    os.remove(source_zip_path)

print(f"Creating {source_zip_path} (Clean source code)...")
SOURCE_FILES = [
    'index.html',
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    '.env.example',
    'metadata.json',
    'README.md',
]

with zipfile.ZipFile(source_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for f in SOURCE_FILES:
        p = os.path.join(ROOT_DIR, f)
        if os.path.exists(p):
            zipf.write(p, f)
            print(f"  + source: {f}")
    
    # Add src/ directory recursively
    src_dir = os.path.join(ROOT_DIR, 'src')
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            abs_path = os.path.join(root, file)
            rel_path = os.path.relpath(abs_path, ROOT_DIR)
            zipf.write(abs_path, rel_path)

print("amasa-source.zip created successfully.")

# Copy both zips into dist/ so they are also available when hosted
shutil.copy2(dist_zip_path, os.path.join(DIST_DIR, 'amasa-dist.zip'))
shutil.copy2(source_zip_path, os.path.join(DIST_DIR, 'amasa-source.zip'))

print("All zips generated and placed in public/ and dist/.")
