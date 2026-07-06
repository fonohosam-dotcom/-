const fs = require('fs');
let code = fs.readFileSync('src/components/LibyaLeafletMap.tsx', 'utf8');

const regex = /if \(heatmapMode && \(L as any\)\.heatLayer\) \{[\s\S]*?\}\)\.addTo\(map\);\s*\}/m;

const replacement = `if (heatmapMode && (L as any).heatLayer) {
      if (mapDimensions.width > 0 && mapDimensions.height > 0) {
        heatLayerRef.current = (L as any).heatLayer(heatPoints, {
          radius: 25,
          blur: 15,
          maxZoom: 10,
          gradient: {
            0.4: '#10b981', // emerald-500
            0.6: '#f59e0b', // amber-500
            0.8: '#ef4444', // red-500
            1.0: '#9f1239'  // rose-800
          }
        }).addTo(map);
      }
    }`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/LibyaLeafletMap.tsx', code);
