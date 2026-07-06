const fs = require('fs');
let lines = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(") : (") && lines[i+1] === "" && lines[i+2] && lines[i+2].includes("<button")) {
        lines[i] = lines[i].replace(') : (', ') : (<>');
        console.log("Added <> at line " + i);
    }
}

// And close the fragment after the ban button!
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("حظر نهائي") && lines[i+1] && lines[i+1].includes("</button>") && lines[i+2] && lines[i+2].includes(")}")) {
        lines[i+2] = lines[i+2] + "\n                                  </>";
        console.log("Added </> at line " + i);
    }
}

fs.writeFileSync('src/components/AdminPortal.tsx', lines.join('\n'));
