const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

const importRegex = /import React, \{ useState, useEffect \} from "react";/;
code = code.replace(importRegex, 'import React, { useState, useEffect } from "react";\nimport ImageGenerator from "./ImageGenerator";');

const tabRegex = /\{\/\* Dynamic Sub-Tabs bar \*\/\}\n\s*<div className="flex flex-wrap gap-1\.5 bg-slate-100 p-1 rounded-2xl">/;
const newTab = `
        {/* Dynamic Sub-Tabs bar */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setAdminTab("ai")}
            className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer \${
              adminTab === "ai"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-indigo-600 hover:text-indigo-900 bg-indigo-50"
            }\`}
          >
            ✨ توليد الصور والمحتوى
          </button>
`;
code = code.replace(tabRegex, newTab);

const renderRegex = /\{adminTab === "dashboard" && \(/;
const aiRender = `
      {adminTab === "ai" && (
        <div className="max-w-4xl mx-auto mt-8 animate-fade-in">
          <ImageGenerator />
        </div>
      )}

      {adminTab === "dashboard" && (
`;
code = code.replace(renderRegex, aiRender);

fs.writeFileSync('src/components/AdminPortal.tsx', code);
