#!/bin/bash
# Verify platforms section is working

echo "🔍 Verifying Platforms Section Configuration..."
echo ""

cd /home/theo/thrmnn.github.io

# Check if platforms section is enabled
echo "1. Checking if platforms section is enabled in homepage..."
if grep -q "id: platforms" content/_index.md; then
    echo "   ✅ Platforms section is enabled"
else
    echo "   ❌ Platforms section NOT found"
    exit 1
fi

# Check platform files exist
echo ""
echo "2. Checking platform content files..."
platforms=("thymio-robot" "f1tenth-autonomous-racing" "borinot-drone" "roboat-autonomous-vessel")
all_exist=true
for platform in "${platforms[@]}"; do
    if [ -f "content/platform/$platform/index.md" ]; then
        echo "   ✅ $platform exists"
    else
        echo "   ❌ $platform NOT found"
        all_exist=false
    fi
done

if [ "$all_exist" = false ]; then
    exit 1
fi

# Check images are configured
echo ""
echo "3. Checking platform images..."
if grep -q "filename: platforms/borinot_agile.png" content/platform/borinot-drone/index.md; then
    echo "   ✅ Borinot image configured"
else
    echo "   ⚠️  Borinot image not configured"
fi

if grep -q "filename: platforms/roboat.jpg" content/platform/roboat-autonomous-vessel/index.md; then
    echo "   ✅ Roboat image configured"
else
    echo "   ⚠️  Roboat image not configured"
fi

# Check Hugo build
echo ""
echo "4. Testing Hugo build..."
if hugo --quiet > /tmp/hugo_build.log 2>&1; then
    echo "   ✅ Hugo builds successfully"
    echo "   📊 Build stats:"
    tail -5 /tmp/hugo_build.log | grep -E "Pages|Total" || echo "   (Check /tmp/hugo_build.log for details)"
else
    echo "   ❌ Hugo build failed"
    echo "   Check /tmp/hugo_build.log for errors"
    exit 1
fi

# Check if server is running
echo ""
echo "5. Checking if Hugo server is running..."
if pgrep -f "hugo server" > /dev/null; then
    echo "   ✅ Hugo server is running"
    if curl -s -o /dev/null -w "   HTTP Status: %{http_code}\n" http://localhost:1313/ 2>&1 | grep -q "200"; then
        echo "   ✅ Server is responding"
        
        # Check platforms section in HTML
        echo ""
        echo "6. Checking platforms section in HTML..."
        if curl -s http://localhost:1313/ | grep -q 'id="platforms"'; then
            echo "   ✅ Platforms section found in HTML"
        else
            echo "   ⚠️  Platforms section ID not found in HTML"
        fi
        
        # Check platform names
        echo ""
        echo "7. Checking platform names in HTML..."
        platforms_found=0
        for platform_name in "Thymio" "F1TENTH" "Borinot" "Roboat"; do
            if curl -s http://localhost:1313/ | grep -qi "$platform_name"; then
                echo "   ✅ $platform_name found"
                platforms_found=$((platforms_found + 1))
            else
                echo "   ⚠️  $platform_name not found"
            fi
        done
        
        echo ""
        echo "📊 Summary: $platforms_found/4 platforms found in HTML"
    else
        echo "   ⚠️  Server not responding on port 1313"
    fi
else
    echo "   ⚠️  Hugo server is NOT running"
    echo ""
    echo "   To start the server, run:"
    echo "   cd /home/theo/thrmnn.github.io"
    echo "   hugo server --bind 0.0.0.0 --port 1313"
fi

echo ""
echo "✅ Verification complete!"
