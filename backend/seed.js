const prisma = require('./src/db/client');
const bcrypt = require('bcryptjs');

async function main() {
  const email = 'admin@devtask.com';
  const password = 'password123';
  const name = 'Admin User';

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.log('User already exists:', existingUser.email);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });

  console.log('Created test user:', user.email);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
