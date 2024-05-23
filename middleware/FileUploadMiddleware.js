const multer = require("multer");
const path = require("path");
const axios = require("axios");
const { v4: uuidv4 } = require('uuid'); ;

class FileUploadMiddleware {
  // Multer storage configuration

  upload = multer();

  cpUpload = this.upload.fields([{ name: "images", maxCount: 3 }]);

  fileUploadMiddleware = (req, res, next) => {
    let countErrorSize = 0;
    let countErrorType = 0;
    this.cpUpload(req, res, function (err) {
      if (!req.files || !req.files.images) {
        next();
      } else {
        const images = req.files.images;
  
        for (let i = 0; i < images.length; i++) {
          if (
            path.extname(`${images[i].originalname}`) !== ".jpg" &&
            path.extname(`${images[i].originalname}`) !== ".png"
          ) {
            countErrorType += 1;
          }
          if (images[i].size > 1024 * 1024) {
            countErrorSize += 1;
          }
        }
        if (countErrorSize !== 0) {
          return res.json({
            err: true,
            msg: "Allowed upload files size less more 1 MB Only",
          });
        } else if (countErrorType !== 0) {
          return res.json({
            err: true,
            msg: "Allowed upload files type .png,.jpg Only",
          });
        } else if (images.length > 3) {
          return res.json({
            err: true,
            msg: "Allowed upload files less more 3 files only",
          });
        } else {
           next() ;
        }
      }
    });
  };


}

module.exports = FileUploadMiddleware;
