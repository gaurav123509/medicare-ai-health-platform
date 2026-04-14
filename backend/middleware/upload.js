const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { createError } = require('../utils/response');

const uploadRoot = path.join(__dirname, '..', 'uploads');
const reportUploadDir = path.join(uploadRoot, 'reports');
const medicineUploadDir = path.join(uploadRoot, 'medicines');

[uploadRoot, reportUploadDir, medicineUploadDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const fileNameBuilder = (file) => {
  const extension = path.extname(file.originalname);
  const baseName = path.basename(file.originalname, extension)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${Date.now()}-${baseName || 'file'}${extension}`;
};

const makeStorage = (destination) => multer.diskStorage({
  destination: (req, file, callback) => callback(null, destination),
  filename: (req, file, callback) => callback(null, fileNameBuilder(file)),
});

const reportFileFilter = (req, file, callback) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'text/plain',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    return callback(null, true);
  }

  return callback(createError('Only PDF, text, JPG, and PNG report files are allowed', 400));
};

const medicineFileFilter = (req, file, callback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    return callback(null, true);
  }

  return callback(createError('Only JPG, PNG, and WEBP medicine images are allowed', 400));
};

const maxFileSize = (Number(process.env.MAX_FILE_SIZE_MB) || 8) * 1024 * 1024;

const uploadReport = multer({
  storage: makeStorage(reportUploadDir),
  fileFilter: reportFileFilter,
  limits: { fileSize: maxFileSize },
});

const uploadMedicine = multer({
  storage: makeStorage(medicineUploadDir),
  fileFilter: medicineFileFilter,
  limits: { fileSize: maxFileSize },
});

module.exports = {
  uploadMedicine,
  uploadReport,
};
