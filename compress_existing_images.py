#!/usr/bin/env python
"""
VIN-KJ Image Compression & Migration Script
Compresses and converts all existing images in the database and media folder to WebP.

Usage:
    python compress_existing_images.py
    python compress_existing_images.py --force
    python compress_existing_images.py --dry-run
"""
import os
import sys

# Setup Django environment
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vinny_kj.settings')

import django
django.setup()

from django.core.management import call_command

if __name__ == '__main__':
    args = sys.argv[1:]
    call_command('compress_images', *args)
