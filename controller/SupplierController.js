const sql = require("mssql");
const { sqlConfig } = require("../config/config");

class SupplierController {
  async getSupplierList(req, res) {
    try {
      const pool = await new sql.ConnectionPool(sqlConfig).connect();
      const results = await pool
        .request()
        .query(`SELECT * FROM TBL_SUPPLIER ORDER BY SUPPLIER_CODE ASC`);
      if (results && results.recordset?.length > 0) {
        pool.close();
        return res.json({
          err: false,
          results: results.recordset,
          status: "Ok",
        });
      } else {
        pool.close();
        return res.json({
          err: true,
          msg: "Not Found!",
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

module.exports = SupplierController;
