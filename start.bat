@echo off
cd /d C:\Users\USER\product-page-builder
set PATH=C:\Program Files\nodejs;%PATH%
npx next dev --hostname 0.0.0.0 --port %PORT%
