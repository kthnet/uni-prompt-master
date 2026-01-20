import { GeneratedResult, RoleType, TaskType } from '../types';

export const mockGenerator = (
  role: RoleType,
  task: TaskType,
  userContext: string
): Promise<GeneratedResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let result: GeneratedResult;

      // Detect keywords to customize the output dynamically
      const isSummary = userContext.includes('요약') || userContext.includes('Summary');
      const isProposal = userContext.includes('제안') || userContext.includes('기획') || userContext.includes('Proposal');

      // Logic to generate different "flavors" of prompts based on task
      switch (task) {
        case 'NATIONAL_PROJECT':
          result = {
            prompt: `[Context]
당신은 교육부 대형 국책사업(RISE, 글로컬30, 대학혁신지원사업) 평가위원 경력이 10년 이상인 기획 보고서 작성 수석 컨설턴트입니다. 대학의 강점을 지역 산업 수요와 연결하는 데 탁월한 능력을 가지고 있습니다.

[Task]
아래 <input_context>에 기술된 내용을 바탕으로, 심사위원에게 우리 대학의 경쟁력을 가장 효과적으로 전달할 수 있는 '사업계획서 핵심 파트'를 작성하십시오.
${isSummary ? '특히, 방대한 내용을 핵심 위주로 압축하여 가독성을 극대화하십시오.' : '특히, 사업의 독창성과 실현 가능성을 구체적으로 확장하여 서술하십시오.'}

<input_context>
${userContext}
</input_context>

[Constraints]
1. 정량적 성과(수치 데이터)가 있다면 굵게(Bold) 표시하여 가독성을 높이십시오.
2. 문체는 신뢰감을 주는 '건조하지만 확신에 찬' 어조(Professional & Confident Tone)를 사용하십시오.
3. Google의 CoT(Chain of Thought) 기법을 사용하여, [현황 분석] -> [문제 제기] -> [해결 전략] -> [기대 효과] 순으로 논리를 전개하십시오.
4. 핵심 전략은 XML 태그 <strategy> 안에 요약해 주십시오.

[Output Format]
Markdown 형식으로 작성하되, 가독성을 위해 불렛 포인트와 소제목을 적극 활용하십시오.`,
            analysis: [
              {
                tag: 'Persona',
                content: '교육부 평가위원 출신 컨설턴트 페르소나를 적용하여, 심사위원이 선호하는 전문 용어와 논리 구조를 갖추도록 했습니다.',
                source: 'OpenAI',
                color: 'purple'
              },
              {
                tag: 'Delimiters',
                content: '사용자 입력값(<input_context>)을 XML 태그로 명확히 분리하여, AI가 배경 지식과 지시 사항을 혼동하지 않게 했습니다.',
                source: 'Anthropic',
                color: 'indigo'
              },
              {
                tag: 'Chain of Thought',
                content: '단순 작문이 아닌 [현황->문제->해결]의 논리적 흐름을 강제하여 설득력 있는 보고서를 만들도록 설계했습니다.',
                source: 'Google',
                color: 'blue'
              },
              ...(isProposal ? [{
                tag: 'Idea Expansion',
                content: '제안 요청임을 감지하여, 단순 서술을 넘어 사업의 기대 효과와 미래 가치를 확장하도록 지시했습니다.',
                source: 'Common',
                color: 'green'
              } as any] : [])
            ],
            tip: isProposal 
              ? "제안서는 'What'보다 'Why'가 중요합니다. 프롬프트에 '왜 지금 이 사업이 필요한가?'에 대한 배경(지역 소멸 위기 등)을 한 줄만 추가해도 설득력이 배가됩니다."
              : "국고사업 계획서는 '근거 기반(Evidence-based)' 서술이 중요합니다. 입력 창에 구체적인 수치(예: 취업률 85%, 특허 12건)를 포함시키면 결과물의 품질이 비약적으로 상승합니다."
          };
          break;

        case 'GENERAL_ADMIN':
          result = {
            prompt: `[Context]
당신은 대한민국 대학 행정 규정 및 공문서 작성의 20년 차 전문가입니다. 명확하고 간결하며, 행정 용어 순화 가이드라인을 완벽히 준수합니다.

[Task]
사용자가 입력한 <draft_content>의 핵심 의도를 파악하여, 대학 내부 또는 외부로 발송하기에 적합한 '공식 문서(공문, 안내문, 보고서)' 형태로 정제하여 작성하십시오.
${isSummary ? '내용을 요약하여 1페이지 이내의 Executive Summary 형태로 작성하십시오.' : ''}

<draft_content>
${userContext}
</draft_content>

[Constraints]
1. 공문서의 기본 원칙(명확성, 간결성, 예절성)을 엄격히 준수하십시오.
2. 불필요한 수식어나 번역투 문장을 제거하고, '행정 업무 편람' 표준 용어를 사용하십시오.
3. 수신자가 취해야 할 행동이 있다면 <action_required> 태그 안에 별도로 요약하십시오.
4. Few-shot Example:
   - Input: "전기 아껴주세요."
   - Output: "에너지 절감 시책에 적극 협조하여 주시기 바랍니다."

[Tone & Manner]
정중하고 객관적이며, 행정적 권위가 느껴지는 어조.`,
            analysis: [
              {
                tag: 'Persona',
                content: '20년 차 행정 전문가 페르소나를 통해 비문이나 가벼운 표현을 배제하고 격식 있는 문체를 보장했습니다.',
                source: 'OpenAI',
                color: 'purple'
              },
              {
                tag: 'Few-shot Prompting',
                content: '입력(Input)과 이상적인 출력(Output) 예시를 제공하여, AI가 어떤 스타일로 변환해야 하는지 명확한 기준을 제시했습니다.',
                source: 'Google',
                color: 'green'
              },
              {
                tag: 'Structured Output',
                content: '핵심 행동 요령을 별도 태그(<action_required>)로 추출하여 업무 명확성을 높였습니다.',
                source: 'Anthropic',
                color: 'indigo'
              }
            ],
            tip: isSummary
              ? "보고서 요약 시에는 '누구에게 보고하는가'를 명시하는 것이 좋습니다. '총장 보고용'과 '실무자 공유용'은 요약의 깊이가 다르기 때문입니다."
              : "공문서는 수신자(학생, 교수, 외부기관)에 따라 어조가 달라져야 합니다. 입력 내용 앞에 '수신: 전체 학생'과 같이 타겟을 명시하면 더 정확한 톤앤매너를 얻을 수 있습니다."
          };
          break;

        case 'ACADEMIC_RESEARCH':
          result = {
            prompt: `[Context]
당신은 학생들의 학습 동기를 부여하고 창의적 사고를 이끌어내는 데 탁월한 '베스트 티칭 어워드' 수상 교수이자 연구 멘토입니다.

[Task]
입력된 <topic_description>을 바탕으로, 해당 주제를 교육적 또는 학술적으로 가장 잘 풀어낼 수 있는 자료(강의계획, 토론주제, 연구초록 등)를 작성하십시오.

<topic_description>
${userContext}
</topic_description>

[Constraints]
1. 단순 지식 전달보다는 '질문'과 '탐구'를 유도하는 구성을 취하십시오.
2. 교육 자료인 경우, 학생들의 흥미를 끌 수 있는 실생활 예시나 딜레마 상황을 포함하십시오.
3. 답변 구조화:
   - [목표]: 이 활동의 핵심 교육/연구 목표 (1문장)
   - [핵심 내용]: 주요 키워드 및 개요
   - [세부 계획]: 단계별 실행 계획 (표 형식 권장)

[Step-by-Step Reasoning]
1. 주제의 최신 트렌드와 학문적 중요성을 분석하십시오.
2. 대상 독자(학생/연구자)의 수준을 고려하여 난이도를 조절하십시오.
3. 논리적이고 체계적인 구조로 아웃풋을 생성하십시오.`,
            analysis: [
              {
                tag: 'Persona',
                content: "'베스트 티칭 어워드' 수상 교수라는 구체적인 페르소나를 통해, 권위적이면서도 학생 친화적인 톤을 설정했습니다.",
                source: 'OpenAI',
                color: 'purple'
              },
              {
                tag: 'Chain of Thought',
                content: '[Step-by-Step Reasoning]을 통해 AI가 바로 작성하지 않고 주제 분석과 타겟 설정을 먼저 수행하도록 유도했습니다.',
                source: 'Google',
                color: 'blue'
              },
              {
                tag: 'Format Constraint',
                content: '표 형식(Markdown Table) 등 구체적인 출력 형식을 지정하여 바로 활용 가능한 결과물을 요청했습니다.',
                source: 'Common',
                color: 'green'
              }
            ],
            tip: isProposal
             ? "연구 제안서는 심사위원의 눈길을 끄는 '첫 문장(Hook)'이 중요합니다. 연구의 필요성을 사회적 이슈나 최신 트렌드와 연결하여 입력해보세요."
             : "강의 계획이나 연구 초록은 '타겟 오디언스'가 누구냐가 핵심입니다. 입력 시 '학부 1학년 대상' 또는 '전문 연구자 대상'과 같이 대상을 명시해보세요."
          };
          break;

        case 'ADMISSION_PR':
          result = {
            prompt: `[Context]
당신은 Z세대의 트렌드를 선도하며, 대학의 브랜드 가치를 높이는 입시 홍보 및 디지털 마케팅 디렉터입니다.

[Task]
아래 <campaign_source>에 입력된 정보를 바탕으로, 지원자(수험생/학부모)의 마음을 움직일 수 있는 매력적인 홍보 콘텐츠(SNS 게시물, 숏폼 대본, 카피라이팅 등)를 제작하십시오.

<campaign_source>
${userContext}
</campaign_source>

[Constraints]
1. 타겟에 맞춰 이모지(Emoji)를 적절히 사용하고, 친근하고 트렌디한 어투를 사용하십시오. 🔥
2. 문장은 모바일 환경 가독성을 위해 짧고 강렬하게(Short & Impactful) 끊어 쓰십시오.
3. 마케팅 프레임워크 AIDA(Attention-Interest-Desire-Action)를 적용하여 구성하십시오.
   - Attention: 시선을 사로잡는 헤드라인
   - Interest: 흥미로운 사실이나 혜택 제시
   - Desire: 우리 대학에 지원하고 싶은 욕구 자극
   - Action: 구체적인 행동 유도 (클릭, 지원 등)

[Output Format]
매체별(인스타그램, 블로그, 유튜브) 특성에 맞는 포맷으로 출력하십시오.`,
            analysis: [
              {
                tag: 'Persona',
                content: '디지털 마케팅 디렉터 역할을 부여하여, 딱딱한 대학 홍보톤을 벗어나 트렌디하고 감각적인 언어를 사용하게 했습니다.',
                source: 'OpenAI',
                color: 'purple'
              },
              {
                tag: 'Framework Usage',
                content: '검증된 마케팅 프레임워크(AIDA)를 적용하여, 단순히 글을 쓰는 게 아니라 사용자를 설득하는 구조를 갖췄습니다.',
                source: 'Common',
                color: 'green'
              },
              {
                tag: 'Delimiters',
                content: '입력 소스(<campaign_source>)를 태그로 감싸, AI가 홍보해야 할 핵심 소재를 정확히 인지하도록 했습니다.',
                source: 'Anthropic',
                color: 'indigo'
              }
            ],
            tip: isSummary
              ? "성과 보고는 수치(Numbers)가 생명입니다. '참여자 100명 증가'보다 '전년 대비 150% 성장'과 같이 비율을 함께 제시하면 성과가 더 돋보입니다."
              : "홍보 카피는 '차별점'이 생명입니다. 우리 대학만의 유니크한 혜택(예: 해외연수 전액 지원)을 구체적으로 입력할수록 더 강력한 카피가 나옵니다."
          };
          break;
          
        default:
          result = {
             prompt: "프롬프트를 생성할 수 없습니다.",
             analysis: [],
             tip: ""
          };
      }

      resolve(result);
    }, 1500); // 1.5s delay simulation
  });
};