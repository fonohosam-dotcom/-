const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<LandingView[\s\S]*?\/>/m;

const newLandingView = `<LandingView
              cases={cases}
              projects={projects}
              funds={funds}
              onSubmitReport={handleSubmitCommunityReport}
              onNavigateToDonor={() => {
                setActiveTab("donation");
                window.scrollTo(0, 0);
              }}
              onNavigateToTab={(tab) => {
                setActiveTab(tab as any);
                window.scrollTo(0, 0);
              }}
              activeGeoSOS={activeGeoSOS}
              lang={lang}
              reports={reports}
            />`;

code = code.replace(regex, newLandingView);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched LandingView in App.tsx");
