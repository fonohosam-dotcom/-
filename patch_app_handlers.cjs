const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/onDonate=\{handleDonation\}/g, 'onDonate={handleDonate}');
code = code.replace(/onAddReport=\{handleAddReport\}/g, 'onAddReport={handleSubmitCommunityReport}');

const triggerGeoSOSRegex = /const handleLoginSuccess/g;
const handleTriggerGeoSOS = `  const handleTriggerGeoSOS = (muni: string) => {
    setActiveGeoSOS(muni);
    playAlertSound("notification");
  };
  
  const handleLoginSuccess`;
code = code.replace(triggerGeoSOSRegex, handleTriggerGeoSOS);

fs.writeFileSync('src/App.tsx', code);
