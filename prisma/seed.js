const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with NCC Examination & Question Bank data...');

  // Clean existing data
  await prisma.manualEvaluation.deleteMany();
  await prisma.studentAnswer.deleteMany();
  await prisma.examAttempt.deleteMany();
  await prisma.examQuestion.deleteMany();
  await prisma.examSection.deleteMany();
  await prisma.questionPair.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.uploadedQuestionPaper.deleteMany();
  await prisma.user.deleteMany();

  // Create Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      username: 'admin',
      name: 'Major Vikram Singh (ANO)',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // Create Student
  const studentPassword = await bcrypt.hash('student123', 10);
  const student = await prisma.user.create({
    data: {
      email: 'student@example.com',
      username: 'cadet_aarav',
      name: 'Cadet Aarav Sharma',
      password: studentPassword,
      role: 'STUDENT',
      status: 'ACTIVE',
      studentProfile: {
        create: {
          studentId: 'NCC-SD-2026-007',
          course: 'Senior Division Army Wing',
          batch: '2025-2026',
          unit: '1 Delhi Composite Battalion',
          phone: '+91 98765 43210',
        },
      },
    },
  });

  // Create Student 2
  const cadet2Password = await bcrypt.hash('cadet123', 10);
  await prisma.user.create({
    data: {
      email: 'cadet_priya@example.com',
      username: 'cadet_priya',
      name: 'Cadet Priya Nair',
      password: cadet2Password,
      role: 'STUDENT',
      status: 'ACTIVE',
      studentProfile: {
        create: {
          studentId: 'NCC-SW-2026-042',
          course: 'Senior Wing Naval Unit',
          batch: '2025-2026',
          unit: '2 Delhi Naval Unit',
          phone: '+91 98765 12345',
        },
      },
    },
  });

  // 1. Question: MCQ Single Correct
  const q1 = await prisma.question.create({
    data: {
      type: 'MCQ',
      question: 'What is the standard caliber of the 5.56mm INSAS Rifle issued for NCC weapon training?',
      subject: 'Weapon Training',
      topic: 'Small Arms',
      difficulty: 'EASY',
      defaultMarks: 2,
      negativeMarks: 0.5,
      explanation: 'The 5.56 mm INSAS (Indian Small Arms System) rifle fires standard 5.56×45mm NATO cartridges.',
      isMultipleCorrect: false,
      createdById: admin.id,
      options: {
        create: [
          { text: '7.62 mm', isCorrect: false, order: 0 },
          { text: '5.56 mm', isCorrect: true, order: 1 },
          { text: '9 mm Parabellum', isCorrect: false, order: 2 },
          { text: '.22 Deluxe Rifle', isCorrect: false, order: 3 },
        ],
      },
    },
  });

  // 2. Question: MCQ Multiple Correct
  const q2 = await prisma.question.create({
    data: {
      type: 'MCQ',
      question: 'Which of the following are the official Cardinal Principles of Discipline in the National Cadet Corps?',
      subject: 'NCC General',
      topic: 'Discipline & Ethos',
      difficulty: 'MEDIUM',
      defaultMarks: 3,
      negativeMarks: 0.5,
      explanation: 'The 4 Cardinal Principles of NCC are: (1) Obey with a smile, (2) Be punctual, (3) Work hard and without fuss, (4) Make no excuses and tell no lies.',
      isMultipleCorrect: true,
      createdById: admin.id,
      options: {
        create: [
          { text: 'Obey with a smile', isCorrect: true, order: 0 },
          { text: 'Be punctual at all times', isCorrect: true, order: 1 },
          { text: 'Retaliate against constructive criticism', isCorrect: false, order: 2 },
          { text: 'Make no excuses and tell no lies', isCorrect: true, order: 3 },
        ],
      },
    },
  });

  // 3. Question: True / False
  const q3 = await prisma.question.create({
    data: {
      type: 'TRUE_FALSE',
      question: "The official motto of the National Cadet Corps is 'Unity and Discipline' (Ekta aur Anushasan).",
      subject: 'NCC General',
      topic: 'NCC History',
      difficulty: 'EASY',
      defaultMarks: 1,
      negativeMarks: 0.25,
      explanation: "Adopted on 23 December 1957, the motto 'Unity and Discipline' represents the ethos of NCC.",
      createdById: admin.id,
      options: {
        create: [
          { text: 'True', isCorrect: true, order: 0 },
          { text: 'False', isCorrect: false, order: 1 },
        ],
      },
    },
  });

  // 4. Question: Fill in the Blanks
  const q4 = await prisma.question.create({
    data: {
      type: 'FILL_BLANKS',
      question: 'In Map Reading, the grid lines running horizontally from West to East are designated as ______.',
      subject: 'Map Reading',
      topic: 'Grid Reference',
      difficulty: 'MEDIUM',
      defaultMarks: 2,
      caseSensitive: false,
      acceptedAnswersJson: JSON.stringify(['Northings', 'northing', 'Northings lines', 'Northing']),
      explanation: 'Grid lines running horizontally from West to East with values increasing towards the North are Northings. Vertical lines are Eastings.',
      createdById: admin.id,
    },
  });

  // 5. Question: Match the Following
  const q5 = await prisma.question.create({
    data: {
      type: 'MATCH_FOLLOWING',
      question: 'Match the prestigious NCC Training Camps with their primary operational focus:',
      subject: 'NCC Training',
      topic: 'Camps & Activities',
      difficulty: 'MEDIUM',
      defaultMarks: 4,
      explanation: 'RDC takes place in Delhi culminating in the PM Rally. TSC focuses on obstacle course and shooting. YEP involves international goodwill exchanges. EBSB fosters national cultural integration.',
      createdById: admin.id,
      pairs: {
        create: [
          { leftItem: 'Republic Day Camp (RDC)', rightItem: 'PM Rally & Rajpath Marching Contingent', order: 0 },
          { leftItem: 'Thal Sainik Camp (TSC)', rightItem: 'Shooting & Obstacle Course Competition', order: 1 },
          { leftItem: 'Youth Exchange Programme (YEP)', rightItem: 'International Cadet Cultural Exchange', order: 2 },
          { leftItem: 'Ek Bharat Shreshtha Bharat (EBSB)', rightItem: 'Inter-State Cultural Integration', order: 3 },
        ],
      },
    },
  });

  // 6. Question: Ordering
  const q6 = await prisma.question.create({
    data: {
      type: 'ORDERING',
      question: 'Arrange the standard firing range procedure commands in their exact chronological order of execution:',
      subject: 'Weapon Training',
      topic: 'Range Procedure',
      difficulty: 'HARD',
      defaultMarks: 3,
      explanation: 'Range procedure order: 1. Detail Shastragar Se Hathiyar Lo -> 2. Position Ikhtiyar Karo -> 3. Bhare Shastragar Kholo -> 4. Bayan/Dahina Rukh Fire Karo -> 5. Roko Fire (Cease Fire).',
      createdById: admin.id,
      options: {
        create: [
          { text: 'Take up firing positions on the firing point (Position Lo)', isCorrect: true, order: 0 },
          { text: 'Load weapon with 5 rounds (Bhar)', isCorrect: true, order: 1 },
          { text: 'Aim and Fire at target figure 11 (Fire)', isCorrect: true, order: 2 },
          { text: 'Cease fire and clear chamber (Roko Fire & Khali Kar)', isCorrect: true, order: 3 },
        ],
      },
    },
  });

  // 7. Question: Short Answer
  const q7 = await prisma.question.create({
    data: {
      type: 'SHORT_ANSWER',
      question: 'Define what a "Service Protractor" is and state its primary use in military navigation and map reading.',
      subject: 'Map Reading',
      topic: 'Navigation Instruments',
      difficulty: 'MEDIUM',
      defaultMarks: 3,
      requiresManualEvaluation: true,
      expectedAnswer: 'A rectangular instrument of ivory/plastic measuring 6" x 2" used for plotting bearings, measuring distances on scale, and converting Grid Magnetic Angles.',
      explanation: 'The Service Protractor Mark IV-A is an indispensable military tool used to plot and read grid bearings directly on surveyed topographical sheets.',
      createdById: admin.id,
    },
  });

  // 8. Question: Long Answer
  const q8 = await prisma.question.create({
    data: {
      type: 'LONG_ANSWER',
      question: 'Elaborate upon the role and contributions of NCC Cadets in Civil Defence, Disaster Relief operations, and Community Development projects.',
      subject: 'Personality Development',
      topic: 'Disaster Management',
      difficulty: 'HARD',
      defaultMarks: 5,
      maxWordCount: 250,
      requiresManualEvaluation: true,
      expectedAnswer: 'Cadets assist civil authorities during floods/earthquakes in first aid distribution, crowd control, traffic management, blood donation drives, Swachh Bharat Abhiyan, and emergency shelter coordination.',
      explanation: 'The NCC acts as an auxiliary second line of community support under the Disaster Management Act.',
      createdById: admin.id,
    },
  });

  // Create Sample Exam with 2 Sections
  const exam = await prisma.exam.create({
    data: {
      title: "NCC 'B' Certificate Examination 2026 (Common Subjects)",
      description: 'Comprehensive assessment testing cadets on Drill, Weapon Training, National Integration, and Map Reading.',
      subject: 'NCC Common Syllabus',
      course: 'Army, Navy & Air Wing Cadets',
      examCode: 'NCC-B-2026-CS',
      duration: 30, // 30 minutes
      totalMarks: 23,
      passingMarks: 12,
      negativeMarking: 0.25,
      randomizeQuestions: false,
      randomizeOptions: false,
      showResultImmediately: true,
      showAnswersToStudent: true,
      allowRetake: true,
      maxAttempts: 3,
      status: 'ACTIVE',
      instructions: '1. All questions are compulsory.\n2. Negative marking of 0.25 applies to MCQs.\n3. Descriptive questions will be evaluated by your ANO.\n4. Do not refresh or exit fullscreen.',
      createdById: admin.id,
    },
  });

  // Create Section 1: Section A (Objective)
  const sec1 = await prisma.examSection.create({
    data: {
      examId: exam.id,
      name: 'Section A: Military Training & Ethos (Objective)',
      instructions: 'Contains Multiple Choice, True/False, and Matching items. Negative marking applies.',
      order: 0,
      totalMarks: 10,
    },
  });

  // Create Section 2: Section B (Applied Knowledge & Descriptive)
  const sec2 = await prisma.examSection.create({
    data: {
      examId: exam.id,
      name: 'Section B: Map Reading, Weapon Training & Field Craft',
      instructions: 'Contains Fill-in-the-blanks, Sequence Ordering, Short & Long Answer items.',
      order: 1,
      totalMarks: 13,
    },
  });

  // Associate Questions to Exam & Sections
  await prisma.examQuestion.createMany({
    data: [
      { examId: exam.id, sectionId: sec1.id, questionId: q1.id, marks: 2, negativeMarks: 0.5, order: 0 },
      { examId: exam.id, sectionId: sec1.id, questionId: q2.id, marks: 3, negativeMarks: 0.5, order: 1 },
      { examId: exam.id, sectionId: sec1.id, questionId: q3.id, marks: 1, negativeMarks: 0.25, order: 2 },
      { examId: exam.id, sectionId: sec1.id, questionId: q5.id, marks: 4, negativeMarks: 0, order: 3 },
      { examId: exam.id, sectionId: sec2.id, questionId: q4.id, marks: 2, negativeMarks: 0, order: 4 },
      { examId: exam.id, sectionId: sec2.id, questionId: q6.id, marks: 3, negativeMarks: 0, order: 5 },
      { examId: exam.id, sectionId: sec2.id, questionId: q7.id, marks: 3, negativeMarks: 0, order: 6 },
      { examId: exam.id, sectionId: sec2.id, questionId: q8.id, marks: 5, negativeMarks: 0, order: 7 },
    ],
  });

  // Create sample Uploaded Question Paper staging record
  const sampleUploadedPaper = {
    title: 'NCC Annual Camp Test 2025 (Extracted from PDF)',
    fileName: 'NCC_Annual_Camp_Question_Paper_2025.pdf',
    fileType: 'PDF',
    status: 'PENDING_REVIEW',
    extractedJson: JSON.stringify([
      {
        tempId: 'ext-1',
        type: 'MCQ',
        question: 'What is the full form of SLR used in Indian Armed Forces?',
        options: ['Self Loading Rifle', 'Single Lever Rifle', 'Standard Long Rifle', 'Service Line Rifle'],
        correctIndex: 0,
        marks: 2,
        subject: 'Weapon Training',
        status: 'NEEDS_REVIEW',
      },
      {
        tempId: 'ext-2',
        type: 'FILL_BLANKS',
        question: 'The degree of magnetic declination is measured with a ______ compass.',
        acceptedAnswers: ['Prismatic', 'liquid prismatic', 'Prismatic Compass'],
        marks: 2,
        subject: 'Map Reading',
        status: 'NEEDS_REVIEW',
      },
      {
        tempId: 'ext-3',
        type: 'TRUE_FALSE',
        question: 'In drill, the distance between two files in open order is 30 inches.',
        options: ['True', 'False'],
        correctIndex: 0,
        marks: 1,
        subject: 'Drill',
        status: 'NEEDS_REVIEW',
      }
    ]),
    createdById: admin.id,
  };

  await prisma.uploadedQuestionPaper.create({
    data: sampleUploadedPaper,
  });

  console.log('Database seeded successfully with Admin, Students, Questions, and Active Exam!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
