const sql = require("mssql");
const { sqlConfig } = require("../config/config");

class DepartmentController {
  async getDepartment(req, res) {
    try {
      const pool = await new sql.ConnectionPool(sqlConfig).connect();
      const response = await pool
        .request()
        .query(`SELECT * FROM TBL_DEPARTMENT ORDER BY Id ASC`);
      if (response && response.recordset?.length > 0) {
        return res.json({
          err: false,
          status: "Ok",
          results: response.recordset,
        });
      }
    } catch (err) {
      return res.json({
        err: true,
        msg: "Database error!",
      });
    }
  }
}

module.exports = DepartmentController;
