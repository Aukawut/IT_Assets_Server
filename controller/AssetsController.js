const sql = require("mssql");

const { sqlConfig } = require("../config/config");
const Utils = require("../utils/Utils");
const UtilsInstance = new Utils(); // สร้าง Instance Class

class AssetsController {
  async getAllAssets(req, res) {
    try {
      const pool = await new sql.ConnectionPool(sqlConfig).connect();
      const response = await pool
        .request()
        .query(
          `SELECT a.*,b.NAME_STATUS,c.NAME_TYPE FROM [dbo].[TBL_ASSETS_LISTS] a LEFT JOIN TBL_ASSETS_STATUS b ON a.STATUS = b.ID_STATUS LEFT JOIN [dbo].[TBL_ASSETS_TYPES] c ON a.TYPE = c.[ID_TYPE]`
        );

      if (response && response.recordset?.length > 0) {
        return res.json({
          err: false,
          results: response.recordset,
          status: "Ok",
        });
      }
    } catch (err) {
      console.log(err);
      if (err) {
        return res.json({
          err: true,
          msg: err,
        });
      }
    }
  }

  async getTypeAssets(req, res) {
    try {
      const pool = await new sql.ConnectionPool(sqlConfig).connect();
      const response = await pool
        .request()
        .query(`SELECT * FROM TBL_ASSETS_TYPES ORDER BY ID_TYPE ASC`);

      if (response && response.recordset?.length > 0) {
        return res.json({
          err: false,
          results: response.recordset,
          status: "Ok",
        });
      }
    } catch (err) {
      console.log(err);
      if (err) {
        return res.json({
          err: true,
          msg: err,
        });
      }
    }
  }
  async addAssets(req, res) {
    const allImages = req.files;

    const {
      fixAssetsNo,
      serviceTag,
      computerName,
      owner,
      invoiceNo,
      location,
      department,
      type,
      price,
      receiveDate,
      status,
      warrantyDate,
      remark,
      username,
      performance,
      admin,
    } = req.body;
    if (
      !serviceTag ||
      !computerName ||
      !owner ||
      !location ||
      !department ||
      !type ||
      !price ||
      !receiveDate ||
      !status ||
      !performance ||
      !admin
    ) {
      return res.json({
        err: true,
        msg: "Please completed information !",
      });
    }

    const pool = await new sql.ConnectionPool(sqlConfig).connect();

    // เช็คซ้ำ
    const resultsOld = await pool
      .request()
      .input("sn", sql.NVarChar, serviceTag)
      .query("SELECT * FROM [dbo].[TBL_ASSETS_LISTS] WHERE SN = @sn");
    if (resultsOld && resultsOld.recordset?.length > 0) {
      console.log("Assets is duplicated!");
      return res.json({
        err: true,
        msg: "Assets is duplicated!",
      });
    }

    const saveAssets = await pool
      .request()
      .input("SN", sql.NVarChar, serviceTag) //PK
      .input("COMPUTER_NAME", sql.NVarChar, computerName)
      .input("MC_PERFORMANCE", sql.Int, parseInt(performance))
      .input("OWNER", sql.NVarChar, owner)
      .input("FIX_ASSET", sql.NVarChar, fixAssetsNo)
      .input("INVOICE_NO", sql.NVarChar, invoiceNo)
      .input("RECEIVE_DATE", sql.NVarChar, receiveDate)
      .input("DEPART_MENT", sql.NVarChar, department)
      .input("LOCATION", sql.NVarChar, location)
      .input("USERNAME", sql.NVarChar, username)
      .input("TYPE", sql.NVarChar, type)
      .input("REMARK", sql.NVarChar, remark)
      .input("STATUS", sql.NVarChar, status)
      .input("CREATED_BY", sql.NVarChar, admin)
      .input("EXPIRE_WARRANTY", sql.DateTime, warrantyDate)
      .input("PRICE", sql.Decimal, price)
      .query(
        `INSERT INTO TBL_ASSETS_LISTS (SN,COMPUTER_NAME,MC_PERFORMANCE,OWNER,FIX_ASSET,INVOICE_NO,RECEIVE_DATE,DEPART_MENT,LOCATION,USERNAME,TYPE,REMARK,STATUS,CREATED_AT,CREATED_BY,EXPIRE_WARRANTY,PRICE)
        VALUES (@SN,@COMPUTER_NAME,@MC_PERFORMANCE,@OWNER,@FIX_ASSET,@INVOICE_NO,@RECEIVE_DATE,@DEPART_MENT,@LOCATION,@USERNAME,@TYPE,@REMARK,@STATUS,GETDATE(),@CREATED_BY,@EXPIRE_WARRANTY,@PRICE)`
      );

    if (allImages?.length > 0) {
      await UtilsInstance.InsertImage(req, res); // upload file
    }

    if (saveAssets && saveAssets.rowsAffected[0]) {
      return res.json({
        err: false,
        msg: "Added!",
        status: "Ok",
      });
    }
  }

  async updateAssets(req, res) {
    const allImages = req.files;
    const { id } = req.params;
    const {
      fixAssetsNo,
      serviceTag,
      computerName,
      owner,
      invoiceNo,
      location,
      department,
      type,
      price,
      receiveDate,
      status,
      warrantyDate,
      remark,
      username,
      performance,
      admin,
    } = req.body;
    if (
      !serviceTag ||
      !computerName ||
      !owner ||
      !location ||
      !department ||
      !type ||
      !price ||
      !receiveDate ||
      !status ||
      !performance ||
      !admin
    ) {
      return res.json({
        err: true,
        msg: "Please completed information !",
      });
    }

    const pool = await new sql.ConnectionPool(sqlConfig).connect();

    //Old Data
    const oldComputer = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM [dbo].[TBL_ASSETS_LISTS] WHERE Id = @id");

    if (oldComputer && oldComputer.recordset?.length > 0) {
      const oldServiceTag = oldComputer.recordset[0]?.SN;

      // เช็คซ้ำ
      const resultsOld = await pool
        .request()
        .input("sn", sql.NVarChar, serviceTag)
        .input("oldServiceTag", sql.NVarChar, oldServiceTag)
        .query(
          "SELECT * FROM [dbo].[TBL_ASSETS_LISTS] WHERE SN = @sn AND SN != @oldServiceTag"
        );
      if (resultsOld && resultsOld.recordset?.length > 0) {
        console.log("Assets is duplicated!");
        return res.json({
          err: true,
          msg: "Assets is duplicated!",
        });
      }
    }

    const updateAssets = await pool
      .request()
      .input("SN", sql.NVarChar, serviceTag) //PK
      .input("COMPUTER_NAME", sql.NVarChar, computerName)
      .input("MC_PERFORMANCE", sql.Int, parseInt(performance))
      .input("OWNER", sql.NVarChar, owner)
      .input("FIX_ASSET", sql.NVarChar, fixAssetsNo)
      .input("INVOICE_NO", sql.NVarChar, invoiceNo)
      .input("RECEIVE_DATE", sql.NVarChar, receiveDate)
      .input("DEPART_MENT", sql.NVarChar, department)
      .input("LOCATION", sql.NVarChar, location)
      .input("USERNAME", sql.NVarChar, username)
      .input("TYPE", sql.NVarChar, type)
      .input("REMARK", sql.NVarChar, remark)
      .input("STATUS", sql.NVarChar, status)
      .input("UPDATED_BY", sql.NVarChar, admin)
      .input("EXPIRE_WARRANTY", sql.DateTime, warrantyDate)
      .input("PRICE", sql.Decimal, price)
      .input("id", sql.Int, id)
      .query(
        `UPDATE TBL_ASSETS_LISTS  SET SN = @SN,
        COMPUTER_NAME = @COMPUTER_NAME,MC_PERFORMANCE = @MC_PERFORMANCE,OWNER = @OWNER,
        FIX_ASSET = ,@FIX_ASSET,INVOICE_NO = @INVOICE_NO,RECEIVE_DATE = @RECEIVE_DATE,
        DEPART_MENT = @DEPART_MENT,LOCATION = @LOCATION,USERNAME = @USERNAME,
        TYPE = @TYPE,REMARK = @REMARK,STATUS = @STATUS,[UPDATED_AT] = GETDATE(),
        [UPDATED_BY] = @UPDATED_BY,EXPIRE_WARRANTY = @EXPIRE_WARRANTY,PRICE = @PRICE WHERE [Id] = @id`
      );

    if (allImages?.length > 0) {
      await UtilsInstance.InsertImage(req, res); // upload file
    }

    if (updateAssets && updateAssets.rowsAffected[0]) {
      return res.json({
        err: false,
        msg: "Updated!",
        status: "Ok",
      });
    }
  }
}

module.exports = AssetsController;
