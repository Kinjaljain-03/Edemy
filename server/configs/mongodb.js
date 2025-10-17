import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGO_URI; // make sure this matches your .env
  if (!uri) {
    throw new Error("MONGO_URI is missing in .env");
  }

  mongoose.connection.on("connected", () => console.log("Database Connected"));
  mongoose.connection.on("error", (err) => console.log("MongoDB connection error:", err));

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

export default connectDB;
