const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  'notificationPrefs: Record<string, NotificationPreferences>; // Maps userId to prefs\n}',
  'notificationPrefs: Record<string, NotificationPreferences>; // Maps userId to prefs\n  featureFlags?: Record<string, boolean>;\n}'
);
code = code.replace(
  'if (!state.notificationPrefs) state.notificationPrefs = {};',
  'if (!state.notificationPrefs) state.notificationPrefs = {};\n    if (!state.featureFlags) state.featureFlags = { "module_map": true, "module_reports": true, "module_projects": true, "module_charity": true };'
);
code = code.replace(
  'notificationPrefs: initialPrefs',
  'notificationPrefs: initialPrefs,\n    featureFlags: { "module_map": true, "module_reports": true, "module_projects": true, "module_charity": true }'
);
fs.writeFileSync('server.ts', code);
