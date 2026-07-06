const fs = require('fs');
let code = fs.readFileSync('src/components/LibyaLeafletMap.tsx', 'utf8');

const regex = /className=\{\`bg-white border-l border-\[\#E5E3DA\] w-76 flex flex-col justify-between shrink-0 transition-all duration-300 z-10 relative \$\{\s*sidebarOpen \? "translate-x-0" \: isAr \? "translate-x-full w-0 overflow-hidden border-none" \: "-translate-x-full w-0 overflow-hidden border-none"\s*\}\`\}/m;

const replacement = `className={\`bg-white border-[#E5E3DA] flex flex-col justify-between shrink-0 transition-all duration-300 z-10 relative \${
            sidebarOpen ? "w-[300px] border-l translate-x-0" : "w-0 overflow-hidden border-none"
          }\`}`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/LibyaLeafletMap.tsx', code);
