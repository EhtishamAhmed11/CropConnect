import mongoose from "mongoose";
import { jest } from "@jest/globals";

jest.setTimeout(30000); // 30 seconds

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await mongoose.connection.db.dropDatabase();

  console.log("✅ Test database connected");
});
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    // Preserve users and other core setup data during unit tests to avoid re-seeding overhead
    const skipList = ['users', 'provinces', 'districts', 'croptypes', 'crop-types', 'croptype'];
    if (!skipList.includes(key.toLowerCase())) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  console.log("✅ Test database disconnected");
});

afterEach(async () => {
  // Selective cleanup can also be placed here if needed, but beforeEach is usually sufficient
});
