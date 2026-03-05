import { Router, Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { createMessage, getMessages, uploadChatImage } from '../controllers/chatController';

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'chat');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) =>
        cb(null, uploadDir),
    filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        // รองรับไฟล์จาก iPhone (HEIC/HEIF) เพิ่มเติม
        const allowed = /jpeg|jpg|png|gif|webp|heic|heif/;
        const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
        const mimeOk = allowed.test(file.mimetype.toLowerCase());

        if (!extOk || !mimeOk) {
            console.warn(
                '[ChatUpload] Rejected file type:',
                file.originalname,
                'mime =',
                file.mimetype
            );
            return cb(null, false);
        }

        cb(null, true);
    },
});

const router = Router();

router.get('/messages', getMessages);
router.post('/messages', createMessage);
router.post('/upload', upload.single('image'), uploadChatImage);

export default router;
