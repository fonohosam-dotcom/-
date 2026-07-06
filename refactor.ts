import { Project, SyntaxKind, CallExpression, ArrowFunction, FunctionExpression } from "ts-morph";

const project = new Project();
const sourceFile = project.addSourceFileAtPath("server.ts");

// 1. Add TransactionManager
const saveStateFunc = sourceFile.getFunction("saveState");
if (saveStateFunc) {
  sourceFile.insertText(saveStateFunc.getStart(), `class TransactionManager {
  private static queue: Promise<any> = Promise.resolve();

  static async withTransaction<T>(operation: (draftState: AppState) => Promise<T> | T): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue = this.queue.then(async () => {
        const draftState = JSON.parse(JSON.stringify(state));
        try {
          const result = await operation(draftState);
          state = draftState;
          saveState();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}

`);
}

// 2. Process app.post, app.put, app.delete calls
const appCalls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
  .filter(call => {
    const expr = call.getExpression().getText();
    return expr === "app.post" || expr === "app.put" || expr === "app.delete";
  });

for (const call of appCalls) {
  const args = call.getArguments();
  if (args.length < 2) continue;
  
  // Find the callback (last argument usually, but could be middleware)
  const callback = args[args.length - 1];
  if (callback.getKind() !== SyntaxKind.ArrowFunction && callback.getKind() !== SyntaxKind.FunctionExpression) continue;
  
  const func = callback as (ArrowFunction | FunctionExpression);
  const body = func.getBody();
  if (body.getKind() !== SyntaxKind.Block) continue;
  
  const bodyText = body.getText();
  if (bodyText.includes("state.") && bodyText.includes("saveState()")) {
    
    // We need to transform the body
    // 1. Remove saveState() calls
    const newBodyText = bodyText.replace(/saveState\(\);/g, "")
                                .replace(/state\./g, "draftState.")
                                .replace(/state\s*\[/g, "draftState["); // Just in case
    
    // Replace the body text with a wrapped version
    // bodyText is like: { ... code ... }
    // We want: { await TransactionManager.withTransaction(async (draftState) => { ...code without saveState and state replaced... }); }
    
    const innerCode = newBodyText.substring(1, newBodyText.length - 1); // remove outer braces
    
    body.replaceWithText(`{
      await TransactionManager.withTransaction(async (draftState) => {
        ${innerCode}
      });
    }`);
    
    // Ensure the route handler is async
    if (!func.isAsync()) {
      func.setIsAsync(true);
    }
  }
}

sourceFile.saveSync();
console.log("Refactoring complete");
