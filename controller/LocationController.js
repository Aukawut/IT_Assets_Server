const { sqlConfig } = require("../config/config");
const sql = require("mssql");

class LocationController {
  async getLocation(req, res) {
    try {
      const pool = await new sql.ConnectionPool(sqlConfig).connect();
      const result = await pool
        .request()
        .query(
          "SELECT * FROM TBL_LOCATION WHERE STATUS = 'USE' ORDER BY Id ASC"
        );
      if (result.recordset?.length > 0) {
        return res.json({
          err: false,
          results: result.recordset,
          status: "Ok",
        });
      }
    } catch (err) {
      console.log(err);
      return res.json({
        err: true,
        msg: "DB Error!",
      });
    }
  }
}
module.exports = LocationController;
