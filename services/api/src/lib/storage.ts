import * as Minio from 'minio';
import logger from '../utils/logger';

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT?.split(':')[0] || 'localhost',
    port: parseInt(process.env.MINIO_ENDPOINT?.split(':')[1] || '9000'),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
});

export const BUCKET_NAME = 'project-files';

export const initStorage = async () => {
    try {
        const exists = await minioClient.bucketExists(BUCKET_NAME);
        if (!exists) {
            await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
            logger.info(`Bucket ${BUCKET_NAME} created successfully`);

            // Set bucket policy to public read (optional, depending on requirements)
            // For now, we'll keep it private and generate presigned URLs
        }
    } catch (error) {
        logger.error('Error initializing storage:', error);
    }
};

export default minioClient;
