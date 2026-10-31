const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directories exist
const uploadDir = path.join(__dirname, '../../uploads');
const subDirs = ['surveys', 'installations', 'services', 'subsidies', 'receipts'];

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

subDirs.forEach((sub) => {
  const p = path.join(uploadDir, sub);
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Route file into appropriate folder based on route path
    let target = uploadDir;
    if (req.originalUrl.includes('survey')) target = path.join(uploadDir, 'surveys');
    else if (req.originalUrl.includes('installation')) target = path.join(uploadDir, 'installations');
    else if (req.originalUrl.includes('service')) target = path.join(uploadDir, 'services');
    else if (req.originalUrl.includes('subsid')) target = path.join(uploadDir, 'subsidies');
    else if (req.originalUrl.includes('expense') || req.originalUrl.includes('payment')) target = path.join(uploadDir, 'receipts');

    cb(null, target);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${sanitizedBase}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only image files (JPEG, PNG, WebP) and PDFs are allowed!'));
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

module.exports = upload;
