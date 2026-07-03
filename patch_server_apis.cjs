const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const userDeleteApi = `
app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const initialLength = state.users.length;
  state.users = state.users.filter(u => u.id !== id);
  if (state.users.length === initialLength) {
    return res.status(404).json({ status: "error", message: "المستخدم غير موجود" });
  }
  saveState();
  res.json({ status: "success", message: "تم حذف المستخدم بنجاح" });
});

// Feature Flags APIs
app.get("/api/feature-flags", (req, res) => {
  res.json({ status: "success", flags: state.featureFlags || {} });
});

app.put("/api/feature-flags", (req, res) => {
  state.featureFlags = { ...state.featureFlags, ...req.body };
  saveState();
  res.json({ status: "success", flags: state.featureFlags });
});

// Notifications API
`;

code = code.replace('// Notifications API', userDeleteApi);
fs.writeFileSync('server.ts', code);
