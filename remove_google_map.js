const fs = require('fs');
let content = fs.readFileSync('src/components/MapsSearchPortal.tsx', 'utf-8');
content = content.replace(/import LibyaInteractiveMap from "\.\/LibyaInteractiveMap";\n/, '');
content = content.replace(/\{false \? \([\s\S]*?\) : mapMode === "leaflet" \? \(/, '{mapMode === "leaflet" || mapMode === "google" ? (');
fs.writeFileSync('src/components/MapsSearchPortal.tsx', content);
