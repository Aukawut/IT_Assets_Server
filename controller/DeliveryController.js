const sql = require("mssql");
const { sqlConfig } = require("../config/config.js");
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
    const { serviceTag } = req.body;
    try {
      const pool = await new sql.ConnectionPool(sqlConfig).connect();

      // หาเลข Delivery Code ล่าสุดแล้วจัด Format yyyymmdd-runningNo
      const results = await pool
        .request()
        .input("sn", sql.NVarChar, serviceTag)
        .query(
          `select a.BEFORE_DOC,LEFT(a.BEFORE_DOC,8)+'-'+a.LAST_DOC as LAST_DOC from (
            select top 1 [DocNo] as BEFORE_DOC ,
            right(cast(CAST(RIGHT([DocNo],3) as Int) + 1  + + 1000 as varchar(5)),3) as LAST_DOC
            from [dbo].[V_MasterDeliveryComputer] 
            WHERE [ServiceTag] = @sn AND LEFT([DocNo],8) =	CONVERT(VARCHAR, GETDATE(), 112)
            ORDER BY [DocNo] DESC) a`
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
}
module.exports = DeliveryController;
