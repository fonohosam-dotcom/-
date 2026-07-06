const fs = require('fs');
let code = fs.readFileSync('src/components/CitizenPortal.tsx', 'utf8');

const importRegex = /import React, \{ useState, useRef, useEffect \} from "react";/;
code = code.replace(importRegex, 'import React, { useState, useRef, useEffect } from "react";\nimport { BellRing, CalendarDays } from "lucide-react";');

const componentBodyRegex = /const currentStepIdx = getCurrentStepIndex\(\);\n/;
const notificationCode = `
  const [showVisitNotification, setShowVisitNotification] = useState(false);
  const [visitDaysLeft, setVisitDaysLeft] = useState(0);

  useEffect(() => {
    if (citizenCase?.scheduledVisitDate) {
      const visitDate = new Date(citizenCase.scheduledVisitDate);
      const today = new Date();
      // Reset hours for accurate day calculation
      today.setHours(0, 0, 0, 0);
      visitDate.setHours(0, 0, 0, 0);
      const diffTime = visitDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays <= 3) {
        setShowVisitNotification(true);
        setVisitDaysLeft(diffDays);
      }
    }
  }, [citizenCase]);
`;

code = code.replace(componentBodyRegex, 'const currentStepIdx = getCurrentStepIndex();\n' + notificationCode);

const uiRegex = /<div className="bg-gradient-to-l from-\[#0F6E56\] to-\[#1D9E75\] text-white p-6 rounded-2xl shadow-sm">/;
const notificationUI = `
      {showVisitNotification && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm flex items-start gap-4 animate-fade-in relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
          <div className="p-2 bg-amber-100 rounded-xl text-amber-700 animate-pulse">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-amber-900 flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              تذكير: اقتراب موعد الزيارة الميدانية
            </h3>
            <p className="text-sm text-amber-800 mt-1 leading-relaxed">
              {visitDaysLeft === 0 
                ? "الزيارة الميدانية للباحث الاجتماعي مجدولة لليوم! يرجى التواجد في المنزل وتجهيز المستندات اللازمة."
                : \`الزيارة الميدانية مجدولة بعد \${visitDaysLeft} \${visitDaysLeft === 1 ? "يوم" : "أيام"}. يرجى التواجد وتجهيز المستندات.\`}
            </p>
            <p className="text-xs text-amber-700/80 mt-2 font-mono">
              تاريخ الزيارة: {citizenCase?.scheduledVisitDate ? new Date(citizenCase.scheduledVisitDate).toLocaleDateString("ar-SA") : ""}
            </p>
          </div>
          <button 
            onClick={() => setShowVisitNotification(false)}
            className="mr-auto text-amber-500 hover:text-amber-700 p-1"
          >
            ✕
          </button>
        </div>
      )}

      <div className="bg-gradient-to-l from-[#0F6E56] to-[#1D9E75] text-white p-6 rounded-2xl shadow-sm">
`;

code = code.replace(uiRegex, notificationUI);

fs.writeFileSync('src/components/CitizenPortal.tsx', code);
