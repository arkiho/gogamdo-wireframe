import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection({
  uri: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true }
});

// 1. Create default template
const [templateResult] = await conn.execute(`
  INSERT INTO survey_templates (name, type, description, isDefault, isActive)
  VALUES (
    '사무환경 진단 설문',
    'company_wide',
    '고감도 사무환경 전문 진단 설문 — 공간 배치, 개인 업무 환경, 실내 환경, 협업 공간, 복지 시설, 브랜드 반영도를 종합 평가합니다. 응답 소요 시간 약 7~10분.',
    1,
    1
  )
`);
const templateId = templateResult.insertId;
console.log("✓ Template created, id:", templateId);

// 2. Insert questions with options
const questions = [
  // 카테고리 1: 기본 정보
  {
    section: "기본 정보",
    text: "귀하의 소속 부서를 선택해 주세요.",
    type: "single_choice",
    order: 1,
    options: ["경영/관리", "영업/마케팅", "개발/IT", "디자인/크리에이티브", "재무/회계", "인사/총무", "연구/기획", "기타"]
  },
  {
    section: "기본 정보",
    text: "귀하의 주된 업무 형태를 선택해 주세요.",
    type: "single_choice",
    order: 2,
    options: ["집중 개인 업무 위주", "팀 협업/회의 위주", "고객 응대/미팅 위주", "혼합형(개인+협업 반반)"]
  },
  {
    section: "기본 정보",
    text: "현재 근무 형태를 선택해 주세요.",
    type: "single_choice",
    order: 3,
    options: ["사무실 전일 출근", "하이브리드(주 2~3일 출근)", "재택 위주(주 1일 이하 출근)"]
  },
  // 카테고리 2: 공간 배치 및 동선
  {
    section: "공간 배치 및 동선",
    text: "현재 사무실의 전체적인 공간 배치에 대해 어떻게 생각하십니까?",
    type: "scale",
    order: 4,
    metadata: { scaleMin: 1, scaleMax: 5, scaleLabels: ["매우 불만족", "불만족", "보통", "만족", "매우 만족"] }
  },
  {
    section: "공간 배치 및 동선",
    text: "업무 중 이동 동선(프린터, 회의실, 탕비실 등)이 효율적이라고 느끼십니까?",
    type: "scale",
    order: 5,
    metadata: { scaleMin: 1, scaleMax: 5, scaleLabels: ["매우 비효율적", "비효율적", "보통", "효율적", "매우 효율적"] }
  },
  {
    section: "공간 배치 및 동선",
    text: "현재 사무실에서 가장 개선이 필요한 공간은 어디입니까? (복수 선택 가능)",
    type: "multiple_choice",
    order: 6,
    options: ["개인 업무 공간", "회의실", "휴게/라운지 공간", "탕비실/카페테리아", "수납/창고 공간", "리셉션/로비", "화장실", "기타"]
  },
  // 카테고리 3: 개인 업무 공간
  {
    section: "개인 업무 공간",
    text: "현재 개인 업무 공간(책상, 의자 등)의 크기와 배치에 만족하십니까?",
    type: "scale",
    order: 7,
    metadata: { scaleMin: 1, scaleMax: 5, scaleLabels: ["매우 불만족", "불만족", "보통", "만족", "매우 만족"] }
  },
  {
    section: "개인 업무 공간",
    text: "업무 중 프라이버시(시각적/청각적)가 충분히 확보되어 있다고 느끼십니까?",
    type: "scale",
    order: 8,
    metadata: { scaleMin: 1, scaleMax: 5, scaleLabels: ["전혀 그렇지 않다", "그렇지 않다", "보통", "그렇다", "매우 그렇다"] }
  },
  {
    section: "개인 업무 공간",
    text: "개인 업무 공간에서 가장 불편한 점은 무엇입니까? (복수 선택 가능)",
    type: "multiple_choice",
    order: 9,
    options: ["책상 크기 부족", "의자 불편", "수납공간 부족", "옆 사람과의 거리 너무 가까움", "모니터/장비 배치 불편", "특별히 불편한 점 없음"]
  },
  // 카테고리 4: 실내 환경
  {
    section: "실내 환경",
    text: "사무실의 조명(밝기, 색온도)이 업무에 적합하다고 느끼십니까?",
    type: "scale",
    order: 10,
    metadata: { scaleMin: 1, scaleMax: 5, scaleLabels: ["매우 부적합", "부적합", "보통", "적합", "매우 적합"] }
  },
  {
    section: "실내 환경",
    text: "사무실의 온도 및 환기 상태에 만족하십니까?",
    type: "scale",
    order: 11,
    metadata: { scaleMin: 1, scaleMax: 5, scaleLabels: ["매우 불만족", "불만족", "보통", "만족", "매우 만족"] }
  },
  {
    section: "실내 환경",
    text: "업무 중 소음으로 인해 집중이 방해받는 정도는 어떻습니까?",
    type: "scale",
    order: 12,
    metadata: { scaleMin: 1, scaleMax: 5, scaleLabels: ["항상 방해받음", "자주 방해받음", "보통", "거의 방해받지 않음", "전혀 방해받지 않음"] }
  },
  // 카테고리 5: 협업 및 회의 공간
  {
    section: "협업 및 회의 공간",
    text: "회의실의 수와 크기가 팀의 필요에 적합하다고 생각하십니까?",
    type: "scale",
    order: 13,
    metadata: { scaleMin: 1, scaleMax: 5, scaleLabels: ["매우 부족", "부족", "보통", "적합", "매우 적합"] }
  },
  {
    section: "협업 및 회의 공간",
    text: "비공식적인 소통이나 브레인스토밍을 할 수 있는 공간이 충분합니까?",
    type: "scale",
    order: 14,
    metadata: { scaleMin: 1, scaleMax: 5, scaleLabels: ["매우 부족", "부족", "보통", "충분", "매우 충분"] }
  },
  {
    section: "협업 및 회의 공간",
    text: "화상회의/온라인 미팅을 위한 공간과 장비가 적절히 갖춰져 있습니까?",
    type: "scale",
    order: 15,
    metadata: { scaleMin: 1, scaleMax: 5, scaleLabels: ["매우 부족", "부족", "보통", "적합", "매우 적합"] }
  },
  // 카테고리 6: 복지 및 편의시설
  {
    section: "복지 및 편의시설",
    text: "휴게 공간(라운지, 카페테리아 등)의 질과 접근성에 만족하십니까?",
    type: "scale",
    order: 16,
    metadata: { scaleMin: 1, scaleMax: 5, scaleLabels: ["매우 불만족", "불만족", "보통", "만족", "매우 만족"] }
  },
  {
    section: "복지 및 편의시설",
    text: "사무실에 추가되었으면 하는 편의시설이 있다면 선택해 주세요. (복수 선택 가능)",
    type: "multiple_choice",
    order: 17,
    options: ["집중 업무 부스(폰부스)", "스탠딩 데스크", "수면/휴식 공간", "운동/스트레칭 공간", "사내 카페/바리스타", "샤워실", "수유실", "특별히 없음"]
  },
  // 카테고리 7: 브랜드 및 종합 평가
  {
    section: "브랜드 및 종합 평가",
    text: "현재 사무실이 회사의 브랜드 이미지와 문화를 잘 반영하고 있다고 생각하십니까?",
    type: "scale",
    order: 18,
    metadata: { scaleMin: 1, scaleMax: 5, scaleLabels: ["전혀 그렇지 않다", "그렇지 않다", "보통", "그렇다", "매우 그렇다"] }
  },
  {
    section: "브랜드 및 종합 평가",
    text: "전반적으로 현재 사무환경에 대한 만족도를 평가해 주세요.",
    type: "scale",
    order: 19,
    metadata: { scaleMin: 1, scaleMax: 10, scaleLabels: ["1점", "2점", "3점", "4점", "5점", "6점", "7점", "8점", "9점", "10점"] }
  },
  {
    section: "브랜드 및 종합 평가",
    text: "사무환경 개선을 위해 자유롭게 의견을 남겨주세요.",
    type: "text",
    order: 20,
    metadata: { placeholder: "현재 사무환경에서 가장 개선이 필요한 부분이나, 좋은 점 등을 자유롭게 작성해 주세요." }
  },
];

for (const q of questions) {
  const metadata = q.metadata ? JSON.stringify(q.metadata) : null;
  const [qResult] = await conn.execute(
    `INSERT INTO survey_questions (templateId, sectionTitle, questionText, questionType, isRequired, sortOrder, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [templateId, q.section, q.text, q.type, 1, q.order, metadata]
  );
  const questionId = qResult.insertId;

  if (q.options) {
    for (let i = 0; i < q.options.length; i++) {
      await conn.execute(
        `INSERT INTO survey_question_options (questionId, optionText, optionValue, sortOrder)
         VALUES (?, ?, ?, ?)`,
        [questionId, q.options[i], q.options[i], i + 1]
      );
    }
  }
  console.log(`✓ Q${q.order}: ${q.text.substring(0, 30)}... (${q.type}${q.options ? ', ' + q.options.length + ' options' : ''})`);
}

console.log("\n✅ 사무환경 진단 설문 기본 템플릿 등록 완료!");
console.log(`Template ID: ${templateId}, Questions: ${questions.length}`);

await conn.end();
