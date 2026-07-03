#!/bin/bash
# Insert /api/auth/update-profile route after /api/auth/login

sed -i '/app.post("\/api\/auth\/login", (req, res) => {/i \
app.post("/api/auth/update-profile", (req, res) => {\
  const tokenHeader = req.headers.authorization;\
  if (!tokenHeader) return res.status(401).json({ status: "error" });\
  const token = tokenHeader.split(" ")[1];\
  const sessionStr = state.sessions[token];\
  if (!sessionStr) return res.status(401).json({ status: "error" });\
  const user = JSON.parse(sessionStr);\
  const { isAnonymous } = req.body;\
  const userIndex = state.users.findIndex(u => u.id === user.id);\
  if (userIndex > -1) {\
    state.users[userIndex].isAnonymous = isAnonymous;\
    state.sessions[token] = JSON.stringify(state.users[userIndex]);\
    saveState();\
    res.json({ status: "success", user: state.users[userIndex] });\
  } else {\
    res.status(404).json({ status: "error" });\
  }\
});\
' server.ts
