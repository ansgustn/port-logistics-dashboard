import pool from '../config/postgres.js';
import mongoose from 'mongoose';

export const getHealthStatus = async (req, res) => {
    try {
        // 1. Check Express Server
        const status = {
            server: 'up',
            timestamp: new Date().toISOString(),
            databases: {
                postgres: 'down',
                mongo: 'down'
            }
        };

        // 2. Check PostgreSQL
        try {
            const pgResult = await pool.query('SELECT 1 AS ok');
            if (pgResult.rows[0].ok === 1) {
                status.databases.postgres = 'up';
            }
        } catch (err) {
            console.error('Postgres health check failed:', err.message);
        }

        // 3. Check MongoDB
        if (mongoose.connection.readyState === 1) {
            status.databases.mongo = 'up';
        }

        const isFullyHealthy = status.databases.postgres === 'up' && status.databases.mongo === 'up';

        res.status(isFullyHealthy ? 200 : 207).json(status);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};
