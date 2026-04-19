const authService = require("../services/registerService");

const register = async (req, res) => {
  try {
    // 1. Extract data from the request body
    const { email, password, name } = req.body;

    // 2. Call the service we made in Step 2
    const user = await authService.createUser(email, password, name);

    // 3. Send back a success response
    res.status(201).json({
      message: "User registered successfully!",
      userId: user.id,
    });
  } catch (error) {
    // Handle errors (like duplicate emails)
    res.status(400).json({ error: error.message });
  }
};
const env = require("../config/env");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.loginUser(email, password);
    
    // Set HTTP-Only Cookie with env awareness
    res.cookie("token", token, {
      httpOnly: true,
      secure: env.isProduction, 
      sameSite: env.isProduction ? "none" : "lax", // "none" required for cross-domain cookies (Vercel ↔ Render)
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(200).json({
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};
const getMe = async (req, res) => {
  try {
    const prisma = require('../db/client');
    const user = await prisma.user.findUnique({
      where: { id: req.user },
      select: { id: true, name: true, email: true, createdAt: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const changePassword = async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const prisma = require('../db/client');
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new password are required' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.user } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user }, data: { password: hashed } });
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? "none" : "lax",
  });
  res.status(200).json({ message: "Logged out successfully" });
};

module.exports = { register, login, logout, getMe, changePassword };
