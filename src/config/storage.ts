import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';

dotenv.config();

const storageOptions: any = {
    projectId: process.env.GCP_PROJECT_ID,
};

// Nếu có đầy đủ email và key thì dùng service account key
// Nếu thiếu, library sẽ tự động tìm Application Default Credentials (ADC)
if (process.env.GCP_CLIENT_EMAIL && process.env.GCP_PRIVATE_KEY) {
    storageOptions.credentials = {
        client_email: process.env.GCP_CLIENT_EMAIL,
        private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
}

const storage = new Storage(storageOptions);

export const bucketName = process.env.GCP_BUCKET_NAME || '';
export const bucket = storage.bucket(bucketName);

export default storage;
