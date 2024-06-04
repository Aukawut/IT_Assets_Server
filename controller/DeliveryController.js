const sql = require("mssql");
const { sqlConfig } = require("../config/config.js");
class DeliveryController {
  async getEquipment(req, res) {
    const pool = await new sql.ConnectionPool(sqlConfig).connect();

    const results = await pool
      .request()
      .query(`SELECT * FROM TBL_DELIVERY_ITEMLISTS ORDER BY Id ASC`);
  }
}
module.exports = DeliveryController;
