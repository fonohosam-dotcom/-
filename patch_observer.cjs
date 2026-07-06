const fs = require('fs');
let code = fs.readFileSync('src/components/LibyaLeafletMap.tsx', 'utf8');

const regex = /const observer = new ResizeObserver[\s\S]*?observer\.observe/m;

const replacement = `const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const height = entry.contentRect.height;
        
        setMapDimensions({ width, height });
        
        if (mapRef.current) {
          // If size is 0, don't invalidate size yet, or remove heat layer first
          if (width === 0 || height === 0) {
            if (heatLayerRef.current && mapRef.current.hasLayer(heatLayerRef.current)) {
              mapRef.current.removeLayer(heatLayerRef.current);
            }
          }
          mapRef.current.invalidateSize();
        }
      }
    });
    observer.observe`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/LibyaLeafletMap.tsx', code);
