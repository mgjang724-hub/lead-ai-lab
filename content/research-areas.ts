import type { ResearchArea } from './types';

/**
 * 연구 분야 — 첨부 실적(논문 62·저역서 9·학술발표 23·프로젝트 15)의 제목을 분석해 도출한 **임시 분류**입니다.
 * 연구실 공식 분야가 확정되면 title/ko/summary 를 수정하고 provisional 을 false 로 바꾸세요.
 * id 는 publications.json / projects.json 의 areas 값과 연결됩니다.
 * 2026-11-06: 자기조절학습(self-regulated-learning)은 분야에서 빼고 해당 실적을 교수설계와 학습환경으로 합쳤으며,
 * 교원 역량과 HRD(teacher-competency-hrd)는 교사 역량(teacher-competency)과 HRD(hrd)로 나눴습니다.
 */
export const researchAreas: ResearchArea[] = [
  {
    id: 'ai-in-education',
    slug: 'ai-in-education',
    title: 'AI in Education',
    ko: '교육 인공지능',
    summary: '생성형 AI와 LLM을 교수·학습 과정에 적용하는 도구를 개발하고, 교원과 학습자의 AI·디지털 역량을 진단·지원합니다.',
    description:
      'LLM 기반 교수·학습 과정안 평가 시스템, 문제기반학습 수업 설계를 돕는 스캐폴딩 챗봇, 팀 프로젝트의 갈등을 감지하는 ChatGPT 기반 챗봇, 디지털 휴먼 교수자 유형의 효과 등 최근 연구가 이 분야에 속합니다. 교원의 AI·디지털 역량 측정 도구 개발과 교육요구 분석도 함께 다룹니다.',
    keywords: ['Generative AI', 'LLM', 'Chatbot', 'Digital Human', 'AI Competency'],
    media: '연구 분야 — AI in Education',
    provisional: true,
  },
  {
    id: 'learning-analytics',
    slug: 'learning-analytics',
    title: 'Learning Analytics',
    ko: '학습분석',
    summary: '학습관리시스템(LMS) 활동 데이터로 학업성취를 예측하고, 학습위험군을 조기에 판별해 지원하는 모형과 대시보드를 연구합니다.',
    description:
      '머신러닝 기반 학업성취 예측 모형, 학사경고자 예측을 위한 학습분석 모형, LMS 인터랙션 데이터와 실제 사용의 관계, 토픽 모델링·네트워크 시각화 기반 피드백, 대입전형 유형에 따른 학업성취 추이 분석 등이 포함됩니다. 한국연구재단 지원으로 학습위험군 조기 지원 판별머신과 인터랙티브 대시보드를 개발했습니다.',
    keywords: ['LMS Data', 'Prediction Model', 'Early Warning', 'Topic Modeling', 'Dashboard'],
    media: '연구 분야 — Learning Analytics',
    provisional: true,
  },
  {
    id: 'instructional-design',
    slug: 'instructional-design',
    title: 'Instructional Design & Learning Environments',
    ko: '교수설계와 학습환경',
    summary: '문제기반학습·협력학습의 설계, 스마트교육과 디지털교과서, 디지털 피드백, 자기조절학습을 돕는 전략 등 기술이 결합된 학습환경의 설계와 효과를 연구합니다.',
    description:
      'PBL 문제 개발의 User-Design 접근, Active Learning Classroom 사례, iPad·스마트패드·터치 기반 상호작용의 학습 효과, 지필시험에 대한 디지털 첨삭, 스마트교육 정책과 디지털교과서 평가, 이러닝·원격수업 환경의 실재감 연구가 이 분야에 속합니다. 메타인지 피드백과 생성적 학습전략, 개념도 전략, 협력학습에서의 집단자기조절 등 자기조절학습을 돕는 설계 연구도 여기에 포함합니다. 『교육공학』, 『교수설계 지식기반』, 『교수의 으뜸원리』 등 저역서도 함께 참고할 수 있습니다.',
    keywords: ['PBL', 'Smart Education', 'Digital Feedback', 'Self-Regulated Learning', 'Learning Environments'],
    media: '연구 분야 — Instructional Design',
    provisional: true,
  },
  {
    id: 'teacher-competency',
    slug: 'teacher-competency',
    title: 'Teacher Competency',
    ko: '교사 역량',
    summary: '예비교사와 현직 교원의 역량을 모델링하고 교육요구를 분석하며, 스마트교육·AI·디지털 역량의 진단 도구를 개발합니다.',
    description:
      '교원양성 과정에서 예비교사의 역량 변화, 학교현장실습의 역량 향상 효과, 교직이론과목이 역량에 미치는 영향, 사범대학 재학생의 교수역량 진단, 예비교사와 현직교사의 교육요구 인식 차이, 스마트교육 교원역량 진단 도구, 교원의 AI·디지털 역량 측정 도구와 교육요구 분석, 교사의 AI·에듀테크 활용 의도 연구가 이 분야에 속합니다.',
    keywords: ['Pre-service Teachers', 'Competency Modeling', 'Needs Analysis', 'Teaching Practicum', 'Digital Competency'],
    media: '연구 분야 — Teacher Competency',
    provisional: true,
  },
  {
    id: 'hrd',
    slug: 'hrd',
    title: 'HRD',
    ko: '인적자원개발',
    summary: '기업 사내강사와 관리자의 역량 개발, 멘토링 프로그램의 효과, 교육 투자의 ROI 등 조직과 성인 학습자의 인적자원개발을 연구합니다.',
    description:
      '국내 대기업 사내강사의 역량과 교육요구 분석, 시·도 교육청 고급관리자 역량모델링, 멘토링 프로그램이 팀 지원·의사소통·직무만족에 미치는 영향, 예비 청소년교육 전문 인력의 역량과 교육요구, 성인 학습공동체의 전환학습, 『HRD 담당자를 위한 ROI의 기초』 등이 이 분야에 속합니다.',
    keywords: ['Corporate HRD', 'Competency Modeling', 'Mentoring', 'ROI', 'Adult Learning'],
    media: '연구 분야 — HRD',
    provisional: true,
  },
];

export const areaById = Object.fromEntries(researchAreas.map((a) => [a.id, a])) as Record<ResearchArea['id'], ResearchArea>;
