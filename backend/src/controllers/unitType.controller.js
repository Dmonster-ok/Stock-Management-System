const UnitType = require('../models/unitType.model');

// Get all unit types
exports.getAllUnitTypes = async (req, res) => {
  try {
    const unitTypes = await UnitType.getAll();
    res.status(200).json(unitTypes);
  } catch (error) {
    console.error('Get unit types error:', error);
    res.status(500).json({ message: 'Error retrieving unit types' });
  }
};

// Get unit types by type (Weight, Volume, Count, Length)
exports.getUnitTypesByType = async (req, res) => {
  try {
    const { type } = req.params;
    const unitTypes = await UnitType.getByType(type);
    res.status(200).json(unitTypes);
  } catch (error) {
    console.error('Get unit types by type error:', error);
    res.status(500).json({ message: 'Error retrieving unit types' });
  }
};

// Get unit type by ID
exports.getUnitTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const unitType = await UnitType.findById(id);
    
    if (!unitType) {
      return res.status(404).json({ message: 'Unit type not found' });
    }
    
    res.status(200).json(unitType);
  } catch (error) {
    console.error('Get unit type error:', error);
    res.status(500).json({ message: 'Error retrieving unit type' });
  }
};

// Create new unit type
exports.createUnitType = async (req, res) => {
  try {
    // Validate request
    if (!req.body.name || !req.body.abbreviation || !req.body.type) {
      return res.status(400).json({ 
        message: 'Name, abbreviation, and type are required' 
      });
    }

    // Check if abbreviation already exists
    const existingUnitType = await UnitType.findByAbbreviation(req.body.abbreviation);
    if (existingUnitType) {
      return res.status(400).json({ 
        message: 'Unit type with this abbreviation already exists' 
      });
    }

    const unitType = await UnitType.create(req.body);
    res.status(201).json({
      message: 'Unit type created successfully',
      unitType
    });
  } catch (error) {
    console.error('Create unit type error:', error);
    res.status(500).json({ message: 'Error creating unit type' });
  }
};

// Update unit type
exports.updateUnitType = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if unit type exists
    const existingUnitType = await UnitType.findById(id);
    if (!existingUnitType) {
      return res.status(404).json({ message: 'Unit type not found' });
    }

    // Check if abbreviation is being changed and if it already exists
    if (req.body.abbreviation && req.body.abbreviation !== existingUnitType.abbreviation) {
      const duplicateUnitType = await UnitType.findByAbbreviation(req.body.abbreviation);
      if (duplicateUnitType && duplicateUnitType.id !== parseInt(id)) {
        return res.status(400).json({ 
          message: 'Unit type with this abbreviation already exists' 
        });
      }
    }

    const success = await UnitType.update(id, req.body);
    
    if (success) {
      const updatedUnitType = await UnitType.findById(id);
      res.status(200).json({
        message: 'Unit type updated successfully',
        unitType: updatedUnitType
      });
    } else {
      res.status(400).json({ message: 'No changes made to unit type' });
    }
  } catch (error) {
    console.error('Update unit type error:', error);
    res.status(500).json({ message: 'Error updating unit type' });
  }
};

// Delete unit type
exports.deleteUnitType = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if unit type exists
    const unitType = await UnitType.findById(id);
    if (!unitType) {
      return res.status(404).json({ message: 'Unit type not found' });
    }

    const success = await UnitType.delete(id);
    
    if (success) {
      res.status(200).json({ message: 'Unit type deleted successfully' });
    } else {
      res.status(400).json({ message: 'Failed to delete unit type' });
    }
  } catch (error) {
    console.error('Delete unit type error:', error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      res.status(400).json({ 
        message: 'Cannot delete unit type - it is being used by products' 
      });
    } else {
      res.status(500).json({ message: 'Error deleting unit type' });
    }
  }
};