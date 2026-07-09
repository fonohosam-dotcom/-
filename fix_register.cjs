const fs = require('fs');
let content = fs.readFileSync('src/server/routes/auth.routes.ts', 'utf8');
content = content.replace(
`    const [newUser] = await db.insert(users).values({
      uid: crypto.randomUUID(), // we need a uid, might as well generate a unique one for local auth
      email: normalizedEmail,
      fullName,
      phone: phone || null,
      role,
      municipality: municipality || null,
      nationalId: nationalId || null,
      address: address || null,
      gamificationPoints: 0,
      status: 'active'
    }).returning();`,
`    const [newUser] = await db.insert(users).values({
      uid: crypto.randomUUID(), // we need a uid, might as well generate a unique one for local auth
      email: normalizedEmail,
      passwordHash: hashedPassword,
      fullName,
      phone: phone || null,
      role,
      municipality: municipality || null,
      nationalId: nationalId || null,
      address: address || null,
      gamificationPoints: 0,
      status: 'active'
    }).returning();`
);
fs.writeFileSync('src/server/routes/auth.routes.ts', content);
