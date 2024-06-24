const sql = require("mssql");
const { sqlConfig } = require("../config/config");

class PartController {
  async getAllPart(req, res) {
    
    try {
      const pool = await new sql.ConnectionPool(sqlConfig).connect();
      const results = await pool
        .request()
        .query(`SELECT * FROM TBL_PART_MASTER ORDER BY PART_CODE ASC`);
      if (results && results.recordset?.length > 0) {
        return res.json({
          err: false,
          results: results.recordset,
          status: "Ok",
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
  async sumaryByPart(req, res) {
    try {
      const pool = await new sql.ConnectionPool(sqlConfig).connect();
      const results = await pool.request().query(`WITH CTE_SumStock AS (
          SELECT a.[PART_CODE],
          SUM([RECEIVE]) as[RECEIVE],SUM([SUPPLY]) as [SUPPLY],SUM([REMAIN]) as [REMAIN] FROM [dbo].[TBL_STOCK_IT]a GROUP BY PART_CODE)
          SELECT p.*,ISNULL(c.RECEIVE,0.00) AS [RECEIVE],ISNULL(c.REMAIN,0.00) as [REMAIN],ISNULL(c.SUPPLY,0.00) as [SUPPLY],
		      ISNULL(vp.[VALUE_RECEIVE],0.00) as [VALUE_RECEIVE], 
		      ISNULL(vp.[VALUE_SUPPLY],0.00) as [VALUE_SUPPLY],
		      ISNULL(vp.[VALUE_REMAIN],0.00) as [VALUE_REMAIN],ac.GROUP_NAME FROM [dbo].[TBL_PART_MASTER]p 
          LEFT JOIN CTE_SumStock c ON p.PART_CODE = c.PART_CODE 
          LEFT JOIN [dbo].[TBL_GROUP_ACCESS]ac ON p.PART_GROUP = ac.SHORT_GROUP
		      LEFT JOIN [dbo].V_ValueOfITSparePart vp ON c.PART_CODE = vp.PART_CODE
		      ORDER BY p.PART_CODE ASC`);
      if (results && results.recordset?.length > 0) {
        return res.json({
          err: false,
          results: results.recordset,
          status: "Ok",
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

  async addPart(req, res) {
    try {
      const { group, remark, partName } = req.body;
      if (!group || !partName) {
        return res.json({
          err: true,
          msg: "Data is Require!",
        });
      }
      const pool = await new sql.ConnectionPool(sqlConfig).connect();
      const checkDuplicate = await pool
        .request()
        .input("partName", sql.NVarChar, partName)
        .input("partGroup", sql.NVarChar, group)
        .query(
          `SELECT * FROM TBL_PART_MASTER WHERE PART_NAME = @partName AND PART_GROUP = @partGroup`
        );

      if (checkDuplicate && checkDuplicate.recordset?.length > 0) {
        console.log(checkDuplicate.recordset);
        return res.json({
          err: true,
          msg: "Part Duplicated!",
        });
      }

      const lastCode = await pool
        .request()
        .input("group", sql.NVarChar, group)
        .query(
          `SELECT TOP 1 PART_CODE,PART_NAME FROM TBL_PART_MASTER WHERE PART_GROUP = @group ORDER BY PART_CODE DESC`
        );

      // สร้าง Part Code
      const runNumber =
        lastCode && lastCode.recordset?.length > 0
          ? parseInt((lastCode?.recordset[0].PART_CODE).slice(1)) + 1
          : `0001`;
      const results = await pool
        .request()
        .input("PART_NAME", sql.NVarChar, partName)
        .input("PART_DESC", sql.NVarChar, remark)
        .input("PART_GROUP", sql.NVarChar, group)
        .input(
          "PART_CODE",
          sql.NVarChar,
          `${group}${runNumber.toString().padStart(4, "0")}`
        )
        .query(
          `INSERT INTO TBL_PART_MASTER (PART_CODE, PART_NAME, PART_DESC, PART_GROUP) VALUES (@PART_CODE, @PART_NAME, @PART_DESC, @PART_GROUP)`
        );

      if (results && results.rowsAffected[0] > 0) {
        return res.json({
          err: false,
          msg: "Part added!",
          status: "Ok",
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

  async updatePart(req, res) {
    try {
      const { group, remark, partName } = req.body;

      if (!group || !partName) {
        return res.json({
          err: true,
          msg: "Data is Require!",
        });
      }
      const { id } = req.params;
      const pool = await new sql.ConnectionPool(sqlConfig).connect();

      const oldData = await pool
        .request()
        .input("id", sql.Int, id)
        .query(`SELECT * FROM TBL_PART_MASTER WHERE Id = @id`);

      const checkDuplicate = await pool
        .request()
        .input("partName", sql.NVarChar, partName)
        .input("partGroup", sql.NVarChar, group)
        .input("oldPartName", sql.NVarChar, oldData?.recordset[0].PART_NAME)
        .input("oldPartGroup", sql.NVarChar, oldData?.recordset[0].PART_GROUP)
        .query(
          `SELECT * FROM TBL_PART_MASTER WHERE PART_NAME = @partName AND PART_GROUP = @partGroup AND PART_NAME != @oldPartName AND PART_GROUP = @oldPartGroup`
        );

      if (checkDuplicate && checkDuplicate.recordset?.length > 0) {
        return res.json({
          err: true,
          msg: "Part Duplicated!",
        });
      }
      // ถ้า Part มีการเปลี่ยน Group

      const lastCode = await pool
        .request()
        .input(
          "group",
          sql.NVarChar,
          group !== oldData?.recordset[0].PART_GROUP
            ? group
            : oldData?.recordset[0].PART_GROUP
        )
        .query(
          `SELECT TOP 1 PART_CODE,PART_NAME FROM TBL_PART_MASTER WHERE PART_GROUP = @group ORDER BY PART_CODE DESC`
        );

      const runNumber =
        lastCode &&
        lastCode.recordset?.length > 0 &&
        oldData?.recordset[0].PART_GROUP !== group
          ? parseInt((lastCode?.recordset[0].PART_CODE).slice(1)) + 1
          : lastCode &&
            lastCode.recordset?.length > 0 &&
            oldData?.recordset[0].PART_GROUP === group
          ? parseInt((lastCode?.recordset[0].PART_CODE).slice(1))
          : `1`;
      const partCode =
        group !== oldData?.recordset[0].PART_GROUP
          ? `${group}${runNumber}`
          : `${oldData?.recordset[0].PART_GROUP}${runNumber}`;

      const groupPart = partCode.slice(0, 1);
      const format = partCode.slice(1).padStart(4, "0");
      const partCodeFinal = `${groupPart}${format}`; // ShortGroup [A] + 0001
      console.log(partCodeFinal);
      const results = await pool
        .request()
        .input("PART_NAME", sql.NVarChar, partName)
        .input("PART_CODE", sql.NVarChar, partCodeFinal)
        .input("PART_DESC", sql.NVarChar, remark)
        .input("PART_GROUP", sql.NVarChar, group)
        .input("ID", sql.Int, id)
        .query(
          `UPDATE TBL_PART_MASTER SET PART_CODE = @PART_CODE,PART_NAME = @PART_NAME, PART_DESC =  @PART_DESC, PART_GROUP = @PART_GROUP WHERE Id = @ID`
        );

      if (results && results.rowsAffected[0] > 0) {
        return res.json({
          err: false,
          msg: "Part updated!",
          status: "Ok",
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

  async deletePart(req, res) {
    try {
      const { id } = req.params;
      console.log(id);
      const pool = await new sql.ConnectionPool(sqlConfig).connect();
      const deletePart = await pool
        .request()
        .input("id", sql.Int, id)
        .query(`DELETE FROM TBL_PART_MASTER WHERE Id = @id`);
      if (deletePart && deletePart.rowsAffected[0] > 0) {
        return res.json({
          err: false,
          msg: "Part deleted!",
          status: "Ok",
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
module.exports = PartController;
