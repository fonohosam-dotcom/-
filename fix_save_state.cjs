const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const target = `  } catch (e) {
    console.error("Failed to persist state file", e);
  }`;

const replacement = `  } catch (e) {
    console.error("Failed to persist state file", e);
  }
}`;

code = code.replace(target, replacement);

fs.writeFileSync('server.ts', code, 'utf-8');
