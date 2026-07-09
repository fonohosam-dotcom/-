import { db } from "../db/index.ts";
import { users } from "../db/schema.ts";

async function seed() {
  try {
      await db.insert(users).values({
        uid: `test-uid-999`,
        email: "test@example.com",
        fullName: "Test User",
        role: "admin",
      });
      console.log("Success");
  } catch (e) {
      console.error(e);
  }
}
seed();
