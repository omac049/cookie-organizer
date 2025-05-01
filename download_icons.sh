#!/bin/bash

# Create directory for icons if it doesn't exist
mkdir -p new_icons

# Download 16x16 icon
curl "https://img.icons8.com/color/16/cookie.png" -o "new_icons/16.png"

# Download 32x32 icon
curl "https://img.icons8.com/color/32/cookie.png" -o "new_icons/32.png"

# Download 48x48 icon
curl "https://img.icons8.com/color/48/cookie.png" -o "new_icons/48.png"

# Download 128x128 icon
curl "https://img.icons8.com/color/128/cookie.png" -o "new_icons/128.png"

# Copy to icons directory
cp new_icons/*.png icons/

echo "Icons downloaded and copied to icons directory!" 