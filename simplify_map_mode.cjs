const fs = require('fs');
let content = fs.readFileSync('src/components/MapsSearchPortal.tsx', 'utf-8');

content = content.replace(/const \[mapMode, setMapMode\] = useState<"google" \| "leaflet" \| "gis">\("google"\);/, 'const [mapMode, setMapMode] = useState<"leaflet" | "gis">("leaflet");');
content = content.replace(/<button\s*onClick=\{\(\) => setMapMode\("google"\)\}[\s\S]*?خرائط جوجل \(متقدمة\)\s*<\/button>/, '');
content = content.replace(/mapMode === "leaflet" \|\| mapMode === "google"/g, 'mapMode === "leaflet"');

fs.writeFileSync('src/components/MapsSearchPortal.tsx', content);
