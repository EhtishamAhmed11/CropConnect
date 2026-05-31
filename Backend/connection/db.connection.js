import mongoose from "mongoose";

const connectDb = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!uri) {
    console.error("❌ MongoDB URI is missing in environment variables.");
    return;
  }

  try {
    console.log(`Connecting to: ${uri.split("@").pop()}`); // Log only host for security
    await mongoose.connect(uri);
    console.log(`✅ Database Connected Successfully`);
  } catch (error) {
    console.error(`❌ Error in database Connection: ${error.message}`);
    // Don't exit process here, let the app handle it or retry
  }
};

export default connectDb;

