import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const TEST_DB_URI = process.env.MONGO_URI?.replace('/file-processor', '/file-processor-test') || '';

export const connectTestDB = async (): Promise<void> => {
  await mongoose.connect(TEST_DB_URI);
};

export const disconnectTestDB = async (): Promise<void> => {
  await mongoose.disconnect();
};

export const clearTestDB = async (): Promise<void> => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};
