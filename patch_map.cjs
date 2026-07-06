const fs = require('fs');
let code = fs.readFileSync('src/components/LibyaLeafletMap.tsx', 'utf8');

const replacement = `  const [donationModalCase, setDonationModalCase] = useState<{ id: string, amount: string } | null>(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });

  const isAr = lang === "ar";

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setMapDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {`;

code = code.replace(/  const \[donationModalCase.*?null\);\s*const isAr = lang === "ar";\s*useEffect\(\(\) => \{/m, replacement);
fs.writeFileSync('src/components/LibyaLeafletMap.tsx', code);
