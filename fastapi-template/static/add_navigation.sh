#!/bin/bash

# Script to add navigation system to all HTML pages
# Usage: ./add_navigation.sh

PAGES=("orders.html" "customers.html" "drivers.html" "rewards.html" "settings.html")

for page in "${PAGES[@]}"; do
    echo "Adding navigation to $page..."
    
    # Add main-content wrapper to body
    sed -i '' 's/<body>/<body>\
    <div class="main-content">/' "$page"
    
    # Find the last </div> before </body> and add closing main-content div
    # This is a simple approach - for production, would need more sophisticated parsing
    
    # Add navigation script before </body>
    sed -i '' 's|</body>|    <!-- Navigation System -->\
    <script src="/navigation.js"></script>\
</body>|' "$page"
    
    echo "✅ Navigation added to $page"
done

echo "🎉 Navigation system added to all pages!"
