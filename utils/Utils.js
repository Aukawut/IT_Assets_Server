const sql = require("mssql");
const { sqlConfig } = require("../config/config");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

class Utils {
  // Multer storage configuration

  getToken(payload) {
    const secretKey = process.env.JWT_SECRET;
    const token = jwt.sign(payload, secretKey, {
      expiresIn: "4h",
    });

    return token;
  }

  async getHRInfomation(username) {
    const getRole = async () => {
      const pool = await new sql.ConnectionPool(sqlConfig).connect(); // App

      // Query seach admin
      const responseRole = await pool
        .request()
        .input("username", sql.NVarChar, username)
        .query(
          `SELECT * FROM [dbo].[TBL_USERS] WHERE [USERNAME_AD] = @username AND [ROLE] = 1`
        );
      if (responseRole && responseRole.recordset?.length > 0) {
        pool.close(); //ปิด Connection ;

        return { err: false, data: responseRole.recordset[0] };
      } else {
        return { err: true, msg: "Permission is denined!" };
      }
    };

    const getUser = async () => {
      try {
        const poolDb = await new sql.ConnectionPool(
          sqlConfig
        ).connect(); // App03
        const response = await poolDb
          .request()
          .input("username", sql.NVarChar, username)
          .query(
            `SELECT * FROM [DB_ITDATA].[dbo].V_AD_LINK_HRS WHERE AD_UserLogon = @username`
          );
        if (response && response.recordset?.length > 0) {
          poolDb.close();
          return { err: false, data: response?.recordset[0] };
        }
      } catch (err) {
        return { err: true, msg: "Database error!", err: err };
      }
    };
    const roleData = await getRole(username);
    const userData = await getUser(username);

    if (!roleData.err && !userData.err) {
     
      const payload = {
        username: userData.data.AD_UserLogon,
        short_department: userData.data.UHR_Department,
        emp_code: userData.data.UHR_EmpCode,
        firstName: userData.data.UHR_FirstName_en,
        lastName: userData.data.UHR_LastName_en,
        role: roleData.data.ROLE,
      };

      return { err: false, payload:payload };
    } else {
      
      return { err: true, msg: "Error found user!" };
    }
  }

  async sendFileToPHP(req, res) {
    const uploadTophp = async () => {
      await axios
        .post(
          `${process.env.SERVER_API_MOVE_FILE}/SharePictureAssetsIT/index.php`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        )
        .then((response) => {
          // Handle PHP backend response if needed
          return true;
        })
        .catch((error) => {
          console.error("Error uploading files to PHP backend:", error);
          return false;
        });
    };

    const serviceTag = req.body.serviceTag;

    const images = req.files.images;

    // Send files to PHP backend
    const formData = new FormData();
    for (let i = 0; i < images?.length; i++) {
      const uuid = uuidv4(); //Unique

      // สร้าง ฺBlob File
      const fileBlob = new Blob([images[i].buffer], {
        type: images[i].mimetype,
      });

      // Unique + Timestamp + นามสกุลไฟล์
      const fileName = `${uuid}${Date.now()}${path.extname(
        `${images[i].originalname}`
      )}`;

      // Append Key images[] ส่งไป PHP เพื่อทำการ Upload ไปที่ FileShare
      formData.append("images[]", fileBlob, fileName);

      // Save data to TBL_IMAGES_ASSETS
      const pool = await new sql.ConnectionPool(sqlConfig).connect();

      await pool
        .request()
        .input("serviceTag", sql.NVarChar, serviceTag)
        .input("imageName", sql.NVarChar, fileName)
        .query(
          `INSERT INTO TBL_IMAGES_ASSETS (SN_ASSETS,IMAGE_NAME) VALUES (@serviceTag,@imageName)`
        )
        .then(async (result, err) => {
          if (err) {
            pool.close();
            return false;
          } else {
            pool.close();

            await uploadTophp(); // send file to php server
          }
        })
        .catch((err) => {
          if (err) {
            pool.close();
            console.log(err);
            return false;
          }
        });
    }
  }
  async removeImageInFolder(listImage) {
    //send array
    try {
      const response = await axios.post(
        `${process.env.SERVER_API_MOVE_FILE}/SharePictureAssetsIT/unlinkImage.php`,
        {
          router: "unlinkImage",
          images: listImage,
        }
      );
      if (!response.data.err) {
        console.log("Unlink !");
      } else {
        console.log("Not Unlink !");
      }
    } catch (err) {
      cosole.log(err);
    }
  }

  async removeImageInByFile(imageName) {
    //send array
    try {
      const response = await axios.post(
        `${process.env.SERVER_API_MOVE_FILE}/SharePictureAssetsIT/unlinkImage.php`,
        {
          router: "unlinkImageByFile",
          images: imageName,
        }
      );
      if (!response.data.err) {
        console.log("Unlink !");
      } else {
        console.log("Not Unlink !");
      }
    } catch (err) {
      cosole.log(err);
    }
  }
  async stockOut(partCode, dateInStock, amount) {
    const pool = await new sql.ConnectionPool(sqlConfig).connect(); // App
    let stockCuted = 0;
    // dateInStock = array ;

    // เริ่ม Loop
    for (let i = 0; i < dateInStock?.length; i++) {
      // Query seach admin
      const resultStock = await pool
        .request()
        .input("code", sql.NVarChar, partCode)
        .input("DATE", sql.DateTime, dateInStock[i])
        .query(
          `SELECT * FROM TBL_STOCK_IT WHERE PART_CODE  = @code AND DATE_STOCKIN = @DATE`
        );

      if (resultStock && resultStock.recordset?.length > 0) {
        stockCuted++;
        let remainLasted = Number(resultStock.recordset[0].REMAIN) - 1;
        let pickUp = Number(resultStock.recordset[0].SUPPLY) + 1;
        await pool
          .request()
          .input("code", sql.NVarChar, partCode)
          .input("DATE", sql.DateTime, dateInStock[i])
          .input("REMAIN", sql.Decimal, remainLasted)
          .input("SUPPLY", sql.Decimal, pickUp)
          .query(
            `UPDATE TBL_STOCK_IT SET REMAIN = @REMAIN,SUPPLY = @SUPPLY WHERE PART_CODE = @code AND DATE_STOCKIN = @DATE`
          );
      }
    }
    // จบ Loop

    // ถ้า Loop ตัด Stock เสร็จ และที่เบิกมา //FIFO
    if (Number(stockCuted) === Number(amount)) {
      console.log("Ok");
    }
  }
}

module.exports = Utils;
