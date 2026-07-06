const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<main className="max-w-6xl mx-auto px-4 py-8 min-h-\[70vh\]">[\s\S]*?<\/main>/m;

const newMain = `<main className="max-w-6xl mx-auto px-4 py-8 min-h-[70vh]">
          <Suspense fallback={<div className="flex items-center justify-center h-full"><RefreshCw className="w-8 h-8 animate-spin text-emerald-600" /></div>}>
            <Routes>
              <Route path="/" element={<LandingView />} />
              <Route path="/citizen" element={<CitizenPortal />} />
              <Route path="/researcher" element={<ResearcherPortal />} />
              <Route path="/donor" element={<DonorPortal />} />
              <Route path="/charity" element={<CharityPortal />} />
              <Route path="/volunteer" element={<VolunteerPortal />} />
              <Route path="/admin" element={<AdminPortal />} />
              <Route path="/payment" element={<PaymentHub />} />
              <Route path="/intake" element={<IntakePortal />} />
              <Route path="/infrastructure" element={<InfrastructurePortal />} />
              <Route path="/print" element={<OfficialPrintCenter />} />
              <Route path="/security" element={<SecurityAuditVault />} />
              <Route path="/verify" element={<PublicVerifyPortal />} />
            </Routes>
          </Suspense>
        </main>`;

if(code.match(regex)) {
   code = code.replace(regex, newMain);
   fs.writeFileSync('src/App.tsx', code);
   console.log("Successfully patched App.tsx router");
} else {
   console.log("Failed to match main element in App.tsx");
}
