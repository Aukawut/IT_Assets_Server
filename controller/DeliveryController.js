const sql = require("mssql");
const { sqlConfig } = require("../config/config.js");
const moment = require("moment");
const { v4: uuidv4 } = require("uuid");

class DeliveryController {
  async getEquipment(req, res) {
    try {
      const pool = await new sql.ConnectionPool(sqlConfig).connect();

      const results = await pool
        .request()
        .query(`SELECT * FROM TBL_DELIVERY_ITEMLISTS ORDER BY Id ASC`);
      if (results && results?.recordset?.length > 0) {
        pool.close();
        return res.json({
          err: false,
          results: results?.recordset,
          status: "Ok",
        });
      } else {
        pool.close();
        return res.json({
          err: false,
          msg: "not found!",
        });
      }
    } catch (err) {
      return res.json({
        err: true,
        msg: err,
      });
    }
  }
  async deliveryComputer(req, res) {
    // กด Print Form จาก Web;

    const { receiverCode, serviceTag, adminCode } = req.body;

    try {
      const pool = await new sql.ConnectionPool(sqlConfig).connect();
      const results = await pool
        .request()
        .input("sn", sql.NVarChar, serviceTag)
        .input("receiverCide", sql.NVarChar, receiverCode)
        .input("admin", sql.NVarChar, adminCode)
        .query(
          `INSERT INTO TBL_DELIVERY_COMPUTER ([SN],[RECEIVER_CODE],[CREATED_BY]) 
          VALUES (@sn,@receiverCide,@admin)`
        );
      if (results && results?.recordset?.length > 0) {
        // Close connection Return ค่ากลับ
        pool.close();
        return res.json({
          err: false,
          results: results?.recordset,
          status: "Ok",
        });
      } else {
        // Close connection Return ค่ากลับ
        pool.close();
        return res.json({
          err: false,
          msg: "not found!",
        });
      }
    } catch (err) {
      return res.json({
        err: true,
        msg: err,
      });
    }
  }
  

  async getLastDocNo(req, res) {
    try {
      const docNo = `D${moment(new Date()).format("YYYYMMDD")}-001`;
      const pool = await new sql.ConnectionPool(sqlConfig).connect();

      // หาเลข Delivery Code ล่าสุดแล้วจัด Format yyyymmdd-runningNo
      const results = await pool.request().query(
        `select top 1 [Id],[SN],[CREATED_BY],[ORDER_NO],
	        'D'+ CONVERT(VARCHAR, GETDATE(), 112)+'-'+
	        RIGHT(REPLICATE('0', 3) + CAST(CAST([ORDER_NO] AS INT) + 1 AS VARCHAR(5)), 3) AS DOC_NO
          FROM [dbo].[TBL_DELIVERY_COMPUTER]
          WHERE CONVERT(VARCHAR, GETDATE(), 112) = CONVERT(VARCHAR, [CREATED_AT], 112) ORDER BY ORDER_NO DESC`
      );
      if (results && results?.recordset?.length > 0) {
        // Close connection Return ค่ากลับ
        pool.close();
        return res.json({
          err: false,
          results: results?.recordset,
          status: "Ok",
          docNo: results?.recordset[0].DOC_NO,
        });
      } else {
        // Close connection Return ค่ากลับ

        pool.close();
        return res.json({
          err: false,
          results: [],
          status: "Ok",
          docNo: docNo,
        });
      }
    } catch (err) {
      console.log(err);
      return res.json({
        err: true,
        msg: err,
      });
    }
  }

  async insertDoc(req, res) {
    // equipment = id item -> array
    const { equipment, sn, remark, createdBy,forUser } = req.body;
    console.log(req.body);
    if (!sn || !forUser) {
      return res.json({
        err: true,
        msg: "Service Tag is empty!",
      });
    }
    try {

      const pool = await new sql.ConnectionPool(sqlConfig).connect();
      const oldData = await pool
        .request()
        .query(
          `SELECT TOP 1 * from [dbo].[TBL_DELIVERY_COMPUTER] WHERE CONVERT(VARCHAR, GETDATE(), 112) = CONVERT(VARCHAR, [CREATED_AT], 112) ORDER BY [ORDER_NO] DESC`
        );
      const docNo =
        oldData && oldData?.recordset?.length > 0
          ? parseInt(oldData?.recordset[0].ORDER_NO) + 1
          : 1;

      const insert = await pool
        .request()
        .input("sn", sql.NVarChar, sn)
        .input("by", sql.NVarChar, createdBy)
        .input("no", sql.Int, docNo)
        .input("remark", sql.NVarChar, remark)
        .input("for", sql.NVarChar, forUser)
        .query(
          `INSERT INTO [dbo].[TBL_DELIVERY_COMPUTER] 
          ([SN],[CREATED_BY],[ORDER_NO],[REMARK],[FOR_USER]) VALUES (@sn,@by,@no,@remark,@for)`
        );

      if (equipment?.length > 0) {
        for(let i = 0;i<equipment?.length ;i++){
     
        const save =   await pool
            .request()
            .input("sn", sql.NVarChar, sn)
            .input("no", sql.Int, docNo)
            .input("itemId", sql.Int, equipment[i].Id)
            .query(
              `INSERT INTO [dbo].[TBL_DELIVERY_EQUIPMENT] 
            ([SN],[ORDER_NO],[ID_ITEMLISTS]) VALUES (@sn,@no,@itemId)`
            );
            if(save) {
              console.log("save!");
            }
          }
        
      }

      if (insert && insert?.rowsAffected[0] > 0) {
        // Close connection Return ค่ากลับ
        pool.close();
        return res.json({
          err: false,
          msg: "Document inserted!",
          status: "Ok"
        });
      } else {
        // Close connection Return ค่ากลับ

        pool.close();
        return res.json({
          err: true,
          msg: "Database error"
        });
      }
    } catch (err) {
      return res.json({
        err: true,
        msg: err,
      });
    }
  }
}
module.exports = DeliveryController;
