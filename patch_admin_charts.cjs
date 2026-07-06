const fs = require('fs');
let code = fs.readFileSync('src/components/AdminCharts.tsx', 'utf8');

// remove imports
code = code.replace(/import \{ jsPDF \} from "jspdf";\n/, '');
code = code.replace(/import html2canvas from "html2canvas";\n/, '');

const handleExportPDFRegex = /const handleExportPDF = async \(\) => \{[\s\S]*?(?:pdf\.save\(filename\);|catch|finally)[\s\S]*?setIsExporting\(false\);\n\s*\}\n\s*\};\n/m;
const match = code.match(/const handleExportPDF = async \(\) => \{[\s\S]*?setIsExporting\(false\);\n    \}\n  \};/m);

if (match) {
  const newExportPDF = `const handleExportPDF = async () => {
    setIsExporting(true);
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 500);
  };`;
  code = code.replace(match[0], newExportPDF);
} else {
  console.log("Regex match failed for handleExportPDF in AdminCharts.tsx");
}

fs.writeFileSync('src/components/AdminCharts.tsx', code);
