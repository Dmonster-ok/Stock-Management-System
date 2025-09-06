const { pool } = require('../config/db.config');

class UnitType {
  constructor(unitType) {
    this.id = unitType.id;
    this.name = unitType.name;
    this.abbreviation = unitType.abbreviation;
    this.type = unitType.type;
    this.base_unit = unitType.base_unit;
    this.conversion_factor = unitType.conversion_factor;
  }

  static async create(newUnitType) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO unit_types (name, abbreviation, type, base_unit, conversion_factor) VALUES (?, ?, ?, ?, ?)',
        [
          newUnitType.name,
          newUnitType.abbreviation,
          newUnitType.type,
          newUnitType.base_unit || false,
          newUnitType.conversion_factor || 1.0000
        ]
      );

      const id = result.insertId;
      return { id, ...newUnitType };
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM unit_types WHERE id = ?', [id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  static async getAll() {
    try {
      const [rows] = await pool.execute('SELECT * FROM unit_types ORDER BY name');
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async getByType(type) {
    try {
      const [rows] = await pool.execute('SELECT * FROM unit_types WHERE type = ? ORDER BY name', [type]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async update(id, unitType) {
    try {
      let query = 'UPDATE unit_types SET ';
      const values = [];
      const updateFields = [];

      if (unitType.name) {
        updateFields.push('name = ?');
        values.push(unitType.name);
      }

      if (unitType.abbreviation) {
        updateFields.push('abbreviation = ?');
        values.push(unitType.abbreviation);
      }

      if (unitType.type) {
        updateFields.push('type = ?');
        values.push(unitType.type);
      }

      if (unitType.base_unit !== undefined) {
        updateFields.push('base_unit = ?');
        values.push(unitType.base_unit);
      }

      if (unitType.conversion_factor) {
        updateFields.push('conversion_factor = ?');
        values.push(unitType.conversion_factor);
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      query += updateFields.join(', ');
      query += ' WHERE id = ?';
      values.push(id);

      const [result] = await pool.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM unit_types WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async findByAbbreviation(abbreviation) {
    try {
      const [rows] = await pool.execute('SELECT * FROM unit_types WHERE abbreviation = ?', [abbreviation]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UnitType;