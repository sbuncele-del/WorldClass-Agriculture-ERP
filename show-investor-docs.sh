#!/bin/bash

# WorldClass ERP - PDF Documentation Quick Access Script

echo ""
echo "═══════════════════════════════════════════════════════"
echo "     WorldClass ERP - Investor Documentation"
echo "═══════════════════════════════════════════════════════"
echo ""

echo "📁 Available Documents:"
echo ""
ls -lh /workspaces/WorldClass-ERP/investor-docs/*.pdf | awk '{print "   " $9 " (" $5 ")"}'
echo ""

echo "📦 Complete Package:"
ls -lh /workspaces/WorldClass-ERP/investor-docs-package.zip | awk '{print "   " $9 " (" $5 ")"}'
echo ""

echo "═══════════════════════════════════════════════════════"
echo "📤 How to Download:"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Option 1 - Individual PDFs:"
echo "   Navigate to: /workspaces/WorldClass-ERP/investor-docs/"
echo "   Right-click any PDF → Download"
echo ""
echo "Option 2 - Complete Package (Recommended):"
echo "   Download: /workspaces/WorldClass-ERP/investor-docs-package.zip"
echo "   Contains all PDFs in one file!"
echo ""

echo "═══════════════════════════════════════════════════════"
echo "🔄 Commands:"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Regenerate PDFs:"
echo "   npm run generate:pdfs"
echo ""
echo "Regenerate & Package:"
echo "   npm run package:pdfs"
echo ""

echo "═══════════════════════════════════════════════════════"
echo "✨ All documents are investor-ready and optimized"
echo "   for WhatsApp, email, and professional sharing!"
echo "═══════════════════════════════════════════════════════"
echo ""
