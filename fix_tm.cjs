const fs = require('fs');
let code = fs.readFileSync('src/server/app.ts', 'utf8');

const newTM = `class TransactionManager {
  private static queue: Promise<any> = Promise.resolve();
  static async withTransaction<T>(operation: (draftState: AppState) => Promise<T> | T): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue = this.queue.then(async () => {
        try {
          if (db) {
            const doc = await db.collection("system").doc("state").get();
            if (doc.exists) {
              state = { ...state, ...doc.data() };
            }
          }
        } catch(e) {}

        const draftState = JSON.parse(JSON.stringify(state));
        try {
          const result = await operation(draftState);
          state = draftState;
          
          if (db) {
             await db.collection("system").doc("state").set(state);
          }
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}

// Dummy saveState to prevent undefined errors if called elsewhere
function saveState() {}`;

code = code.replace(/class TransactionManager \{[\s\S]*?function saveState\(\) \{[\s\S]*?\n\}/, newTM);
fs.writeFileSync('src/server/app.ts', code);
