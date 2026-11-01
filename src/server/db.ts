import mongoose from 'mongoose';

const DEFAULT_URI = 'mongodb://localhost:27017/valuation_dossiers';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || DEFAULT_URI;

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`[MongoDB] Đã kết nối thành công tới ${uri}`);
  } catch (err: any) {
    console.error(
      `[MongoDB] Không thể kết nối tới MongoDB (${uri}). ` +
      `Vui lòng kiểm tra MongoDB đã được khởi động (mongod) trên máy, hoặc cấu hình lại MONGODB_URI trong .env.`
    );
    console.error(err?.message || err);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Lỗi kết nối trong quá trình chạy:', err?.message || err);
  });
}
