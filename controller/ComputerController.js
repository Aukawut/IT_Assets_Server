const { sqlConfig } = require("../config/config");
const Utils = require("../utils/Utils");
const sql = require("mssql");

const UtilsInstance = new Utils(); // สร้าง Instance Class

class ComputerController {
  // Function Get Computer
  async getComputerAll(req, res) {
    try {
      const pool = await new sql.ConnectionPool(sqlConfig).connect();

      const response = await pool
        .request()
        .query(
          `SELECT a.*,b.NAME_STATUS,c.NAME_TYPE FROM [dbo].[TBL_ASSETS_LISTS] a LEFT JOIN TBL_ASSETS_STATUS b ON a.STATUS = b.ID_STATUS LEFT JOIN [dbo].[TBL_ASSETS_TYPES] c ON a.TYPE = c.[ID_TYPE] WHERE c.NAME_TYPE IN ('PC','Notebook')`
        );
      if (response && response.recordset?.length > 0) {
        pool.close(); // ปิด Connection
        return res.json({
          err: false,
          results: response.recordset,
          status: "Ok",
        });
      }
    } catch (err) {
      return res.json({
        err: true,
        msg: err,
      });
    }
  }

  // Delete Computer
  async deleteComputer(req, res) {
    try {
      const id = req.params.id;
      const pool = await new sql.ConnectionPool(sqlConfig).connect();

      const listComputer = await pool
        .request()
        .input("id", sql.Int, id)
        .query(`SELECT * FROM TBL_ASSETS_LISTS WHERE Id = @id`);

      if (listComputer && listComputer.recordset?.length > 0) {
        const oldSN = listComputer.recordset[0]?.SN;
        // ถ้าไม่มีข้อมูล Return to client
        if (oldSN == null || oldSN == "" || !oldSN) {
          return res.json({
            err: true,
            msg: "Service Tags is empty!",
          });
        }
        // ลบจากตาราง Assets
        await pool
          .request()
          .input("id", sql.Int, id)
          .query(`DELETE FROM TBL_ASSETS_LISTS WHERE Id = @id`);

        // ลบจากตาราง TBL_COMPUTER_DETAILS
        await pool
          .request()
          .input("sn", sql.NVarChar, oldSN)
          .query(`DELETE FROM TBL_COMPUTER_DETAILS WHERE SN = @sn`);

        const images = await pool
          .request()
          .input("sn", sql.NVarChar, oldSN)
          .query(`SELECT * FROM TBL_IMAGES_ASSETS WHERE SN_ASSETS = @sn`);

        // ถามีการอัพโหลดรูปภาพ
        if (images && images.recordset?.length > 0) {
          // ลบจากตารางรูป
          await pool
            .request()
            .input("sn", sql.NVarChar, oldSN)
            .query(`DELETE FROM TBL_IMAGES_ASSETS WHERE SN_ASSETS = @sn`);

          UtilsInstance.removeImageInFolder(images.recordset); // ลบ File จาก Folder Server PHP
        }

        pool.close(); // ปิด Connection

        return res.json({
          err: false,
          msg: "Computer Deleted !",
          status: "Ok",
        });
      } else {
        return res.json({
          err: true,
          msg: "Computer isn't found !",
          status: "Ok",
        });
      }
    } catch (err) {
      return res.json({
        err: true,
        msg: err,
      });
    }
  }

  // Spec
  async getSpecComputer(req, res) {
    try {
      const sn = req.params.sn;
      const pool = await new sql.ConnectionPool(sqlConfig).connect();

      const response = await pool
        .request()
        .input("sn", sql.NVarChar, sn)
        .query(`SELECT * FROM TBL_COMPUTER_DETAILS WHERE SN = @sn`);
      if (response) {
        pool.close(); // ปิด Connection
        return res.json({
          err: false,
          results: response.recordset,
          status: "Ok",
        });
      }
    } catch (err) {
      return res.json({
        err: true,
        msg: err,
      });
    }
  }

  // Spec
  async getListsOSComputer(req, res) {
    try {
      const pool = await new sql.ConnectionPool(sqlConfig).connect();

      const response = await pool.query(
        `SELECT * FROM TBL_OS_LISTS ORDER BY Id ASC`
      );
      if (response) {
        pool.close(); // ปิด Connection
        return res.json({
          err: false,
          results: response.recordset,
          status: "Ok",
        });
      }
    } catch (err) {
      return res.json({
        err: true,
        msg: err,
      });
    }
  }

  async addComputer(req, res) {
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
      brand,
      model,
      cpu,
      ram,
      ramDetail,
      storage,
      storageDetail,
      monitor,
      osSystem,
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
      !brand ||
      !model ||
      !cpu ||
      !ram ||
      !ramDetail ||
      !storage ||
      !storageDetail ||
      !monitor ||
      !osSystem ||
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

    const saveSpec = await pool
      .request()
      .input("SN", sql.NVarChar, serviceTag) //FK
      .input("RAM", sql.NVarChar, ram)
      .input("CPU", sql.NVarChar, cpu)
      .input("STORAGE", sql.NVarChar, storage)
      .input("MONITOR", sql.NVarChar, monitor)
      .input("MODEL", sql.NVarChar, model)
      .input("OS_SYSTEM", sql.NVarChar, osSystem)
      .input("BRANDE", sql.NVarChar, brand)
      .input("RAM_DETAILS", sql.NVarChar, ramDetail)
      .input("STORAGE_DETAILS", sql.NVarChar, storageDetail)
      .query(
        `INSERT INTO TBL_COMPUTER_DETAILS (SN,RAM,CPU,STORAGE,MONITOR,MODEL,OS_SYSTEM,BRANDE,RAM_DETAILS,STORAGE_DETAILS) 
        VALUES (@SN,@RAM,@CPU,@STORAGE,@MONITOR,@MODEL,@OS_SYSTEM,@BRANDE,@RAM_DETAILS,@STORAGE_DETAILS)`
      );

    if (
      saveAssets &&
      saveAssets.rowsAffected[0] > 0 &&
      saveSpec &&
      saveSpec.rowsAffected[0] > 0
    ) {
      await UtilsInstance.sendFileToPHP(req, res); // upload file

      return res.json({
        err: false,
        msg: "Added!",
        status: "Ok",
      });
    }
  }

  async updateComputer(req, res) {

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
      brand,
      model,
      cpu,
      ram,
      ramDetail,
      storage,
      storageDetail,
      monitor,
      osSystem,
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
      !brand ||
      !model ||
      !cpu ||
      !ram ||
      !ramDetail ||
      !storage ||
      !storageDetail ||
      !monitor ||
      !osSystem ||
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
      .input("id", sql.NVarChar, id)
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
        .input("EXPIRE_WARRANTY", sql.DateTime, warrantyDate)
        .input("PRICE", sql.Decimal, price)
        .input("admin", sql.NVarChar, admin)
        .input("id", sql.Int, id)
        .query(
          `UPDATE TBL_ASSETS_LISTS SET SN = @SN,COMPUTER_NAME = @COMPUTER_NAME,MC_PERFORMANCE = @MC_PERFORMANCE,OWNER = @OWNER,FIX_ASSET = @FIX_ASSET,INVOICE_NO = @INVOICE_NO,RECEIVE_DATE = @RECEIVE_DATE,DEPART_MENT = @DEPART_MENT,LOCATION = @LOCATION,USERNAME = @USERNAME,TYPE = @TYPE,REMARK = @REMARK,STATUS = @STATUS,UPDATED_AT = GETDATE(),EXPIRE_WARRANTY = @EXPIRE_WARRANTY,PRICE = @PRICE,UPDATED_BY = @admin WHERE Id = @id`
        );

      const updateSpec = await pool
        .request()
        .input("SN", sql.NVarChar, serviceTag) //FK
        .input("RAM", sql.NVarChar, ram)
        .input("CPU", sql.NVarChar, cpu)
        .input("STORAGE", sql.NVarChar, storage)
        .input("MONITOR", sql.NVarChar, monitor)
        .input("MODEL", sql.NVarChar, model)
        .input("OS_SYSTEM", sql.NVarChar, osSystem)
        .input("BRANDE", sql.NVarChar, brand)
        .input("RAM_DETAILS", sql.NVarChar, ramDetail)
        .input("STORAGE_DETAILS", sql.NVarChar, storageDetail)
        .input("serviceTag", sql.NVarChar, oldServiceTag)
        .query(
          `UPDATE TBL_COMPUTER_DETAILS SET SN = @SN,RAM = @RAM,CPU = @CPU,STORAGE = @STORAGE,MONITOR = @MONITOR,MODEL = @MODEL,OS_SYSTEM = @OS_SYSTEM,BRANDE = @BRANDE,RAM_DETAILS = @RAM_DETAILS,STORAGE_DETAILS = @STORAGE_DETAILS WHERE SN = @serviceTag`
        );

      if (
        updateAssets &&
        updateAssets.rowsAffected[0] > 0 &&
        updateSpec &&
        updateSpec.rowsAffected[0] > 0
      ) {
        await UtilsInstance.sendFileToPHP(req, res); // upload file

        return res.json({
          err: false,
          msg: "Updated!",
          status: "Ok",
        });
      }
    }
  }

  async getPerformanceList(req, res) {
    const pool = await new sql.ConnectionPool(sqlConfig).connect();
    const lists = await pool
      .request()
      .query("SELECT  * FROM [dbo].[TBL_MC_PERFORMANCE] ORDER BY Id ASC");
    if (lists && lists.recordset?.length > 0) {
      return res.json({
        err: false,
        results: lists.recordset,
        status: "Ok",
      });
    } else {
      return res.json({
        err: true,
        results: [],
      });
    }
  }
  async getImageBySN(req, res) {
    const serviceTag = req.params.sn;
    const pool = await new sql.ConnectionPool(sqlConfig).connect();
    const images = await pool
      .request()
      .input("sn", sql.NVarChar, serviceTag)
      .query("SELECT  * FROM [dbo].[TBL_IMAGES_ASSETS] WHERE SN_ASSETS = @sn");
    if (images && images.recordset?.length > 0) {
      return res.json({
        err: false, 
        results: images.recordset,
        status: "Ok",
      });
    } else {
      return res.json({
        err: false,
        status:"Ok",
        results: [],
      });
    }
  }
  async deleteImageByFile(req, res) {
    const { fileName } = req.body;
    console.log(fileName);
    const pool = await new sql.ConnectionPool(sqlConfig).connect();
    const images = await pool
      .request()
      .input("fileName", sql.NVarChar, fileName)
      .query(
        "DELETE FROM [dbo].[TBL_IMAGES_ASSETS] WHERE IMAGE_NAME = @fileName"
      );
    if (images && images.rowsAffected[0] > 0) {
      UtilsInstance.removeImageInByFile(fileName); // ลบไฟล์จาก Folder Share file - Apache Server

      return res.json({
        err: false,
        msg: "File Deleted!",
        status: "Ok",
      });
    } else {
      return res.json({
        err: true,
        results: [],
      });
    }
  }
}

module.exports = ComputerController;
