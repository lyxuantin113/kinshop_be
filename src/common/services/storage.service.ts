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
            const pathParts = fileUrl.split(`${bucketName}/`);
            if (pathParts.length < 2) return;

            const fileName = pathParts[1];
            const file = bucket.file(fileName);
            await file.delete();
        } catch (error: any) {
            console.error(`GCS Delete Error: ${error.message}`);
        }
    }

    /**
     * Extracts the clean path (e.g., 'products/abc.jpg') from any URL or path
     */
    private getCleanPath(pathOrUrl: string): string {
        if (!pathOrUrl) return '';

        // 1. If it's a full URL
        if (pathOrUrl.startsWith('http')) {
            try {
                // Split by bucket name to get the path
                const parts = pathOrUrl.split(`${bucketName}/`);
                if (parts.length >= 2) {
                    // Remove query parameters if any (Signed URL params)
                    return parts[1].split('?')[0];
                }
            } catch (e) {
                return pathOrUrl;
            }
        }

        // 2. If it's already a path, just remove query params just in case
        return pathOrUrl.split('?')[0];
    }

    /**
     * Returns a standard public URL (clean) for database storage
     */
    getCleanUrl(pathOrUrl: string): string {
        const path = this.getCleanPath(pathOrUrl);
        if (!path) return pathOrUrl;
        return `https://storage.googleapis.com/${bucketName}/${path}`;
    }

    /**
     * Generate a signed URL for a file
     * Supports both full URLs and paths
     */
    async getSignedUrl(pathOrUrl: string): Promise<string> {
        try {
            const fileName = this.getCleanPath(pathOrUrl);

            if (!fileName) return pathOrUrl;

            const file = bucket.file(fileName);

            // Log attempt for debugging
            console.log(`[StorageService] Signing URL for: ${fileName}`);

            const [url] = await file.getSignedUrl({
                version: 'v4',
                action: 'read',
                expires: Date.now() + 60 * 60 * 1000, // 1 hour
            });

            return url;
        } catch (error: any) {
            // CRITICAL: Log the actual error to Cloud Run logs
            console.error(`[StorageService] GCS Sign Error for ${pathOrUrl}: ${error.message}`);

            // If the error is about missing credentials, we need to know!
            if (error.message.includes('credentials') || error.message.includes('key')) {
                console.error(`[StorageService] Hint: Ensure GCP_CLIENT_EMAIL and GCP_PRIVATE_KEY are set or Service Account has IAM signBlob permission.`);
            }

            return this.getCleanUrl(pathOrUrl); // Fallback to clean public URL
        }
    }
}
