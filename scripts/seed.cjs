const { PrismaClient: PrismaClientPostgres } = require('../node_modules/.prisma/client-postgres');
const bcrypt = require('bcrypt');

const prisma = new PrismaClientPostgres();

async function main() {
  console.log('[seed] Starting seed for PostgreSQL...');

  // чистка существующих данных
  console.log('[seed] Cleaning existing data...');
  await prisma.message.deleteMany();
  await prisma.chatMember.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  console.log('[seed] Creating departments...');
  const deptSales = await prisma.department.create({
    data: { name: 'тдел продаж', description: 'Sales team' }
  });
  const deptOps = await prisma.department.create({
    data: { name: 'тдел операций', description: 'Operations team' }
  });
  const deptIT = await prisma.department.create({
    data: { name: 'IT отдел', description: 'IT team' }
  });

  console.log('[seed] Creating users...');
  const saltRounds = 10;

  // дмины
  const admin1 = await prisma.user.create({
    data: {
      username: 'admin1',
      displayName: 'Admin One',
      passwordHash: await bcrypt.hash('admin1', saltRounds),
      role: 'ADMIN',
      departmentId: null,
      managerId: null
    }
  });

  const admin2 = await prisma.user.create({
    data: {
      username: 'admin2',
      displayName: 'Admin Two',
      passwordHash: await bcrypt.hash('admin2', saltRounds),
      role: 'ADMIN',
      departmentId: null,
      managerId: null
    }
  });

  // уководители отделов
  const headSales = await prisma.user.create({
    data: {
      username: 'head_sales',
      displayName: 'Sales Head',
      passwordHash: await bcrypt.hash('head_sales', saltRounds),
      role: 'DEPARTMENT_HEAD',
      departmentId: deptSales.id,
      managerId: null
    }
  });

  const headOps = await prisma.user.create({
    data: {
      username: 'head_ops',
      displayName: 'Ops Head',
      passwordHash: await bcrypt.hash('head_ops', saltRounds),
      role: 'DEPARTMENT_HEAD',
      departmentId: deptOps.id,
      managerId: null
    }
  });

  const headIT = await prisma.user.create({
    data: {
      username: 'head_it',
      displayName: 'IT Head',
      passwordHash: await bcrypt.hash('head_it', saltRounds),
      role: 'DEPARTMENT_HEAD',
      departmentId: deptIT.id,
      managerId: null
    }
  });

  // Сотрудники отдела продаж
  await prisma.user.create({
    data: {
      username: 'emp_sales_1',
      displayName: 'Sales Employee 1',
      passwordHash: await bcrypt.hash('emp_sales_1', saltRounds),
      role: 'EMPLOYEE',
      departmentId: deptSales.id,
      managerId: headSales.id
    }
  });

  await prisma.user.create({
    data: {
      username: 'emp_sales_2',
      displayName: 'Sales Employee 2',
      passwordHash: await bcrypt.hash('emp_sales_2', saltRounds),
      role: 'EMPLOYEE',
      departmentId: deptSales.id,
      managerId: headSales.id
    }
  });

  await prisma.user.create({
    data: {
      username: 'emp_sales_3',
      displayName: 'Sales Employee 3',
      passwordHash: await bcrypt.hash('emp_sales_3', saltRounds),
      role: 'EMPLOYEE',
      departmentId: deptSales.id,
      managerId: headSales.id
    }
  });

  // Сотрудники операционного отдела
  await prisma.user.create({
    data: {
      username: 'emp_ops_1',
      displayName: 'Ops Employee 1',
      passwordHash: await bcrypt.hash('emp_ops_1', saltRounds),
      role: 'EMPLOYEE',
      departmentId: deptOps.id,
      managerId: headOps.id
    }
  });

  await prisma.user.create({
    data: {
      username: 'emp_ops_2',
      displayName: 'Ops Employee 2',
      passwordHash: await bcrypt.hash('emp_ops_2', saltRounds),
      role: 'EMPLOYEE',
      departmentId: deptOps.id,
      managerId: headOps.id
    }
  });

  await prisma.user.create({
    data: {
      username: 'emp_ops_3',
      displayName: 'Ops Employee 3',
      passwordHash: await bcrypt.hash('emp_ops_3', saltRounds),
      role: 'EMPLOYEE',
      departmentId: deptOps.id,
      managerId: headOps.id
    }
  });

  // Сотрудники IT отдела
  await prisma.user.create({
    data: {
      username: 'emp_it_1',
      displayName: 'IT Employee 1',
      passwordHash: await bcrypt.hash('emp_it_1', saltRounds),
      role: 'EMPLOYEE',
      departmentId: deptIT.id,
      managerId: headIT.id
    }
  });

  await prisma.user.create({
    data: {
      username: 'emp_it_2',
      displayName: 'IT Employee 2',
      passwordHash: await bcrypt.hash('emp_it_2', saltRounds),
      role: 'EMPLOYEE',
      departmentId: deptIT.id,
      managerId: headIT.id
    }
  });

  await prisma.user.create({
    data: {
      username: 'emp_it_3',
      displayName: 'IT Employee 3',
      passwordHash: await bcrypt.hash('emp_it_3', saltRounds),
      role: 'EMPLOYEE',
      departmentId: deptIT.id,
      managerId: headIT.id
    }
  });

  console.log('[seed] Creating system group chats...');

  // рупповой чат "уководство"
  await prisma.chat.create({
    data: {
      name: 'уководство',
      type: 'GROUP',
      isSystemGroup: true,
      members: {
        create: [
          { userId: admin1.id },
          { userId: admin2.id }
        ]
      }
    }
  });

  // рупповой чат "ук + главы отделов"
  await prisma.chat.create({
    data: {
      name: 'ук + главы отделов',
      type: 'GROUP',
      isSystemGroup: true,
      members: {
        create: [
          { userId: admin1.id },
          { userId: admin2.id },
          { userId: headSales.id },
          { userId: headOps.id },
          { userId: headIT.id }
        ]
      }
    }
  });

  // рупповые чаты отделов
  await prisma.chat.create({
    data: {
      name: 'тдел продаж',
      type: 'GROUP',
      isSystemGroup: true,
      departmentId: deptSales.id,
      members: {
        create: [
          { userId: headSales.id },
          { userId: (await prisma.user.findUnique({ where: { username: 'emp_sales_1' }})).id },
          { userId: (await prisma.user.findUnique({ where: { username: 'emp_sales_2' }})).id },
          { userId: (await prisma.user.findUnique({ where: { username: 'emp_sales_3' }})).id }
        ]
      }
    }
  });

  console.log('[seed] ✓ Seed completed successfully!');
  console.log('[seed] Users created:');
  console.log('  - admin1 / admin1');
  console.log('  - admin2 / admin2');
  console.log('  - head_sales / head_sales');
  console.log('  - head_ops / head_ops');
  console.log('  - head_it / head_it');
  console.log('  - emp_sales_1..3 / emp_sales_1..3');
  console.log('  - emp_ops_1..3 / emp_ops_1..3');
  console.log('  - emp_it_1..3 / emp_it_1..3');
}

main()
  .catch((e) => {
    console.error('[seed] ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.();
  });
