const sql = require("mssql");
const { sqlConfig } = require("../config/config");
const { v4: uuidv4 } = require("uuid");
const Utils = require("../utils/Utils");
const UtilsInstance = new Utils();
const moment = require("moment");

class AccessoriesController {
  async getAccessories(req, res) {
    try {
      const pool = await new sql.ConnectionPool(sqlConfig).connect();
      const results = await pool.request()
        .query(`SELECT a.Id,a.ITEM_CODE,a.GROUP_PART,a.PART_CODE,a.BALANCE,a.RECEIVE,a.SUPPLY,a.REMAIN,a.UNITS,a.PRICES,a.REMARK,a.SUPPLIER_CODE,a.DATE_STOCKIN,a.INVOICE_NO,a.CREATED_BY,a.UPDATED_BY,b.SUPPLIER_NAME,c.GROUP_NAME ,d.PART_NAME
        FROM [dbo].[TBL_STOCK_IT] a LEFT JOIN [dbo].[TBL_SUPPLIER] b on a.SUPPLIER_CODE = b.SUPPLIER_CODE 
            LEFT JOIN [dbo].[TBL_GROUP_ACCESS] c on a.GROUP_PART = c.SHORT_GROUP 
            LEFT JOIN [dbo].TBL_PART_MASTER d on a.PART_CODE = d.PART_CODE
            ORDER BY a.Id DESC`);
      if (results && results.recordset?.length > 0) {
        return res.json({
          err: false,
          results: results.recordset,
          status: "Ok",
          msg: "Not found!",
        });
      } else {
        return res.json({
          err: true,
          msg: "Not found!",
        });
      }
    } catch (err) {
      return res.json({
        err: true,
        msg: err,
      });
    }
  }
  async getAccessoriesType(req, res) {
    try {
      const pool = await new sql.ConnectionPool(sqlConfig).connect();
      const results = await pool.request().query(`SELECT *
        FROM [dbo].[TBL_GROUP_ACCESS] ORDER BY SHORT_GROUP ASC`);
      if (results && results.recordset?.length > 0) {
        return res.json({
          err: false,
          results: results.recordset,
          status: "Ok",
          msg: "Not found!",
        });
      } else {
        return res.json({
          err: true,
          msg: "Not found!",
        });
      }
    } catch (err) {
      return res.json({
        err: true,
        msg: err,
      });
    }
  }

  async saveAccessories(req, res) {
    const {
      partCode,
      group,
      amountReceive,
      unit,
      admin,
      price,
      supplier,
      dateReceive,
      invoiceNo,
      remark,
    } = req.body;

    if (
      !partCode ||
      !group ||
      !amountReceive ||
      !unit ||
      !admin ||
      !price ||
      !supplier ||
      !dateReceive
    ) {
      return res.json({
        err: true,
        msg: "Data is require!",
      });
    }
    try {
      const pool = await new sql.ConnectionPool(sqlConfig).connect();
      const top1 = await pool
        .request()
        .query(
          `SELECT TOP 1 ITEM_CODE FROM TBL_STOCK_IT ORDER BY ITEM_CODE DESC`
        );
      const runNumber =
        top1.recordset?.length > 0
          ? parseInt(top1.recordset[0].ITEM_CODE) + 1
          : 1;

      const results = await pool
        .request()
        .input("ITEM_CODE", sql.Int, runNumber)
        .input("GROUP_PART", sql.NVarChar, group)
        .input("PART_CODE", sql.NVarChar, partCode)
        .input("BALANCE", sql.Decimal, amountReceive)
        .input("RECEIVE", sql.Decimal, amountReceive)
        .input("SUPPLY", sql.Decimal, 0.0)
        .input("REMAIN", sql.Decimal, amountReceive)
        .input("UNITS", sql.NVarChar, unit)
        .input("PRICES", sql.Decimal, price)
        .input("REMARK", sql.NVarChar, remark)
        .input("SUPPLIER_CODE", sql.NVarChar, supplier)
        .input("DATE_STOCKIN", sql.DateTime, moment(dateReceive).add(7,'hours').format('YYYY-MM-DD HH:mm'))
        .input("INVOICE_NO", sql.NVarChar, invoiceNo)
        .input("CREATED_BY", sql.NVarChar, admin)
        .query(`INSERT INTO TBL_STOCK_IT (ITEM_CODE,GROUP_PART,PART_CODE,BALANCE,RECEIVE,SUPPLY,REMAIN,UNITS,PRICES,REMARK,SUPPLIER_CODE,DATE_STOCKIN,INVOICE_NO,CREATED_BY) 
          VALUES (@ITEM_CODE,@GROUP_PART,@PART_CODE,@BALANCE,@RECEIVE,@SUPPLY,@REMAIN,@UNITS,@PRICES,@REMARK,@SUPPLIER_CODE,@DATE_STOCKIN,@INVOICE_NO,@CREATED_BY)`);

      for (let i = 0; i < parseInt(amountReceive); i++) {
        // Save Tag
        const insert = await pool
          .request()
          .input("DATE_STOCKIN", sql.DateTime, moment(dateReceive).add(7,'hours').format('YYYY-MM-DD HH:mm'))
          .input("PART_CODE", sql.NVarChar, partCode)
          .input("TAG_GENARATED", sql.NVarChar, "N")
          .query(
            `INSERT INTO [dbo].[TBL_ACCESSORIES_TAGS] (DATE_STOCKIN,PART_CODE,TAG_GENARATED) VALUES (@DATE_STOCKIN,@PART_CODE,@TAG_GENARATED)`
          );
        if (insert && insert.rowsAffected[0] > 0) {
          console.log("Save to barcode");
        }
      }

      if (results && results.rowsAffected[0] > 0) {
        return res.json({
          err: false,
          msg: "Added !",
          status: "Ok",
          msg: "Not found!",
        });
      } else {
        return res.json({
          err: true,
          msg: "Not found!",
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

  async updateAccessories(req, res) {
    const {
      partCode,
      group,
      partName,
      amountReceive,
      unit,
      admin,
      price,
      supplier,
      dateReceive,
      invoiceNo,
      remark,
    } = req.body;
    if (
      !partCode ||
      !group ||
      !partName ||
      !amountReceive ||
      !unit ||
      !admin ||
      !price ||
      !supplier ||
      !dateReceive
    ) {
      return res.json({
        err: true,
        msg: "Data is require!",
      });
    }
    try {
      const pool = await new sql.ConnectionPool(sqlConfig).connect();
      const { id } = req.params;
      const oldStock = await pool
        .request()
        .input("id", sql.Int, id)
        .query(`SELECT * FROM TBL_STOCK_IT WHERE Id = @id`);
      if (oldStock && oldStock.recordset?.length > 0) {
        // รับเข้า - เบิกออก
        const remain =
          parseInt(amountReceive) - parseInt(oldStock.recordset[0]?.SUPPLY);

        const results = await pool
          .request()
          .input("GROUP_PART", sql.NVarChar, group)
          .input("PART_CODE", sql.NVarChar, partCode)
          .input("BALANCE", sql.Decimal, amountReceive)
          .input("RECEIVE", sql.Decimal, amountReceive)
          .input("SUPPLY", sql.Decimal, 0.0)
          .input("REMAIN", sql.Decimal, remain)
          .input("UNITS", sql.NVarChar, unit)
          .input("PRICES", sql.Decimal, price)
          .input("REMARK", sql.NVarChar, remark)
          .input("SUPPLIER_CODE", sql.NVarChar, supplier)
          .input("DATE_STOCKIN", sql.DateTime, moment(dateReceive).add(7,'hours').format('YYYY-MM-DD HH:mm'))
          .input("INVOICE_NO", sql.NVarChar, invoiceNo)
          .input("UPDATED_BY", sql.NVarChar, admin)
          .input("id", sql.Int, id)
          .query(
            `UPDATE TBL_STOCK_IT SET GROUP_PART = @GROUP_PART,PART_CODE = @PART_CODE,BALANCE = @BALANCE,RECEIVE = @RECEIVE,UNITS = @UNITS,PRICES = @PRICES,REMARK = @REMARK,SUPPLIER_CODE = @SUPPLIER_CODE,DATE_STOCKIN = @DATE_STOCKIN,INVOICE_NO = @INVOICE_NO,REMAIN = @REMAIN,UPDATED_BY = @UPDATED_BY WHERE Id = @id`
          );
        if (results && results.rowsAffected[0] > 0) {
          pool.close();

          return res.json({
            err: false,
            msg: "Updated !",
            status: "Ok",
            msg: "Not found!",
          });
        } else {
          return res.json({
            err: true,
            msg: "Not found!",
          });
        }
      }
    } catch (err) {
      console.log(err);
      return res.json({
        err: true,
        msg: err,
      });
    }
  }

  async pickUpAccessories(req, res) {
    const { amount,remark } = req.body;
    const { partCode } = req.params;
    console.log(req.body);
    console.log(partCode);
    try {
      const pool = await new sql.ConnectionPool(sqlConfig).connect();
      const response = await pool
        .request()
        .input("code", sql.NVarChar, partCode)
        .query(
          `SELECT TOP ${Number(
            amount
          )} * FROM TBL_ACCESSORIES_TAGS WHERE TAG_GENARATED = 'N' AND PART_CODE = @code ORDER BY DATE_STOCKIN ASC`
        );
    
      // เช็คว่า Stock เหลือไหม

      if (
        response &&
        response?.recordset?.length > 0 &&
        Number(amount) == response?.recordset?.length
      ) {
        const idArray = response.recordset?.map((x) => x.Id);
        const dateArray = response.recordset?.map((x) => x.DATE_STOCKIN);
        const strId = idArray.join(","); // [1,2,3] => 1,2,3->string

        const updateStock = await pool
          .request()
          .input("uuid", sql.NVarChar, uuidv4())
          .input("remark", sql.VarChar,remark)
          .query(
            `UPDATE TBL_ACCESSORIES_TAGS SET TAG_GENARATED = 'Y',REMARK = @remark,UUID_PICK = @uuid ,LAST_PICKTAG = GETDATE() WHERE Id in (${strId})`
          );

         await UtilsInstance.stockOut(partCode, dateArray, amount); // ตัด FIFO

        if (updateStock && updateStock.rowsAffected[0] > 0) {
          return res.json({
            err: false,
            results: "Success !",
            status: "Ok",
          });
        }
      } else {
        return res.json({
          err: true,
          msg: "The remaining amount is not enough.",
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

  async deleteAccessories(req, res) {
    try {
      const pool = await new sql.ConnectionPool(sqlConfig).connect();
      const { id } = req.params;
      const results = await pool
        .request()
        .input("id", sql.Int, id)
        .query(`DELETE FROM TBL_STOCK_IT WHERE Id = @id`);
      if (results && results.rowsAffected[0] > 0) {
        return res.json({
          err: false,
          msg: "Deleted !",
          status: "Ok",
          msg: "Not found!",
        });
      } else {
        return res.json({
          err: true,
          msg: "Not found!",
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
}
module.exports = AccessoriesController;
