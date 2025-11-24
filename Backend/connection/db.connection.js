import mongoose from "mongoose";
const connectDb = async () => {
  try {
    console.log(process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`Database Working`);
  } catch (error) {
    console.log(`Error in database Connection:${error.message}`);
  }
};

export default connectDb;
