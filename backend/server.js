import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectMongo from './src/config/mongo.js';
import apiRoutes from './src/routes/api.js';
import pool from './src/config/postgres.js';
import { createServer } from 'http';
import { initSocket } from './src/services/socketService.js';

// 환경 변수 로드
dotenv.config();

const app = express();
const httpServer = createServer(app); // Socket.io를 위해 HTTP 서버로 감싸기
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json()); // JSON 바디 파싱

// 데이터베이스 연결 초기화 (MongoDB)
connectMongo();

// API 라우팅 연결
app.use('/api', apiRoutes);

// 기본 루트 응답
app.get('/', (req, res) => {
    res.send('Port Logistics API Server is running.');
});

// WebSocket(Socket.io) 초기화
initSocket(httpServer);

// 서버 구동 (app.listen 대신 httpServer.listen 사용)
httpServer.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});

// 프로세스 종료 시 처리
process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    // await pool.end(); // Postgres 테스트 시 주석 해제
    process.exit(0);
});
