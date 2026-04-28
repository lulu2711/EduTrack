import mongoose from 'mongoose';

let isConnected = false;

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.warn('⚠️ MONGODB_URI not found, running without database');
      return;
    }

    // 如果已经连接，直接返回
    if (isConnected) {
      console.log('✅ Using existing MongoDB connection');
      return;
    }

    const conn = await mongoose.connect(mongoURI, { dbName: 'edu-tracker' });
    isConnected = true;
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // 监听连接事件
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
      isConnected = false;
    });

    // 优雅关闭
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('👋 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.warn('⚠️ Database connection failed, running in mock mode:', (error as Error).message);
    console.log('💡 Tip: Install MongoDB locally or use MongoDB Atlas for full functionality');
    // 不退出进程，允许服务继续运行（使用 mock 数据）
  }
};

export default connectDB;
