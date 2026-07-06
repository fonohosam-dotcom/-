const fs = require('fs');
let code = fs.readFileSync('src/components/DonorPortal.tsx', 'utf8');

code = code.replace(/import html2canvas from "html2canvas";\n/, '');

const match = code.match(/const handleShareImage = async \(\) => \{[\s\S]*?\}, 100\);\n              \};/m);

if (match) {
  const newShareImage = `const handleShareImage = async () => {
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: "ملخص الأثر الشخصي",
                      text: "لقد ساهمت في دعم الحالات الإنسانية. شارك في التكافل الاجتماعي!",
                    });
                  } catch (err) {
                    console.error('Share failed', err);
                  }
                } else {
                  alert("ميزة المشاركة غير مدعومة في متصفحك.");
                }
              };`;
  code = code.replace(match[0], newShareImage);
} else {
  console.log("Regex match failed for handleShareImage in DonorPortal.tsx");
}

fs.writeFileSync('src/components/DonorPortal.tsx', code);
