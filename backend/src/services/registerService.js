const bcrypt = require("bcryptjs");
const prisma = require("../db/client");

const createUser = async (email, password, name) => {
  // 1. Scramble the password for security
  const hashedPassword = await bcrypt.hash(password, 10);

  // 2. Save to the PostgreSQL database
  return await prisma.user.create({
    data: {
      email: email,
      password: hashedPassword,
      name: name,
    },
  });
};

const jwt = require("jsonwebtoken");

const loginUser = async (email, password) => {
  // 1. Find user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Invalid email or password");

  // 2. Compare passwords using bcrypt
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid email or password");

  // 3. Create a JWT "ID Card"
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET || "supersecretkey",
    { expiresIn: "1d" },
  );

  return { user, token };
};

module.exports = { createUser, loginUser };
