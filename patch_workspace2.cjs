const fs = require('fs');
const content = fs.readFileSync('src/components/WorkspaceIntegration.tsx', 'utf8');

let newContent = content.replace(
`    const pendingCases = cases.filter(c => {
      if (user?.role === 'researcher') return c.status === 'pending';
      if (user?.role === 'admin') return c.status === 'pending' || c.status === 'investigated';
      return false;
    });`,
`    const pendingCases = cases.filter(c => {
      if (user?.role === 'researcher') return c.status === 'submitted' || c.status === 'under_review';
      if (user?.role === 'admin') return c.status === 'field_visit_done';
      return false;
    });`
);

newContent = newContent.replace(
`          notes: \`العائلة: \${c.familyName}\\nالاحتياج: \${c.category}\\nالموقع: \${c.location.city} - \${c.location.district}\``,
`          notes: \`الاحتياج: \${c.needTypes.join(' - ')}\\nالموقع: \${c.municipality}\\nالوصف: \${c.description}\``
);

fs.writeFileSync('src/components/WorkspaceIntegration.tsx', newContent);
