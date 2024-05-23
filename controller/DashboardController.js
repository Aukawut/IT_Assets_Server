const { sqlConfig } = require("../config/config");
const sql = require("mssql");

class DashboardController {
  async getReportCompareAssetStock(req, res) {
    try {
      const pool = await new sql.ConnectionPool(sqlConfig).connect();

      const response = await pool
        .request()
        .query(
          `SELECT a.* FROM [DB_ITINVENTORY].[dbo].[V_SummaryReportCompareAssetByMonth] a ORDER BY a.year,a.month`
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

  async getReportCompareAssetStockByYear(req, res) {
    const year = req.params.year;

    try {
      const pool = await new sql.ConnectionPool(sqlConfig).connect();

      const response = await pool
        .request()
        .input("year", sql.NVarChar, year)
        .query(
          `SELECT a.* FROM [DB_ITINVENTORY].[dbo].[V_SummaryReportCompareAssetByMonth] a WHERE a.year = @year ORDER BY a.year,a.month`
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

  async getYearOptions(req, res) {

    try {
      const pool = await new sql.ConnectionPool(sqlConfig).connect();

      const response = await pool
        .request()
        .query(
          `SELECT COUNT(*) as amount,a.year FROM [DB_ITINVENTORY].[dbo].[V_SummaryReportCompareAssetByMonth]a GROUP BY a.year`
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

  async getTop5Assets(req, res) {

    try {
      const pool = await new sql.ConnectionPool(sqlConfig).connect();

      const response = await pool
        .request()
        .query(
          `WITH CTE_TOP5 AS (
            SELECT TOP 5  COUNT(*) as amount ,a.TYPE FROM [DB_ITINVENTORY].[dbo].[TBL_ASSETS_LISTS] a 
            GROUP BY a.TYPE ORDER BY COUNT(*) DESC)
            SELECT CTE_TOP5.*,[TBL_ASSETS_TYPES].NAME_TYPE  FROM CTE_TOP5 LEFT JOIN [dbo].[TBL_ASSETS_TYPES] ON CTE_TOP5.TYPE = [TBL_ASSETS_TYPES].ID_TYPE`
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
  async getAmountOverview(req,res) {

    try {
      const pool = await new sql.ConnectionPool(sqlConfig).connect();

      const response = await pool
        .request()
        .query(
          `SELECT * FROM V_Overview_Dashboard`
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
}
module.exports = DashboardController;
