const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

code = code.replace(
  'onTriggerGeoSOS?: (msg: string | null) => void;',
  'onTriggerGeoSOS?: (msg: string | null) => void;\n  onRefresh?: () => void;'
);

code = code.replace(
  'onTriggerGeoSOS,',
  'onTriggerGeoSOS,\n  onRefresh,'
);

code = code.replace(
  'import { Lock, Radio, Send, MapPin, AlertTriangle, History, ShieldAlert, Check, Navigation, Truck, UserCheck, Compass, Bell, Volume2, Clock, CheckCircle2 } from "lucide-react";',
  'import { Lock, Radio, Send, MapPin, AlertTriangle, History, ShieldAlert, Check, Navigation, Truck, UserCheck, Compass, Bell, Volume2, Clock, CheckCircle2 } from "lucide-react";\nimport AdvancedAdmin from "./AdvancedAdmin";'
);

const usersSectionRegex = /\{ \/\* Central registry of verified users \*\/ \}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}/g;

code = code.replace(/\{\s*\/\*\s*Central registry of verified users\s*\*\/\s*\}([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}/, 
`{/* Central registry of verified users */}
$1
            </div>

            {/* Advanced Admin controls (Feature Flags + Ban/Delete users) */}
            {(user.isSuperAdmin || user.email === "hosam.fono" || user.id === "super-admin") && (
              <AdvancedAdmin users={users} onRefresh={() => onRefresh && onRefresh()} />
            )}

          </div>
        </div>
      )}`);

fs.writeFileSync('src/components/AdminPortal.tsx', code);
