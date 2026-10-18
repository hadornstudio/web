import '../config/env.js';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { applyConfigurators } from './configurators.js';

await connectDB();
console.log(`Applying configurators to ${mongoose.connection.host}/${mongoose.connection.name}`);
for (const line of await applyConfigurators()) console.log(' -', line);
await mongoose.disconnect();
