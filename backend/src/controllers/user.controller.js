const User = require('../models/user.model');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.status(200).json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Error retrieving users' });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Error retrieving user' });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is authorized to update
    if (req.userId != req.params.id && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }

    // Update user
    const updated = await User.update(req.params.id, {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role
    });

    if (!updated) {
      return res.status(400).json({ message: 'User could not be updated' });
    }

    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only admin can delete users
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete users' });
    }

    // Delete user
    const deleted = await User.delete(req.params.id);
    if (!deleted) {
      return res.status(400).json({ message: 'User could not be deleted' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
};