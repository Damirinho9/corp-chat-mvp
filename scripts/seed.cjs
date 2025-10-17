// Simple JS seed for production (Postgres)
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  const rounds = Number(process.env.PASSWORD_SALT_ROUNDS || 10);
  const hash = (s) => bcrypt.hash(s, rounds);

  // Departments
  const [sales, ops, it] = await Promise.all([
    prisma.department.upsert({ where: { name: "Sales" }, update: {}, create: { name: "Sales" } }),
    prisma.department.upsert({ where: { name: "Ops" }, update: {}, create: { name: "Ops" } }),
    prisma.department.upsert({ where: { name: "IT" }, update: {}, create: { name: "IT" } }),
  ]);

  // System groups
  const leadership = await prisma.chat.upsert({
    where: { systemKey: "leadership" },
    update: {},
    create: { type: "GROUP", name: "Руководство", systemKey: "leadership" },
  });
  const leadership_heads = await prisma.chat.upsert({
    where: { systemKey: "leadership_heads" },
    update: {},
    create: { type: "GROUP", name: "Рук + главы отделов", systemKey: "leadership_heads" },
  });
  const deptSales = await prisma.chat.upsert({
    where: { systemKey: `dept_${sales.id}` },
    update: {},
    create: { type: "GROUP", name: "Отдел Sales", departmentId: sales.id, systemKey: `dept_${sales.id}` },
  });
  const deptOps = await prisma.chat.upsert({
    where: { systemKey: `dept_${ops.id}` },
    update: {},
    create: { type: "GROUP", name: "Отдел Ops", departmentId: ops.id, systemKey: `dept_${ops.id}` },
  });
  const deptIt = await prisma.chat.upsert({
    where: { systemKey: `dept_${it.id}` },
    update: {},
    create: { type: "GROUP", name: "Отдел IT", departmentId: it.id, systemKey: `dept_${it.id}` },
  });

  // Users
  async function upsertUser(username, displayName, role, departmentId = null, managerId = null) {
    return prisma.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        displayName,
        role,
        departmentId,
        managerId,
        passwordHash: await hash(username),
      },
    });
  }

  const admin1 = await upsertUser("admin1", "Админ 1", "ADMIN");
  const admin2 = await upsertUser("admin2", "Админ 2", "ADMIN");

  const head_sales = await upsertUser("head_sales", "Глава Sales", "HEAD", sales.id);
  const head_ops   = await upsertUser("head_ops", "Глава Ops", "HEAD", ops.id);
  const head_it    = await upsertUser("head_it", "Глава IT", "HEAD", it.id);

  const emp_sales = await Promise.all([1,2,3].map(n => upsertUser(`emp_sales_${n}`, `Sales ${n}`, "EMPLOYEE", sales.id, head_sales.id)));
  const emp_ops   = await Promise.all([1,2,3].map(n => upsertUser(`emp_ops_${n}`, `Ops ${n}`, "EMPLOYEE", ops.id, head_ops.id)));
  const emp_it    = await Promise.all([1,2,3].map(n => upsertUser(`emp_it_${n}`, `IT ${n}`, "EMPLOYEE", it.id, head_it.id)));

  // DirectManager mapping
  async function ensureDM(employeeId, managerId) {
    await prisma.directManager.upsert({
      where: { employeeId },
      update: { managerId },
      create: { employeeId, managerId },
    });
  }
  for (const u of emp_sales) await ensureDM(u.id, head_sales.id);
  for (const u of emp_ops)   await ensureDM(u.id, head_ops.id);
  for (const u of emp_it)    await ensureDM(u.id, head_it.id);

  // Memberships to groups
  async function ensureMember(chatId, userId) {
    const exists = await prisma.chatMember.findFirst({ where: { chatId, userId } });
    if (!exists) await prisma.chatMember.create({ data: { chatId, userId } });
  }

  const everyone = [admin1, admin2, head_sales, head_ops, head_it, ...emp_sales, ...emp_ops, ...emp_it];

  for (const u of [admin1, admin2]) {
    await ensureMember(leadership.id, u.id);
    await ensureMember(leadership_heads.id, u.id);
  }
  for (const u of [head_sales, head_ops, head_it]) {
    await ensureMember(leadership_heads.id, u.id);
  }
  for (const u of emp_sales) await ensureMember(deptSales.id, u.id);
  for (const u of emp_ops)   await ensureMember(deptOps.id, u.id);
  for (const u of emp_it)    await ensureMember(deptIt.id, u.id);
  await ensureMember(deptSales.id, head_sales.id);
  await ensureMember(deptOps.id, head_ops.id);
  await ensureMember(deptIt.id, head_it.id);

  // sample DMs
  async function createDm(u1, u2) {
    // find or create dm with these two members
    let chat = await prisma.chat.findFirst({
      where: { type: "DM", AND: [ { members: { some: { userId: u1.id } } }, { members: { some: { userId: u2.id } } } ] },
    });
    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          type: "DM",
          name: `dm_${u1.id}_${u2.id}`,
          members: { create: [{ userId: u1.id }, { userId: u2.id }] },
        }
      });
    }
    return chat;
  }

  const dm_a_hsales = await createDm(admin1, head_sales);
  const dm_emp_head_it = await createDm(emp_it[0], head_it);

  // messages
  await prisma.message.create({ data: { chatId: dm_a_hsales.id, senderId: admin1.id, content: "Привет, как дела в Sales?" } });
  await prisma.message.create({ data: { chatId: dm_a_hsales.id, senderId: head_sales.id, content: "Все отлично." } });

  await prisma.message.create({ data: { chatId: deptSales.id, senderId: head_sales.id, content: "План на неделю..." } });
  await prisma.message.create({ data: { chatId: deptIt.id, senderId: head_it.id, content: "Стэнд-ап в 10:00" } });

  // A few audit entries (illustrative)
  await prisma.auditLog.create({ data: { actorId: emp_it[0].id, action: "dm_send", resource: "user", targetId: emp_sales[0].id, outcome: "deny", reason: "matrix_dm_forbidden" } });
  await prisma.auditLog.create({ data: { actorId: head_sales.id, action: "dm_send", resource: "user", targetId: emp_ops[0].id, outcome: "deny", reason: "matrix_dm_foreign_dept" } });

  console.log("Seed done");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
