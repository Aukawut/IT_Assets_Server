const { sqlConfig } = require("../config/config");
const sql = require("mssql");

class UserController {
  async getUsers(req, res) {
    try {
      const poolDb = await new sql.ConnectionPool(sqlConfig).connect();
      const response = await poolDb.request()
        .query(`SELECT LOWER(a.[AD_UserLogon]) as UHR_Username,a.UHR_EmpCode,LOWER(a.[AD_UserLogon])+' - '+(a.UHR_FirstName_en+' '+a.UHR_LastName_en)+(' ('+a.[UHR_Department]+')') as USER_Details 
        FROM [DB_ITDATA].[dbo].[V_AD_LINK_HRS]  a 
              WHERE [AD_UserLogon] IS NOT NULL AND [AD_UserLogon] != ''`);

      if (response && response.recordset?.length > 0) {
        poolDb.close(); // ปิด Connection
        return res.json({
          err: false,
          results: response.recordset,
          status: "Ok",
        });
      } else {
        return res.json({
          err: true,
          msg: "User is not found!",
        });
      }
    } catch (error) {
      console.error("Error connecting to SQL Server:", error);
    }
  }
}
module.exports = UserController;
