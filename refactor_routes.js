const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace conditional activeTab logic with <Routes>
// We need to find the main <main> element where all the tabs are rendered.
const mainStart = code.indexOf('<main className="flex-1 overflow-x-hidden overflow-y-auto');
const mainEnd = code.indexOf('</main>', mainStart);

if (mainStart === -1 || mainEnd === -1) {
    console.error("Could not find main element");
    process.exit(1);
}

const mainContent = code.substring(mainStart, mainEnd);

// A simple approach is to use regex or string replacement, but since React components contain nested braces, we should do it manually.
let newMainContent = mainContent;

newMainContent = newMainContent.replace(/\{activeTab === "home" && \(/, '<Routes>\n        <Route path="/" element={');
newMainContent = newMainContent.replace(/\s*<LandingView[\s\S]*?\/>\n\s*\)}/, (match) => match.replace(/\)}/, '} />'));

const tabs = [
    "cases", "infrastructure", "map", "donation", "reports", "printing", "security", "verify", "supervision"
];

for (const tab of tabs) {
    const regex = new RegExp(`\\{activeTab === "${tab}" && \\(`, 'g');
    newMainContent = newMainContent.replace(regex, `<Route path="/${tab}" element={`);
}

// Now we need to close all the Routes' elements properly.
// This might be tricky because of nested parentheses and braces.
// Let's use a simpler approach: use `Routes` and replace the conditionals with Routes block manually if it's too complex.

