const fs = require('fs');
let code = fs.readFileSync('src/components/InteractiveReports.tsx', 'utf8');

// remove imports
code = code.replace(/import \{ jsPDF \} from "jspdf";\n/, '');
code = code.replace(/import html2canvas from "html2canvas";\n/, '');

const match = code.match(/const handleExportPDF = async \(\) => \{[\s\S]*?setIsGeneratingPDF\(false\);\n    \}\n  \};/m);

if (match) {
  const newExportPDF = `const handleExportPDF = async () => {
    setIsGeneratingPDF(true);
    setTimeout(() => {
      window.print();
      setIsGeneratingPDF(false);
    }, 500);
  };`;
  code = code.replace(match[0], newExportPDF);
} else {
  console.log("Regex match failed for handleExportPDF in InteractiveReports.tsx");
}

fs.writeFileSync('src/components/InteractiveReports.tsx', code);
