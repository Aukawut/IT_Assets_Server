const sql = require("mssql");
const { sqlConfig } = require("../config/config");

class LicenseController {
  // getLicense
  async getLicense(req, res) {
    const pool = await new sql.ConnectionPool(sqlConfig).connect();
    const response = await pool.request()
      .query(`SELECT TBL_LICENSE_LISTS.*,TBL_LICENSE_TYPE.Id as Id_Type,TBL_SUPPLIER.SUPPLIER_NAME,
      TBL_LICENSE_TYPE.LIC_TYPE_TH FROM [DB_ITINVENTORY].[dbo].[TBL_LICENSE_LISTS] 
      LEFT JOIN [dbo].[TBL_LICENSE_TYPE] ON [TBL_LICENSE_LISTS].LICENSE_TYPE = TBL_LICENSE_TYPE.Id 
	    LEFT JOIN [dbo].TBL_SUPPLIER ON TBL_SUPPLIER.SUPPLIER_CODE = [TBL_LICENSE_LISTS].SUPPLIER_CODE	  
	    ORDER BY TBL_LICENSE_LISTS.Id DESC`);

    if (response && response.recordset?.length > 0) {
      pool.close();
      return res.json({
        err: false,
        results: response.recordset,
        status: "Ok",
      });
    } else {
      return res.json({ err: false, results: [], status: "Ok" });
    }
  }
  // get Licnese by Id
  async getLicenseById(req, res) {
    const pool = await new sql.ConnectionPool(sqlConfig).connect();
    const { id } = req.params;
    const response = await pool
      .request()
      .input("id", sql.NVarChar, id)
      .query(`SELECT * FROM TBL_LICENSE_LISTS WHERE Id = @id`);

    if (response && response.recordset?.length > 0) {
      pool.close();
      return res.json({ err: false, results: response.recordset });
    } else {
      return res.json({ err: true, results: [] });
    }
  }

  //Option
  async getOptionLicenseType(req, res) {
    const pool = await new sql.ConnectionPool(sqlConfig).connect();
    const response = await pool
      .request()
      .query(`SELECT * FROM TBL_LICENSE_TYPE ORDER BY Id`);

    if (response && response.recordset?.length > 0) {
      pool.close();
      return res.json({
        err: false,
        results: response.recordset,
        status: "Ok",
      });
    }
  }

  async addLicense(req, res) {
    const {
      license,
      activedKey,
      licenseType,
      expDate,
      active,
      qty,
      price,
      suplierCode,
      invoiceNo,
      receiveDate,
      createBy,
      remark,
    } = req.body;

    if (
      (!license,
      !licenseType,
      !active,
      !qty,
      !price,
      !suplierCode,
      !receiveDate,
      !createBy)
    ) {
      return res.json({
        err: true,
        msg: "Data is required!",
      });
    }

    try {
      const pool = await new sql.ConnectionPool(sqlConfig).connect();
      const results = await pool
        .request()
        .input("LICENSE", sql.NVarChar, license)
        .input("ACTIVED_KEY", sql.NVarChar, activedKey)
        .input("LICENSE_TYPE", sql.Int, licenseType)
        .input("EXPIRE_DATE", sql.NVarChar, expDate)
        .input("ACTIVE", sql.NVarChar, active)
        .input("QTY", sql.Int, qty)
        .input("PRICE", sql.Decimal, price)
        .input("SUPPLIER_CODE", sql.NVarChar, suplierCode)
        .input("INVOICE_NO", sql.NVarChar, invoiceNo)
        .input("RECEIVE_DATE", sql.NVarChar, receiveDate)
        .input("CREATED_BY", sql.NVarChar, createBy)
        .input("REMARK", sql.NVarChar, remark)
        .query(`INSERT INTO TBL_LICENSE_LISTS (LICENSE,ACTIVED_KEY,LICENSE_TYPE,EXPIRE_DATE,ACTIVE,QTY,PRICE,SUPPLIER_CODE,INVOICE_NO,RECEIVE_DATE,CREATED_BY,REMARK) 
        VALUES (@LICENSE,@ACTIVED_KEY,@LICENSE_TYPE,@EXPIRE_DATE,@ACTIVE,@QTY,@PRICE,@SUPPLIER_CODE,@INVOICE_NO,@RECEIVE_DATE,@CREATED_BY,@REMARK)`);
      if (results && results.rowsAffected[0] > 0) {
        pool.close(); // Close connection
        return res.json({
          err: false,
          msg: "Lincense added!",
          status: "Ok",
        });
      } else {
        pool.close(); // Close connection
        return res.json({
          err: true,
          msg: "Not Found!",
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

  async updateLicense(req, res) {
    const { id } = req.params;
    const {
      license,
      activedKey,
      licenseType,
      expDate,
      active,
      qty,
      price,
      suplierCode,
      invoiceNo,
      receiveDate,
      updateBy,
      remark,
    } = req.body;

    if (
      (!license,
      !licenseType,
      !active,
      !qty,
      !price,
      !suplierCode,
      !receiveDate,
      !updateBy)
    ) {
      return res.json({
        err: true,
        msg: "Data is required!",
      });
    }
    console.log(req.body);
    try {
      const pool = await new sql.ConnectionPool(sqlConfig).connect();
      const results = await pool
        .request()
        .input("LICENSE", sql.NVarChar, license)
        .input("ACTIVED_KEY", sql.NVarChar, activedKey)
        .input("LICENSE_TYPE", sql.Int, licenseType)
        .input("EXPIRE_DATE", sql.NVarChar, expDate)
        .input("ACTIVE", sql.NVarChar, active)
        .input("QTY", sql.Int, qty)
        .input("PRICE", sql.Decimal, price)
        .input("SUPPLIER_CODE", sql.NVarChar, suplierCode)
        .input("INVOICE_NO", sql.NVarChar, invoiceNo)
        .input("RECEIVE_DATE", sql.NVarChar, receiveDate)
        .input("UPDATED_BY", sql.NVarChar, updateBy)
        .input("REMARK", sql.NVarChar, remark)
        .input("id", sql.Int, id)
        .query(
          `UPDATE TBL_LICENSE_LISTS SET LICENSE = @LICENSE,ACTIVED_KEY = @ACTIVED_KEY,LICENSE_TYPE = @LICENSE_TYPE,EXPIRE_DATE = @EXPIRE_DATE,ACTIVE = @ACTIVE,QTY = @QTY,PRICE = @PRICE,SUPPLIER_CODE = @SUPPLIER_CODE,INVOICE_NO = @INVOICE_NO,RECEIVE_DATE = @RECEIVE_DATE,UPDATED_BY = @UPDATED_BY,REMARK = @REMARK,LASTUPDATED_AT = GETDATE() WHERE Id = @id`
        );
      if (results && results.rowsAffected[0] > 0) {
        pool.close(); // Close connection
        return res.json({
          err: false,
          msg: "Lincense updated!",
          status: "Ok",
        });
      } else {
        pool.close(); // Close connection
        return res.json({
          err: true,
          msg: "Not Found!",
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

  async toggleActive(req, res) {
    const { active } = req.body; // Y or N
    const { id } = req.params;
    try {
      const pool = await new sql.ConnectionPool(sqlConfig).connect();
      const results = await pool
        .request()
        .input("id", sql.Int, id)
        .input("active", sql.NVarChar, active)
        .query(`UPDATE TBL_LICENSE_LISTS SET ACTIVE = @active WHERE Id = @id`);
      if (results && results.rowsAffected[0] > 0) {
        pool.close();
        return res.json({
          err: false,
          msg: "Updated!",
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

  async deleteLicense(req, res) {
    try {
      const pool = await new sql.ConnectionPool(sqlConfig).connect();
      const { id } = req.params;

      const response = await pool
        .request()
        .input("id", sql.NVarChar, id)
        .query(`DELETE FROM TBL_LICENSE_LISTS WHERE Id = @id`);

      if (response && response.rowsAffected[0] > 0) {
        return res.json({
          err: false,
          msg: "Lisense deleted!",
          status: "Ok",
        });
      } else {
        return res.json({
          err: true,
          msg: "Something is went wrong!",
        });
      }
    } catch (err) {
      return res.json({
        err: true,
        msg: err,
        status: "Ok",
      });
    }
  }
}

module.exports = LicenseController;
