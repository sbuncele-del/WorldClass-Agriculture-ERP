#!/bin/bash

# ============================================================
# Install Tesseract OCR on Oracle Cloud VM
# Free alternative to AWS Textract
# ============================================================

echo "Installing Tesseract OCR (AWS Textract alternative)..."

# Install Tesseract
sudo apt update
sudo apt install -y tesseract-ocr tesseract-ocr-eng libtesseract-dev

# Install additional language packs if needed
sudo apt install -y tesseract-ocr-afr  # Afrikaans
# sudo apt install -y tesseract-ocr-fra  # French
# sudo apt install -y tesseract-ocr-deu  # German

# Install ImageMagick for image processing
sudo apt install -y imagemagick

# Install Poppler for PDF processing
sudo apt install -y poppler-utils

# Verify installation
echo ""
echo "✓ Tesseract version: $(tesseract --version | head -1)"
echo "✓ Available languages:"
tesseract --list-langs

echo ""
echo "Tesseract OCR installed successfully!"
echo ""
echo "Usage in Node.js:"
echo "  npm install tesseract.js"
echo "  or use: node-tesseract-ocr"
