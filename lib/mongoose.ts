import mongoose from "mongoose";

let isConnected = false;

export const connectToDb = async () => {
  mongoose.set("strictQuery", true);

  if (!process.env.MONGODB_URL) return console.log("Mongo url not found");

  if (isConnected) return console.log("Already connected to mongo");

  try {
    await mongoose.connect(process.env.MONGODB_URL);
    
    console.log('connect to mongo');
  } catch (error) {
    console.log(error);
  }
};
