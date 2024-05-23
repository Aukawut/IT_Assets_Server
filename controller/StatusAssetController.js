const sql = require("mssql");

const { sqlConfig } = require("../config/config");

class StatusAssetController {
    async getStatus(req,res) {
        try {
            const pool = await new sql.ConnectionPool(sqlConfig).connect();
            const response = await pool
              .request()
              .query(`SELECT * FROM TBL_ASSETS_STATUS ORDER BY ID_STATUS ASC`);
      
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


}
module.exports = StatusAssetController ;