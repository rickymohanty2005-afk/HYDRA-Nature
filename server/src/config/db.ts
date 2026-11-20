import mongoose from 'mongoose';
import { env } from './env';

export const connectDB = async (): Promise<void> => {
  mongoose.set('strictQuery', false);
  console.log('Connecting to configured MongoDB...');

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
  });
  console.log('MongoDB successfully connected!');
};
