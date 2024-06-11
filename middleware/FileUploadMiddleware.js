const multer = require("multer");
const path = require("path");

class FileUploadMiddleware {
  // Multer storage configuration

  constructor() {
    this.storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, "uploads/");
      },
      filename: function (req, file, cb) {
        req.body.fileName =
          file.fieldname + "-" + Date.now() + path.extname(file.originalname);
        cb(
          null,
          file.fieldname + "-" + Date.now() + path.extname(file.originalname)
        );
      },
    });

    // Handle multiple files
    this.cpUpload = multer({
      storage: this.storage,
      limits: {
        fileSize: 2000000,
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
          cb(null, true);
        } else {
          cb(new Error("Invalid file type"));
        }
      },
    }).array("images", 3);
  }

  fileUploadMiddleware = (req, res, next) => {
    this.cpUpload(req, res, function (err) {
      if (err) {
        return res.json({
          err: true,
          msg: err,
        });
      } else {
        next();
      }
    });
  };
}

module.exports = FileUploadMiddleware;
