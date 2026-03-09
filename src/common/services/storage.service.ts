import { bucket, bucketName } from '../../config/storage';
import { AppError } from '../errors/app-error';

export class StorageService {
    /**
     * Stream-based upload to GCS
     */
    async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
        if (!bucketName) {
            throw new AppError('Storage bucket name is not configured', 500);
        }

        const fileName = `${folder}/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
        const blob = bucket.file(fileName);

        const blobStream = blob.createWriteStream({
            resumable: false,
            gzip: true,
            metadata: {
                contentType: file.mimetype,
            },
        });

        return new Promise((resolve, reject) => {
            blobStream.on('error', (err) => {
                reject(new AppError(`GCS Upload Error: ${err.message}`, 500));
            });

            blobStream.on('finish', async () => {
                // Public URL - GCS standard format
                const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
                resolve(publicUrl);
            });

            blobStream.end(file.buffer);
        });
    }

    async deleteFile(fileUrl: string): Promise<void> {
        try {
            // Extract path from URL: https://storage.googleapis.com/bucket-name/folder/file.jpg
            const pathParts = fileUrl.split(`${bucketName}/`);
            if (pathParts.length < 2) return;

            const fileName = pathParts[1];
            const file = bucket.file(fileName);
            await file.delete();
        } catch (error: any) {
            console.error(`GCS Delete Error: ${error.message}`);
        }
    }
}
