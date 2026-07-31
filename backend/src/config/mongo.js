import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectMongo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected successfully.');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        // DB 접속 실패 시 서버를 죽이지 않고 재시도할 수 있도록 처리
    }
};

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected! Reconnecting...');
});

export default connectMongo;
