import mongoose from 'mongoose';

const SensorLogSchema = new mongoose.Schema({
    timestamp: { type: Date, required: true },
    truck_id: { type: String, required: true, index: true }, // PostgreSQL trucks.id
    raw_gps: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    corrected_gps: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true }
    },
    imu: {
        accel_x: Number,
        accel_y: Number,
        accel_z: Number,
        gyro_x: Number,
        gyro_y: Number,
        gyro_z: Number
    },
    prediction: {
        predicted_wait_time_minutes: Number,
        status: String,
        co2_emissions_kg: Number
    }
}, {
    // MongoDB Time-Series 컬렉션 설정
    timeseries: {
        timeField: 'timestamp',
        metaField: 'truck_id',
        granularity: 'seconds'
    }
});

// 공간 검색을 위한 2dsphere 인덱스
SensorLogSchema.index({ "corrected_gps": "2dsphere" });

export default mongoose.model('SensorLog', SensorLogSchema);
