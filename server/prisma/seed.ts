import { prisma } from '../src/database';
import { hashPassword } from '../src/utils';
import { UserRole } from '../src/shared/enums';

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await hashPassword('Admin@123456');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@flowforge.io' },
    update: {},
    create: {
      email: 'admin@flowforge.io',
      name: 'FlowForge Admin',
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  });

  // Create demo user
  const demoPassword = await hashPassword('Demo@123456');
  const demo = await prisma.user.upsert({
    where: { email: 'demo@flowforge.io' },
    update: {},
    create: {
      email: 'demo@flowforge.io',
      name: 'Demo User',
      password: demoPassword,
      role: UserRole.USER,
    },
  });

  // Create sample workflow
  await prisma.workflow.upsert({
    where: { id: 'seed-workflow-001' },
    update: {},
    create: {
      id: 'seed-workflow-001',
      name: 'Demo: Webhook → Condition → Email',
      description: 'A sample workflow demonstrating webhook triggers, conditional branching, and email notifications.',
      status: 'ACTIVE',
      triggerType: 'WEBHOOK',
      userId: demo.id,
      definition: {
        nodes: [
          {
            id: 'node-1',
            type: 'WEBHOOK',
            label: 'Webhook Trigger',
            config: { path: '/trigger/demo', method: 'POST' },
            position: { x: 250, y: 50 },
          },
          {
            id: 'node-2',
            type: 'CONDITION',
            label: 'Check Amount',
            config: { field: 'amount', operator: 'gt', value: 100 },
            position: { x: 250, y: 200 },
          },
          {
            id: 'node-3',
            type: 'EMAIL',
            label: 'Send Approval Email',
            config: { to: 'approver@company.com', subject: 'High Value Request', body: 'A request over $100 requires approval.' },
            position: { x: 100, y: 350 },
          },
          {
            id: 'node-4',
            type: 'HTTP_REQUEST',
            label: 'Auto Process',
            config: { url: 'https://api.example.com/process', method: 'POST' },
            position: { x: 400, y: 350 },
          },
        ],
        edges: [
          { id: 'e1-2', source: 'node-1', target: 'node-2' },
          { id: 'e2-3', source: 'node-2', target: 'node-3', condition: 'true_branch' },
          { id: 'e2-4', source: 'node-2', target: 'node-4', condition: 'false_branch' },
        ],
      },
    },
  });

  console.log('✅ Seeded successfully');
  console.log(`   Admin: admin@flowforge.io / Admin@123456`);
  console.log(`   Demo:  demo@flowforge.io / Demo@123456`);
  console.log(`   Admin ID: ${admin.id}`);
  console.log(`   Demo ID: ${demo.id}`);
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
