// This uses 'require' instead of 'import' to match your server.js
require("dotenv").config();
const { defineConfig } = require("prisma/config");

module.exports = defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // This is the key part that lets Prisma 7 find your database
    url: process.env.DATABASE_URL,
  },
});
