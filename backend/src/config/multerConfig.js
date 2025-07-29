const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Assicurati che la directory uploads esista
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configurazione storage per multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Crea directory specifica per venue se non esiste
    const venueDir = path.join(uploadsDir, 'venues');
    if (!fs.existsSync(venueDir)) {
      fs.mkdirSync(venueDir, { recursive: true });
    }
    cb(null, venueDir);
  },
  filename: function (req, file, cb) {
    // Genera nome file unico con timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `venue-${req.params.id || 'unknown'}-${uniqueSuffix}${ext}`);
  }
});

// Filtro per accettare solo immagini
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Solo file immagine sono permessi (jpeg, jpg, png, gif, webp)'));
  }
};

// Configurazione multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limite
    files: 5 // Massimo 5 file per upload
  },
  fileFilter: fileFilter
});

module.exports = {
  upload,
  uploadsDir
}; 