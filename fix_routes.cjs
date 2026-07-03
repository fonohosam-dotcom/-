const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// We will find each `{activeTab === "X" && (` and replace it.
// And we also need to find its matching `)}`.

function replaceTab(tabName, isHome = false) {
    const searchStr = `{activeTab === "${tabName}" && (`;
    let startIdx = code.indexOf(searchStr);
    if (startIdx === -1) return;
    
    // find matching brace
    let braceCount = 0;
    let endIdx = -1;
    let foundStart = false;
    for (let i = startIdx; i < code.length; i++) {
        if (code[i] === '{') braceCount++;
        else if (code[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
                endIdx = i;
                break;
            }
        }
    }
    
    if (endIdx !== -1) {
        // the content is between startIdx + searchStr.length and endIdx - 1
        let content = code.substring(startIdx + searchStr.length, endIdx);
        // trim the trailing closing parenthesis `)`
        content = content.replace(/\)\s*$/, '');
        
        let path = isHome ? "/" : `/${tabName}`;
        let replaceStr = `<Route path="${path}" element={${content}} />`;
        if (isHome) {
            replaceStr = `<Routes>\n        ${replaceStr}`;
        }
        if (tabName === "supervision") {
            replaceStr = `${replaceStr}\n        </Routes>`;
        }
        
        code = code.substring(0, startIdx) + replaceStr + code.substring(endIdx + 1);
    }
}

const tabs = [
    {name: "home", isHome: true},
    {name: "cases", isHome: false},
    {name: "infrastructure", isHome: false},
    {name: "map", isHome: false},
    {name: "donation", isHome: false},
    {name: "reports", isHome: false},
    {name: "printing", isHome: false},
    {name: "security", isHome: false},
    {name: "verify", isHome: false},
    {name: "supervision", isHome: false}
];

for (let tab of tabs) {
    replaceTab(tab.name, tab.isHome);
}

fs.writeFileSync('src/App.tsx', code, 'utf-8');
