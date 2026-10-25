const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const demoStudents = [
  { name: 'Rafiul Islam', email: 'rafiul@example.com' },
  { name: 'Nusrat Jahan', email: 'nusrat@example.com' },
  { name: 'Shakib Hasan', email: 'shakib@example.com' },
  { name: 'Mim Akter', email: 'mim@example.com' },
];

const demoSubmissions = [
  {
    projectName: 'E-commerce Storefront',
    repoUrl: 'https://github.com/rafiul/ecommerce-storefront',
    liveLink: 'https://ecommerce-storefront-demo.vercel.app',
    description:
      'A full-stack e-commerce storefront built with Next.js and Stripe, featuring product search, cart, and checkout.',
    status: 'PENDING',
    assignmentNumber: 3,
  },
  {
    projectName: 'Task Management App',
    repoUrl: 'https://github.com/nusrat/task-manager',
    liveLink: 'https://task-manager-demo.vercel.app',
    description:
      'A Kanban-style task management application with drag-and-drop columns, built using React and Firebase.',
    status: 'APPROVED',
    feedback: 'Clean architecture and great use of optimistic UI updates. Well done!',
    assignmentNumber: 5,
  },
  {
    projectName: 'Weather Forecast Dashboard',
    repoUrl: 'https://github.com/shakib/weather-dashboard',
    liveLink: '',
    description:
      'A weather dashboard that shows 7-day forecasts using the OpenWeather API with city search and saved locations.',
    status: 'PENDING',
    assignmentNumber: 2,
  },
  {
    projectName: 'Recipe Finder',
    repoUrl: 'https://github.com/mim/recipe-finder',
    liveLink: 'https://recipe-finder-demo.vercel.app',
    description:
      'A recipe search app that lets users find recipes by ingredients they already have at home.',
    status: 'REJECTED',
    feedback: 'Good concept, but the API error states are not handled — please add proper error boundaries and resubmit.',
    assignmentNumber: 4,
  },
  {
    projectName: 'Personal Finance Tracker',
    repoUrl: 'https://github.com/rafiul/finance-tracker',
    liveLink: 'https://finance-tracker-demo.vercel.app',
    description:
      'An expense tracking app with charts for spending by category, built with Next.js, Prisma, and Chart.js.',
    status: 'APPROVED',
    feedback: 'Excellent data visualization and clean component structure.',
    assignmentNumber: 7,
  },
];

(async () => {
  const defaultPassword = await bcrypt.hash('Student@123', 12);

  const createdStudents = [];
  for (const s of demoStudents) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: { name: s.name, email: s.email, password: defaultPassword, role: 'STUDENT' },
    });
    createdStudents.push(user);
  }

  const emailToId = Object.fromEntries(createdStudents.map((u) => [u.email, u.id]));
  const ownerByRepo = {
    'https://github.com/rafiul/ecommerce-storefront': 'rafiul@example.com',
    'https://github.com/nusrat/task-manager': 'nusrat@example.com',
    'https://github.com/shakib/weather-dashboard': 'shakib@example.com',
    'https://github.com/mim/recipe-finder': 'mim@example.com',
    'https://github.com/rafiul/finance-tracker': 'rafiul@example.com',
  };

  for (const sub of demoSubmissions) {
    const studentId = emailToId[ownerByRepo[sub.repoUrl]];
    const existing = await prisma.submission.findFirst({
      where: { studentId, repoUrl: sub.repoUrl },
    });
    if (existing) continue;

    await prisma.submission.create({
      data: {
        assignmentNumber: sub.assignmentNumber,
        projectName: sub.projectName,
        repoUrl: sub.repoUrl,
        liveLink: sub.liveLink || null,
        description: sub.description,
        status: sub.status,
        feedback: sub.feedback || null,
        studentId,
      },
    });
  }

  console.log(`Seeded ${createdStudents.length} demo students and ${demoSubmissions.length} demo submissions.`);
  console.log('Demo student login: any of the emails above, password = Student@123');
  await prisma.$disconnect();
})();
