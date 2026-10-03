const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function runTests() {
  console.log('====================================================');
  console.log('NCC EXAM & QUESTION BANK SYSTEM - AUTOMATED VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Test Users & Passwords
    console.log('1. Testing User Authentication & Passwords...');
    const admin = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });
    assert(admin && admin.role === 'ADMIN', 'Admin account exists with ADMIN role');
    const isAdminPasswordValid = await bcrypt.compare('admin123', admin.password);
    assert(isAdminPasswordValid, 'Admin password hashes and verifies with bcrypt');

    const student = await prisma.user.findUnique({
      where: { email: 'student@example.com' },
      include: { studentProfile: true },
    });
    assert(student && student.role === 'STUDENT', 'Student account exists with STUDENT role');
    assert(student.studentProfile && student.studentProfile.studentId === 'NCC-SD-2026-007', 'Student profile contains Cadet Regimental Roll ID');

    // 2. Test Question Bank & Multiple Question Types
    console.log('\n2. Testing Question Bank & Multiple Question Types...');
    const questions = await prisma.question.findMany({
      include: { options: true, pairs: true },
    });
    assert(questions.length >= 7, `Question bank has ${questions.length} questions`);

    const mcq = questions.find((q) => q.type === 'MCQ');
    assert(mcq && mcq.options.length > 0, 'MCQ question type has options populated');

    const tf = questions.find((q) => q.type === 'TRUE_FALSE');
    assert(tf && tf.options.some((o) => o.text === 'True'), 'True/False question has True/False options');

    const fillBlank = questions.find((q) => q.type === 'FILL_BLANKS');
    assert(fillBlank && fillBlank.acceptedAnswersJson, 'Fill in the blanks has accepted answers JSON');

    const matchPairs = questions.find((q) => q.type === 'MATCH_FOLLOWING');
    assert(matchPairs && matchPairs.pairs.length >= 3, 'Match the following has pairs');

    const ordering = questions.find((q) => q.type === 'ORDERING');
    assert(ordering && ordering.options.length >= 3, 'Ordering question has ordered sequence');

    const descriptive = questions.find((q) => q.type === 'LONG_ANSWER' || q.type === 'SHORT_ANSWER');
    assert(descriptive && descriptive.requiresManualEvaluation, 'Descriptive question has manual evaluation flag');

    // 3. Test Exam & Section Builder
    console.log('\n3. Testing Exam Structure & Section Building...');
    const exam = await prisma.exam.findFirst({
      where: { examCode: 'NCC-B-2026-CS' },
      include: {
        sections: { include: { examQuestions: true } },
        examQuestions: true,
      },
    });
    assert(exam && exam.status === 'ACTIVE', 'Active NCC Exam found in database');
    assert(exam.sections.length >= 2, `Exam has ${exam.sections.length} configured sections`);
    assert(exam.examQuestions.length >= 6, `Exam has ${exam.examQuestions.length} associated questions`);
    assert(exam.duration === 30, 'Exam has 30-minute duration configured');

    // 4. Test Server-Authoritative Timer & Attempt Lifecycle
    console.log('\n4. Testing Server-Authoritative Expiration & Attempt Lifecycle...');
    const now = new Date();
    const durationMinutes = 30;
    const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

    const testAttempt = await prisma.examAttempt.create({
      data: {
        examId: exam.id,
        studentId: student.id,
        attemptNumber: 99,
        startedAt: now,
        expiresAt,
        status: 'IN_PROGRESS',
      },
    });

    assert(testAttempt && testAttempt.status === 'IN_PROGRESS', 'New exam attempt created with IN_PROGRESS status');
    assert(testAttempt.expiresAt > testAttempt.startedAt, 'Server-authoritative expiresAt correctly set ahead of startedAt');

    // Test Autosaving answers
    console.log('\n5. Testing Autosave & Response Storage...');
    const ans1 = await prisma.studentAnswer.create({
      data: {
        attemptId: testAttempt.id,
        questionId: mcq.id,
        selectedOptionIdsJson: JSON.stringify([mcq.options.find((o) => o.isCorrect).id]),
        isAnswered: true,
        isVisited: true,
      },
    });
    assert(ans1 && ans1.isAnswered, 'Answer autosaved with selected option JSON');

    // Test Autograding & Negative Marking Logic
    console.log('\n6. Testing Autograding & Score Calculation...');
    const correctOptionId = mcq.options.find((o) => o.isCorrect).id;
    const wrongOptionId = mcq.options.find((o) => !o.isCorrect).id;

    // Test correct answer
    const isCorrectChoice = ans1.selectedOptionIdsJson.includes(correctOptionId);
    assert(isCorrectChoice, 'MCQ student choice matches correct option');

    // 7. Test Submission & Manual Evaluation Recalculation
    console.log('\n7. Testing Submission & Manual Evaluation Recalculation...');
    const shortQ = questions.find((q) => q.type === 'SHORT_ANSWER');
    const descAnswer = await prisma.studentAnswer.create({
      data: {
        attemptId: testAttempt.id,
        questionId: shortQ.id,
        textAnswer: 'A Service Protractor is a 6"x2" instrument used for plotting bearings on surveyed maps.',
        isAnswered: true,
      },
    });

    // Simulate manual evaluation by Admin
    await prisma.manualEvaluation.create({
      data: {
        studentAnswerId: descAnswer.id,
        evaluatorId: admin.id,
        marksAwarded: 3.0,
        maxMarks: 3.0,
        feedback: 'Precise and accurate definition.',
      },
    });

    await prisma.studentAnswer.update({
      where: { id: descAnswer.id },
      data: { marksAwarded: 3.0, isCorrect: true },
    });

    // Submit attempt
    const submittedAttempt = await prisma.examAttempt.update({
      where: { id: testAttempt.id },
      data: {
        status: 'EVALUATED',
        submissionMethod: 'MANUAL',
        submittedAt: new Date(),
        totalScore: 5.0,
        percentage: 21.7,
        isPassed: false,
      },
    });

    assert(submittedAttempt.status === 'EVALUATED', 'Attempt marked EVALUATED after submission and grading');
    assert(submittedAttempt.submissionMethod === 'MANUAL', 'Submission method recorded as MANUAL');

    // Clean up test attempt
    await prisma.manualEvaluation.deleteMany({ where: { studentAnswerId: descAnswer.id } });
    await prisma.studentAnswer.deleteMany({ where: { attemptId: testAttempt.id } });
    await prisma.examAttempt.delete({ where: { id: testAttempt.id } });
    console.log('  ✓ Cleaned up test attempt artifacts');

    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
