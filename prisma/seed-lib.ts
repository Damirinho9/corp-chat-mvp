import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
export async function seedAll(prisma: PrismaClient) {

  // роли
  for (const name of ['ADMIN','HEAD','EMPLOYEE'] as const) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }

  const [sales, ops, it] = await Promise.all([
    prisma.department.upsert({ where: { name: "Sales" }, update: {}, create: { name: "Sales" } }),
    prisma.department.upsert({ where: { name: "Ops" }, update: {}, create: { name: "Ops" } }),
    prisma.department.upsert({ where: { name: "IT" }, update: {}, create: { name: "IT" } }),
  ]);

  const pass = async (p: string) => bcrypt.hash(p, Number(process.env.PASSWORD_SALT_ROUNDS || 10));

  const admin1 = await prisma.user.upsert({
    where: { username: "admin1" }, update: {},
    create: { username: "admin1", displayName: "Admin One", role: "ADMIN", passwordHash: await pass("admin1") }
  });
  const admin2 = await prisma.user.upsert({
    where: { username: "admin2" }, update: {},
    create: { username: "admin2", displayName: "Admin Two", role: "ADMIN", passwordHash: await pass("admin2") }
  });

  const head_sales = await prisma.user.upsert({
    where: { username: "head_sales" }, update: {},
    create: { username: "head_sales", displayName: "Head Sales", role: "HEAD", departmentId: sales.id, passwordHash: await pass("head_sales") }
  });
  const head_ops = await prisma.user.upsert({
    where: { username: "head_ops" }, update: {},
    create: { username: "head_ops", displayName: "Head Ops", role: "HEAD", departmentId: ops.id, passwordHash: await pass("head_ops") }
  });
  const head_it = await prisma.user.upsert({
    where: { username: "head_it" }, update: {},
    create: { username: "head_it", displayName: "Head IT", role: "HEAD", departmentId: it.id, passwordHash: await pass("head_it") }
  });

  const emp_sales = await Promise.all([1,2,3].map(async n =>
    prisma.user.upsert({
      where: { username: `emp_sales_${n}` }, update: {},
      create: { username: `emp_sales_${n}`, displayName: `Sales ${n}`, role: "EMPLOYEE", departmentId: sales.id, passwordHash: await pass(`emp_sales_${n}`) }
    })
  ));
  const emp_ops = await Promise.all([1,2,3].map(async n =>
    prisma.user.upsert({
      where: { username: `emp_ops_${n}` }, update: {},
      create: { username: `emp_ops_${n}`, displayName: `Ops ${n}`, role: "EMPLOYEE", departmentId: ops.id, passwordHash: await pass(`emp_ops_${n}`) }
    })
  ));
  const emp_it = await Promise.all([1,2,3].map(async n =>
    prisma.user.upsert({
      where: { username: `emp_it_${n}` }, update: {},
      create: { username: `emp_it_${n}`, displayName: `IT ${n}`, role: "EMPLOYEE", departmentId: it.id, passwordHash: await pass(`emp_it_${n}`) }
    })
  ));

  // direct managers
  for (const e of emp_sales) await prisma.directManager.upsert({ where: { employeeId: e.id }, update: { managerId: head_sales.id }, create: { employeeId: e.id, managerId: head_sales.id } });
  for (const e of emp_ops)   await prisma.directManager.upsert({ where: { employeeId: e.id }, update: { managerId: head_ops.id }, create: { employeeId: e.id, managerId: head_ops.id } });
  for (const e of emp_it)    await prisma.directManager.upsert({ where: { employeeId: e.id }, update: { managerId: head_it.id }, create: { employeeId: e.id, managerId: head_it.id } });

  // продублировать managerId в User
  await prisma.user.updateMany({ where: { departmentId: sales.id, role: "EMPLOYEE" }, data: { managerId: head_sales.id } });
  await prisma.user.updateMany({ where: { departmentId: ops.id, role: "EMPLOYEE" }, data: { managerId: head_ops.id } });
  await prisma.user.updateMany({ where: { departmentId: it.id, role: "EMPLOYEE" }, data: { managerId: head_it.id } });

  // системные группы
  const leadership = await prisma.chat.upsert({ where: { systemKey: "leadership" }, update: {}, create: { type: 'GROUP', name: "Руководство", systemKey: "leadership" } });
  const leadership_heads = await prisma.chat.upsert({ where: { systemKey: "leadership_heads" }, update: {}, create: { type: 'GROUP', name: "Рук + главы отделов", systemKey: "leadership_heads" } });
  const deptSales = await prisma.chat.upsert({ where: { systemKey: `dept_${sales.id}` }, update: {}, create: { type: 'GROUP', name: "Отдел Sales", departmentId: sales.id, systemKey: `dept_${sales.id}` } });
  const deptOps   = await prisma.chat.upsert({ where: { systemKey: `dept_${ops.id}` }, update: {}, create: { type: 'GROUP', name: "Отдел Ops", departmentId: ops.id, systemKey: `dept_${ops.id}` } });
  const deptIt    = await prisma.chat.upsert({ where: { systemKey: `dept_${it.id}` }, update: {}, create: { type: 'GROUP', name: "Отдел IT", departmentId: it.id, systemKey: `dept_${it.id}` } });

  // члены групп
  const admins = [admin1, admin2];
  const heads = [head_sales, head_ops, head_it];
  for (const a of admins) await prisma.chatMember.create({ data: { chatId: leadership.id, userId: a.id } });
  for (const u of [...admins, ...heads]) await prisma.chatMember.create({ data: { chatId: leadership_heads.id, userId: u.id } });

  for (const u of [head_sales, ...emp_sales]) await prisma.chatMember.create({ data: { chatId: deptSales.id, userId: u.id } });
  for (const u of [head_ops, ...emp_ops])   await prisma.chatMember.create({ data: { chatId: deptOps.id, userId: u.id } });
  for (const u of [head_it, ...emp_it])     await prisma.chatMember.create({ data: { chatId: deptIt.id, userId: u.id } });

  // тестовые DM
  const dm_ok = await prisma.chat.create({
    data: { type: 'DM', name: `dm_${admin1.id}_${head_sales.id}`, members: { create: [{ userId: admin1.id }, { userId: head_sales.id }] } }
  });
  await prisma.message.createMany({
    data: [
      { chatId: dm_ok.id, senderId: admin1.id, content: "Привет, Head Sales" },
      { chatId: dm_ok.id, senderId: head_sales.id, content: "Добрый день" }
    ]
  });

  // запрещенная попытка - employee из IT пишет employee из Sales
  await prisma.auditLog.create({
    data: { actorId: emp_it[0].id, action: "SEND_DM_ATTEMPT", targetId: emp_sales[0].id, resource: "DM", outcome: "DENY", reason: "employee_dm_forbidden" }
  });

}
