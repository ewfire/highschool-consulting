// Gemini API Configuration
const GEMINI_API_KEY = 'AIzaSyBY1aPCt5gkJr7m8BCuTRUjtLl5PWHO4Dg'; // 실제 사용시 환경변수로 관리
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// 버전 관리 및 데이터 클리어
const SCRIPT_VERSION = '3.2';
const STORAGE_VERSION_KEY = 'sajuApp_version';

// Global variables
let currentUserData = {};

// Page navigation functions
function startAnalysis() {
    window.location.href = 'input.html';
}

function goBack() {
    window.history.back();
}

function goToInput() {
    // 기존 로딩 상태 정리
    hideLoadingScreen();
    
    // input.html로 이동
    window.location.href = 'input.html';
}

// Initialize page based on current location
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOMContentLoaded 이벤트 발생 ===');
    const currentPage = window.location.pathname.split('/').pop();
    console.log('현재 페이지:', currentPage);
    
    if (currentPage === 'input.html' || currentPage === '') {
        console.log('📄 입력 페이지 감지 - initializeInputPage 호출');
        initializeInputPage();
    } else if (currentPage === 'result.html') {
        console.log('📊 결과 페이지 감지 - initializeResultPage 호출');
        initializeResultPage();
    } else {
        console.log('⚠️ 알 수 없는 페이지:', currentPage);
    }
});

// Input page initialization
function initializeInputPage() {
    setupDateSelectors();
    setupFormSubmission();
    
    // 브라우저 뒤로가기로 돌아온 경우 로딩 화면 숨기기
    hideLoadingScreen();
    
    // 페이지가 뒤로가기로 접근된 경우 감지
    if (performance.navigation.type === performance.navigation.TYPE_BACK_FORWARD) {
        // 뒤로가기로 온 경우 기존 localStorage 데이터로 폼 복원
        restoreFormData();
    }
}

// Setup date selectors
function setupDateSelectors() {
    const birthYearSelect = document.getElementById('birthYear');
    const birthMonthSelect = document.getElementById('birthMonth');
    const birthDaySelect = document.getElementById('birthDay');

    if (!birthYearSelect) return;

    // 년도 옵션 생성 (2016 ~ 1970)
    for (let year = 2016; year >= 1970; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year + '년';
        birthYearSelect.appendChild(option);
    }

    // 월 옵션 생성
    for (let month = 1; month <= 12; month++) {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month + '월';
        birthMonthSelect.appendChild(option);
    }

    // 초기 일자 옵션 생성 (1~31일)
    for (let day = 1; day <= 31; day++) {
        const option = document.createElement('option');
        option.value = day;
        option.textContent = day + '일';
        birthDaySelect.appendChild(option);
    }

    // 일 옵션 동적 업데이트 (월/년 선택시)
    function updateDays() {
        const year = parseInt(birthYearSelect.value);
        const month = parseInt(birthMonthSelect.value);
        
        // 년도와 월이 모두 선택된 경우 해당 월의 정확한 일수로 업데이트
        if (year && month) {
            const daysInMonth = new Date(year, month, 0).getDate();
            const currentSelectedDay = birthDaySelect.value;
            
            birthDaySelect.innerHTML = '<option value="">일</option>';

            for (let day = 1; day <= daysInMonth; day++) {
                const option = document.createElement('option');
                option.value = day;
                option.textContent = day + '일';
                birthDaySelect.appendChild(option);
            }
            
            // 이전에 선택된 일자가 있고 해당 월에 존재하는 일자라면 다시 선택
            if (currentSelectedDay && parseInt(currentSelectedDay) <= daysInMonth) {
                birthDaySelect.value = currentSelectedDay;
            }
        }
    }

    birthYearSelect.addEventListener('change', updateDays);
    birthMonthSelect.addEventListener('change', updateDays);
}

// Setup form submission
function setupFormSubmission() {
    console.log('=== 폼 제출 설정 시작 ===');
    
    const form = document.getElementById('sajuForm');
    if (!form) {
        console.error('❌ sajuForm을 찾을 수 없음');
        return;
    }
    
    console.log('✅ sajuForm 찾음');
    
    // 기존 이벤트 리스너 제거 (중복 방지)
    const existingSubmitEvents = form.cloneNode(true);
    form.parentNode.replaceChild(existingSubmitEvents, form);
    const cleanForm = document.getElementById('sajuForm');
    
    console.log('🧹 기존 이벤트 리스너 정리 완료');

    cleanForm.addEventListener('submit', async function(e) {
        console.log('=== 🚀 SCRIPT.JS 폼 제출 이벤트 발생 ===');
        console.log('⏰ 제출 시간:', new Date().toISOString());
        e.preventDefault();
        
        const formData = new FormData(cleanForm);
        const userData = {
            name: formData.get('name'),
            birthYear: formData.get('birthYear'),
            birthMonth: formData.get('birthMonth'),
            birthDay: formData.get('birthDay'),
            birthTime: formData.get('birthTime'),
            gender: formData.get('gender')
        };

        console.log('📝 폼에서 수집된 사용자 데이터:', userData);

        // 폼 검증
        console.log('🔍 폼 검증 시작');
        if (!validateForm(userData)) {
            console.log('❌ 폼 검증 실패 - 제출 중단');
            return;
        }
        console.log('✅ 폼 검증 통과');

        // 폼 검증 통과 후 바로 API 호출 진행
        console.log('✅ 폼 검증 완료 - API 호출 시작');

        // 사용자 데이터 저장
        currentUserData = userData;
        localStorage.setItem('sajuUserData', JSON.stringify(userData));
        console.log('💾 사용자 데이터 localStorage에 저장 완료');

        // 로딩 화면 표시
        console.log('⏳ 로딩 화면 표시');
        showLoadingScreen();

        try {
            console.log('🤖 🌟 실제 AI 분석 시작 - Google Gemini API 호출 🌟');
            // AI 분석 수행
            const analysisResult = await performSajuAnalysis(userData);
            
            console.log('📊 AI 분석 결과 받음:', analysisResult);
            
            // 결과 저장
            localStorage.setItem('sajuAnalysisResult', JSON.stringify(analysisResult));
            console.log('💾 분석 결과 localStorage에 저장 완료');
            
            // 결과 페이지로 이동 (강화된 방식)
            console.log('🔄 2초 후 결과 페이지로 이동 시작');
            setTimeout(() => {
                console.log('🚀 결과 페이지로 강제 리다이렉션 실행');
                forceRedirectToResult();
            }, 2000);
            
        } catch (error) {
            console.error(`❌ 네트워크 에러: ${error.message}`);
            console.error(`❌ 에러 스택: ${error.stack}`);
            console.log('API 호출 중 오류가 발생하여 데모 데이터로 테스트합니다.');
            console.log(`오류: ${error.message}`);
            return generateDemoAnalysis(userData);
        }
    });
    
    console.log('✅ 폼 제출 이벤트 리스너 등록 완료');
}

// Form validation
function validateForm(userData) {
    console.log('=== 폼 검증 시작 ===');
    console.log('검증할 데이터:', userData);
    
    if (!userData.name || userData.name.trim() === '') {
        console.log('❌ 이름 검증 실패');
        showValidationError('이름을 입력해주세요.');
        return false;
    }
    console.log('✅ 이름 검증 통과:', userData.name);
    
    if (!userData.birthYear || !userData.birthMonth || !userData.birthDay) {
        console.log('❌ 생년월일 검증 실패');
        console.log('birthYear:', userData.birthYear);
        console.log('birthMonth:', userData.birthMonth);
        console.log('birthDay:', userData.birthDay);
        showValidationError('생년월일을 모두 선택해주세요.');
        return false;
    }
    console.log('✅ 생년월일 검증 통과:', `${userData.birthYear}년 ${userData.birthMonth}월 ${userData.birthDay}일`);
    
    if (!userData.birthTime) {
        console.log('❌ 출생시 검증 실패:', userData.birthTime);
        showValidationError('출생시를 선택해주세요.');
        return false;
    }
    console.log('✅ 출생시 검증 통과:', userData.birthTime);
    
    if (!userData.gender) {
        console.log('❌ 성별 검증 실패:', userData.gender);
        showValidationError('성별을 선택해주세요.');
        return false;
    }
    console.log('✅ 성별 검증 통과:', userData.gender);
    
    console.log('✅ 모든 폼 검증 통과');
    return true;
}

// 검증 오류 표시 함수 (alert 대신 사용)
function showValidationError(message) {
    console.log('⚠️ 검증 오류:', message);
    // 간단한 시각적 피드백만 제공
    const form = document.getElementById('sajuForm');
    if (form) {
        form.style.borderColor = '#ef4444';
        setTimeout(() => {
            form.style.borderColor = '';
        }, 2000);
    }
}

// Show/hide loading screen
function showLoadingScreen() {
    console.log('⏳ 로딩 화면 표시 시도');
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
        console.log('✅ 로딩 화면 표시됨');
    } else {
        console.error('❌ loadingScreen 엘리먼트를 찾을 수 없음');
    }
}

function hideLoadingScreen() {
    console.log('⏹️ 로딩 화면 숨김 시도');
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
        console.log('✅ 로딩 화면 숨김됨');
    } else {
        console.error('❌ loadingScreen 엘리먼트를 찾을 수 없음');
    }
}

// Perform Saju Analysis using Gemini API
async function performSajuAnalysis(userData) {
    console.log('🔮 사주 분석 시작');
    console.log('입력 데이터:', userData);
    
    // API 키 검증
    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
        console.error('❌ API 키가 설정되지 않았습니다');
        console.log('🎭 API 키 미설정으로 데모 데이터 사용');
        return generateDemoAnalysis(userData);
    }
    
    console.log('✅ API 키 확인됨, Gemini API 호출 시작');
    console.log('🔑 API 키 마지막 4자리:', GEMINI_API_KEY.slice(-4));
    
    // 기본 요청 ID 생성
    const requestId = Math.random().toString(36).substr(2, 16);
    const selectedPrompt = 'detailed';
    
    console.log('📧 요청 메타데이터:');
    console.log('- 요청 ID:', requestId);
    console.log('- 프롬프트 변형:', selectedPrompt);
    
    const basePrompt = `사주팔자 분석 전문가로서 다음 정보를 바탕으로 고등학교 추천 분석을 수행해주세요.

**분석 대상 정보:**
- 이름: ${userData.name}
- 생년월일: ${userData.birthYear}년 ${userData.birthMonth}월 ${userData.birthDay}일
- 출생시간: ${userData.birthTime}
- 성별: ${userData.gender}
- 요청 ID: ${requestId}

**분석 요구사항:**
1. 사주오행 분석을 통한 성격 및 재능 파악
2. 고등학교 3년간의 운세 흐름 예측 (학업운, 대인관계운, 이성운)
3. 최적의 고등학교 유형 3개 추천 (구체적인 이유 포함)
4. 피해야 할 고등학교 유형 2개 (이유 포함)
5. 문과 vs 이과 적합도 분석 (각각 점수화 및 추천 이유)
6. 학습 방향 및 진로 조언

**⚠️ 현실적인 추천 가이드라인 (반드시 준수):**
- 일반고(남녀공학/남고/여고): 80-85% 학생이 진학하는 주류 선택지
- 자율형사립고: 8-10% 학생이 진학, 경제적 여건 고려 필요
- 특목고(외고/국제고): 3-5% 학생만 진학 가능한 높은 경쟁률
- 특성화고: 2-4% 학생이 진학하는 전문 교육 과정
- 과학영재학교: 1% 미만의 최상위 학생만 진학 가능

**추천 우선순위:**
1순위는 반드시 일반고 계열 중에서 선택 (남녀공학, 남고, 여고)
2-3순위에서 특성에 맞는 다른 유형 고려 가능
단, 과학영재학교나 특목고는 정말 특출난 재능이 확인될 때만 추천

**문과/이과 적합도 분석 가이드라인:**
- 오행 중 목(木), 화(火)가 강하면 문과 성향 (언어, 예술, 사회과학)
- 오행 중 금(金), 수(水)가 강하면 이과 성향 (수학, 과학, 공학)
- 토(土)가 강하면 균형잡힌 성향
- 출생월에 따른 계절 특성 반영 (봄-목, 여름-화, 가을-금, 겨울-수)
- 출생시간에 따른 성격 특성 반영
- 점수는 30-95% 범위에서 개인별 맞춤 설정
- 두 영역 차이는 최소 5점 이상 두어 명확한 구분 제공

**중요 참고사항:**
- 이성운: 고등학교 시기 연애에 대한 관심도를 나타냄 (점수가 높을수록 연애에 관심이 많아 공부 집중도가 떨어질 수 있음)
- 문과/이과: 사주 오행 분석을 바탕으로 한 학문적 성향 판단
- 현실성: 대부분 학생은 일반고에 진학하므로 일반고 내에서의 최적 선택을 우선 고려

**응답 형식 (반드시 JSON으로만 응답):**
{
  "requestId": "${requestId}",
  "promptVariation": "${selectedPrompt}",
  "sajuElements": "오행 분석 내용",
  "personality": "성격 분석",
  "learningStyle": "학습 스타일",
  "socialTendency": "사회적 성향",
  "recommendedSchools": [
    {"rank": 1, "type": "학교유형1", "reason": "추천 이유"},
    {"rank": 2, "type": "학교유형2", "reason": "추천 이유"},
    {"rank": 3, "type": "학교유형3", "reason": "추천 이유"}
  ],
  "notRecommendedSchools": [
    {"rank": 1, "type": "학교유형1", "reason": "비추천 이유"},
    {"rank": 2, "type": "학교유형2", "reason": "비추천 이유"}
  ],
  "summary": "종합적인 분석 요약",
  "direction": {
    "bestDirection": "방향",
    "title": "방향 제목",
    "explanation": "방향 설명"
  },
  "fortuneFlow": {
    "grade1": {"academic": 85, "social": 78, "romance": 72},
    "grade2": {"academic": 88, "social": 82, "romance": 75},
    "grade3": {"academic": 90, "social": 85, "romance": 78}
  },
  "personalTraits": {
    "learningStyle": "학습 스타일 상세",
    "socialTendency": "사회적 성향 상세",
    "specialTalent": "특별한 재능",
    "cautions": "주의사항"
  },
  "academicTrack": {
    "liberalArts": 75,
    "science": 85,
    "recommendation": "이과",
    "reasoning": "문과/이과 추천 이유 (오행 분석 근거 포함)",
    "liberalStrengths": ["구체적 문과 강점영역1", "구체적 문과 강점영역2", "구체적 문과 강점영역3"],
    "scienceStrengths": ["구체적 이과 강점영역1", "구체적 이과 강점영역2", "구체적 이과 강점영역3"],
    "liberalSubjects": ["추천 문과 과목1", "추천 문과 과목2", "추천 문과 과목3"],
    "scienceSubjects": ["추천 이과 과목1", "추천 이과 과목2", "추천 이과 과목3"]
  },
  "studyTips": "구체적인 공부 방법 조언",
  "careerDirection": "진로 방향 조언"}`;

    // 실제 API 호출 시작 로그
    console.log(`🤖 실제 Gemini API 호출을 시작합니다!`);
    console.log(`사용자: ${userData.name}`);
    console.log(`API 키 끝자리: ${GEMINI_API_KEY.slice(-4)}`);
    console.log(`요청 ID: ${requestId.substr(0, 8)}...`);

    // debug-api.html과 동일한 요청 구성
    const requestBody = {
        contents: [{
            parts: [{
                text: basePrompt
            }]
        }],
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
            stopSequences: [],
            candidateCount: 1
        },
        safetySettings: [
            {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_HATE_SPEECH", 
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
        ]
    };

    try {
        console.log('📤 사주 분석 요청 준비...');
        console.log(`프롬프트 길이: ${basePrompt.length} 문자`);
        console.log(`요청 본문 크기: ${JSON.stringify(requestBody).length} bytes`);
        
        const startTime = Date.now();
        console.log('🌐 Fetch 요청 시작...');
        
        // debug-api.html과 동일한 fetch 호출
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'HighSchool-Recommender/1.0'
            },
            body: JSON.stringify(requestBody)
        });
        
        const endTime = Date.now();
        console.log(`📥 응답 받음 - 상태: ${response.status}, 시간: ${endTime - startTime}ms`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API 호출 성공!');
            console.log(`📊 전체 응답: ${JSON.stringify(data, null, 2)}`);
            
            if (data.candidates && data.candidates.length > 0) {
                const generatedText = data.candidates[0].content.parts[0].text;
                console.log(`📝 생성된 텍스트: ${generatedText}`);
                
                // JSON 파싱 시도 (debug-api.html과 동일)
                try {
                    let cleanedText = generatedText
                        .replace(/```json\s*/g, '')
                        .replace(/```\s*/g, '')
                        .replace(/^\s*[\`\'\"]*/g, '')
                        .replace(/[\`\'\\"]*\s*$/g, '')
                        .trim();
                    
                    const analysisResult = JSON.parse(cleanedText);
                    console.log('✅ JSON 파싱 성공!');
                    console.log(`📊 파싱된 결과: ${JSON.stringify(analysisResult, null, 2)}`);
                    
                    return analysisResult;
                } catch (parseError) {
                    console.error(`❌ JSON 파싱 실패: ${parseError.message}`);
                    console.log('🎭 JSON 파싱 실패로 데모 데이터 사용');
                    return generateDemoAnalysis(userData);
                }
            } else {
                console.error('❌ candidates 배열이 비어있음');
                console.log('🎭 candidates 없음으로 데모 데이터 사용');
                return generateDemoAnalysis(userData);
            }
        } else {
            const errorText = await response.text();
            console.error(`❌ API 호출 실패 - 상태: ${response.status}`);
            console.error(`❌ 에러 응답: ${errorText}`);
            
            // 에러 데이터 파싱 시도 (debug-api.html과 동일)
            try {
                const errorData = JSON.parse(errorText);
                console.log(`📋 파싱된 에러 데이터: ${JSON.stringify(errorData, null, 2)}`);
                
                // 할당량 초과 확인
                if ((response.status === 429 || response.status === 403) && 
                    errorData.error && (
                        errorData.error.message.includes('quota') || 
                        errorData.error.message.includes('Quota') ||
                        errorData.error.message.includes('limit') ||
                        errorData.error.status === 'RESOURCE_EXHAUSTED' ||
                        errorData.error.status === 'QUOTA_EXCEEDED'
                    )) {
                    console.log('🚨 할당량 초과 에러 감지!');
                    console.log(`상태 코드: ${response.status}`);
                    console.log(`에러 타입: ${errorData.error.status}`);
                    console.log(`메시지: ${errorData.error.message}`);
                    console.log('지금은 데모 데이터로 테스트합니다.');
                    return generateDemoAnalysis(userData);
                } else {
                    console.log(`🚨 API 에러 - ${response.status}`);
                    console.log(`에러 메시지: ${errorData.error ? errorData.error.message : errorText}`);
                    console.log('데모 데이터로 테스트합니다.');
                    return generateDemoAnalysis(userData);
                }
            } catch (parseError) {
                console.log(`⚠️ 에러 응답 파싱 실패: ${parseError.message}`);
                console.log(`🚨 API 호출 실패! 상태 코드: ${response.status}`);
                console.log('데모 데이터로 테스트합니다.');
                return generateDemoAnalysis(userData);
            }
        }
        
    } catch (error) {
        console.error(`❌ 네트워크 에러: ${error.message}`);
        console.error(`❌ 에러 스택: ${error.stack}`);
        console.log('API 호출 중 오류가 발생하여 데모 데이터로 테스트합니다.');
        console.log(`오류: ${error.message}`);
        return generateDemoAnalysis(userData);
    }
}

// Generate demo analysis for testing
function generateDemoAnalysis(userData) {
    console.log('🎭 데모 분석 데이터 생성 시작');
    console.log('입력 사용자 데이터:', userData);
    console.log('⚠️ 이것은 데모 데이터입니다! API 호출이 실패했습니다! 🚨');
    
    // 매번 완전히 다른 랜덤 결과 생성
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    
    console.log('🎲 랜덤 ID:', randomId);
    console.log('⏰ 타임스탬프:', timestamp);
    
    // 현실적인 학교 유형들 (비율 반영)
    const realSchoolTypes = {
        // 일반고 (80-85% 비중)
        regular: [
            '일반고(남녀공학)', '일반고(남고)', '일반고(여고)', 
            '인문계 일반고', '종합고등학교'
        ],
        // 자율형사립고 (8-10% 비중)
        autonomous: [
            '자율형사립고', '자율형공립고'
        ],
        // 특목고 (3-5% 비중)
        special: [
            '외국어고', '국제고', '과학고'
        ],
        // 특성화고 (2-4% 비중)
        vocational: [
            '상업정보고', '공업고', '농생명산업고', '예술고', '체육고'
        ],
        // 영재학교 (1% 미만)
        gifted: [
            '과학영재학교', '영재학교'
        ]
    };
    
    const reasons = [
        '사주에서 수(水)의 기운이 강해 창의적이고 유연한 사고를 가지고 있습니다.',
        '목(木)의 기운이 왕성하여 성장 지향적이고 도전적인 성격입니다.',
        '화(火)의 에너지가 넘쳐 열정적이고 활동적인 특성을 보입니다.',
        '토(土)의 안정성이 강해 차분하고 신중한 판단력을 가지고 있습니다.',
        '금(金)의 날카로움으로 분석적이고 정확한 사고를 선호합니다.',
        '음양의 조화가 뛰어나 균형 잡힌 사고와 행동을 보입니다.',
        '천간과 지지의 배치가 특별하여 독특한 재능을 가지고 있습니다.'
    ];
    
    // 현실적인 추천 (1순위는 반드시 일반고)
    const recommendedSchools = [
        {
            rank: 1,
            type: realSchoolTypes.regular[Math.floor(Math.random() * realSchoolTypes.regular.length)],
            reason: `${reasons[0]} 일반고에서 다양한 친구들과 함께 성장하며 균형 잡힌 교육을 받을 수 있어 가장 적합합니다.`
        },
        {
            rank: 2,
            type: Math.random() < 0.7 ? 
                realSchoolTypes.regular[Math.floor(Math.random() * realSchoolTypes.regular.length)] :
                realSchoolTypes.autonomous[Math.floor(Math.random() * realSchoolTypes.autonomous.length)],
            reason: `${reasons[1]} 안정적인 교육 환경에서 개인의 특성을 살려 성장할 수 있을 것입니다.`
        },
        {
            rank: 3,
            type: Math.random() < 0.5 ? 
                realSchoolTypes.regular[Math.floor(Math.random() * realSchoolTypes.regular.length)] :
                (Math.random() < 0.8 ? 
                    realSchoolTypes.autonomous[Math.floor(Math.random() * realSchoolTypes.autonomous.length)] :
                    realSchoolTypes.special[Math.floor(Math.random() * realSchoolTypes.special.length)]
                ),
            reason: `${reasons[2]} 이 교육 환경이 당신의 잠재력을 발현하는 데 도움이 될 것입니다.`
        }
    ];
    
    // 비추천 학교 (현실적으로 맞지 않는 유형)
    const notRecommendedSchools = [
        {
            rank: 1,
            type: realSchoolTypes.gifted[Math.floor(Math.random() * realSchoolTypes.gifted.length)],
            reason: '매우 특출한 과학적 재능이 필요하며, 극도로 높은 경쟁률로 인해 현실적으로 진학이 어려울 수 있습니다.'
        },
        {
            rank: 2,
            type: realSchoolTypes.vocational[Math.floor(Math.random() * realSchoolTypes.vocational.length)],
            reason: '현재 사주 특성상 일반적인 학문 과정이 더 적합하며, 전문 기술 교육보다는 종합적 교육이 유리합니다.'
        }
    ];
    
    const directions = ['북쪽', '남쪽', '동쪽', '서쪽', '북동쪽', '남동쪽', '북서쪽', '남서쪽'];
    const randomDirection = directions[Math.floor(Math.random() * directions.length)];
    
    // 랜덤한 운세 수치
    const generateRandomStats = () => ({
        academic: Math.floor(Math.random() * 40) + 60, // 60-100
        social: Math.floor(Math.random() * 40) + 60,   // 60-100
        romance: Math.floor(Math.random() * 40) + 60    // 60-100
    });
    
    // 개인화된 문과/이과 적합도 생성 (생년월일 기반)
    const generatePersonalizedAcademicTrack = () => {
        const birthMonth = parseInt(userData.birthMonth);
        const birthDay = parseInt(userData.birthDay);
        const birthYear = parseInt(userData.birthYear);
        const gender = userData.gender;
        
        // 출생월에 따른 계절별 기본 성향
        let baseLiberal = 50;
        let baseScience = 50;
        
        // 봄(3-5월): 목의 기운 - 문과 성향
        if (birthMonth >= 3 && birthMonth <= 5) {
            baseLiberal += 15;
            baseScience -= 5;
        }
        // 여름(6-8월): 화의 기운 - 문과 성향 
        else if (birthMonth >= 6 && birthMonth <= 8) {
            baseLiberal += 10;
            baseScience -= 3;
        }
        // 가을(9-11월): 금의 기운 - 이과 성향
        else if (birthMonth >= 9 && birthMonth <= 11) {
            baseScience += 15;
            baseLiberal -= 5;
        }
        // 겨울(12-2월): 수의 기운 - 이과 성향
        else {
            baseScience += 12;
            baseLiberal -= 3;
        }
        
        // 출생일에 따른 추가 조정
        const dayMod = (birthDay % 10);
        if (dayMod <= 3) {
            baseLiberal += Math.floor(Math.random() * 10) + 5;
        } else if (dayMod >= 7) {
            baseScience += Math.floor(Math.random() * 10) + 5;
        }
        
        // 출생년에 따른 미세 조정
        const yearMod = birthYear % 12;
        if (yearMod % 3 === 0) {
            baseLiberal += Math.floor(Math.random() * 8) + 2;
        } else if (yearMod % 3 === 1) {
            baseScience += Math.floor(Math.random() * 8) + 2;
        }
        
        // 성별에 따른 미세 조정 (통계적 경향 반영)
        if (gender === '여성') {
            baseLiberal += Math.floor(Math.random() * 6) + 2;
        } else {
            baseScience += Math.floor(Math.random() * 6) + 2;
        }
        
        // 최종 점수 계산 (30-95% 범위, 최소 5점 차이)
        let liberalScore = Math.max(30, Math.min(95, baseLiberal + Math.floor(Math.random() * 20) - 10));
        let scienceScore = Math.max(30, Math.min(95, baseScience + Math.floor(Math.random() * 20) - 10));
        
        // 최소 5점 차이 보장
        if (Math.abs(liberalScore - scienceScore) < 5) {
            if (liberalScore > scienceScore) {
                liberalScore = Math.min(95, liberalScore + 5);
                scienceScore = Math.max(30, liberalScore - 8);
            } else {
                scienceScore = Math.min(95, scienceScore + 5);
                liberalScore = Math.max(30, scienceScore - 8);
            }
        }
        
        // 강점 분야와 추천 과목 (점수에 따라 결정)
        const liberalStrengths = liberalScore > scienceScore ? 
            ["창의적 글쓰기", "언어 감각", "인문학적 사고", "소통 능력", "문화 이해력"] :
            ["기초 언어 능력", "암기 학습", "문학 감상"];
            
        const scienceStrengths = scienceScore > liberalScore ?
            ["논리적 사고", "수리 능력", "과학적 탐구", "분석 능력", "체계적 학습"] :
            ["기초 수학", "과학 실험", "컴퓨터 활용"];
            
        const liberalSubjects = liberalScore > scienceScore ?
            ["문학", "역사", "사회문화", "윤리와 사상", "제2외국어"] :
            ["국어", "사회", "도덕"];
            
        const scienceSubjects = scienceScore > liberalScore ?
            ["수학", "물리", "화학", "생명과학", "지구과학"] :
            ["수학I", "통합과학", "정보"];
        
        const recommendation = liberalScore > scienceScore ? "문과" : "이과";
        const reasoning = liberalScore > scienceScore ? 
            `출생월(${birthMonth}월)과 생년월일 분석 결과, 언어적 감수성과 인문학적 사고력이 뛰어납니다. 문과 과목에서 ${liberalScore}%의 높은 적합도를 보여 문과 진학을 추천합니다.` :
            `출생월(${birthMonth}월)과 생년월일 분석 결과, 논리적 사고력과 수리 능력이 우수합니다. 이과 과목에서 ${scienceScore}%의 높은 적합도를 보여 이과 진학을 추천합니다.`;
        
        return {
            liberalArts: liberalScore,
            science: scienceScore,
            recommendation: recommendation,
            reasoning: reasoning,
            liberalStrengths: liberalStrengths.slice(0, 3),
            scienceStrengths: scienceStrengths.slice(0, 3),
            liberalSubjects: liberalSubjects.slice(0, 3),
            scienceSubjects: scienceSubjects.slice(0, 3)
        };
    };
    
    const academicTrack = generatePersonalizedAcademicTrack();
    
    // 랜덤한 운세 수치
    const generateRandomStats = () => ({
        academic: Math.floor(Math.random() * 40) + 60, // 60-100
        social: Math.floor(Math.random() * 40) + 60,   // 60-100
        romance: Math.floor(Math.random() * 40) + 60    // 60-100
    });
    
    // 개인화된 운세 흐름 생성 (생년월일 기반)
    const generatePersonalizedFortune = () => {
        const birthMonth = parseInt(userData.birthMonth);
        const birthDay = parseInt(userData.birthDay);
        const birthYear = parseInt(userData.birthYear);
        const gender = userData.gender;
        
        // 생년월일을 시드로 사용하여 일관된 패턴 생성
        const seed = birthYear * 10000 + birthMonth * 100 + birthDay;
        
        // 간단한 시드 기반 랜덤 함수
        function seededRandom(seed, min, max) {
            const x = Math.sin(seed) * 10000;
            const random = x - Math.floor(x);
            return Math.floor(random * (max - min + 1)) + min;
        }
        
        // 각 학년별 기본 운세 계산
        const grade1 = {
            academic: seededRandom(seed + 1, 65, 95),
            social: seededRandom(seed + 2, 60, 90), 
            romance: seededRandom(seed + 3, 55, 85)
        };
        
        const grade2 = {
            academic: seededRandom(seed + 4, 70, 95),
            social: seededRandom(seed + 5, 65, 95),
            romance: seededRandom(seed + 6, 60, 90)
        };
        
        const grade3 = {
            academic: seededRandom(seed + 7, 60, 90), // 수능 스트레스로 약간 하락
            social: seededRandom(seed + 8, 70, 95),
            romance: seededRandom(seed + 9, 65, 95)
        };
        
        // 출생월에 따른 운세 패턴 조정
        if (birthMonth >= 3 && birthMonth <= 5) { // 봄
            grade1.academic += 5;
            grade2.social += 5;
            grade3.romance += 5;
        } else if (birthMonth >= 6 && birthMonth <= 8) { // 여름
            grade1.social += 5;
            grade2.romance += 5;
            grade3.academic += 5;
        } else if (birthMonth >= 9 && birthMonth <= 11) { // 가을
            grade1.romance += 5;
            grade2.academic += 5;
            grade3.social += 5;
        } else { // 겨울
            grade1.social += 3;
            grade2.academic += 3;
            grade3.romance += 3;
        }
        
        // 성별에 따른 미세 조정
        if (gender === '여성') {
            grade1.social += 2;
            grade2.romance += 3;
            grade3.academic += 2;
        } else {
            grade1.academic += 2;
            grade2.social += 2;
            grade3.romance += 3;
        }
        
        // 최대값 제한 (100 초과 방지)
        const limitMax = (value) => Math.min(100, value);
        
        return {
            grade1: {
                academic: limitMax(grade1.academic),
                social: limitMax(grade1.social),
                romance: limitMax(grade1.romance)
            },
            grade2: {
                academic: limitMax(grade2.academic),
                social: limitMax(grade2.social),
                romance: limitMax(grade2.romance)
            },
            grade3: {
                academic: limitMax(grade3.academic),
                social: limitMax(grade3.social),
                romance: limitMax(grade3.romance)
            }
        };
    };
    
    const personalizedAcademicTrack = generatePersonalizedAcademicTrack();
    const personalizedFortuneFlow = generatePersonalizedFortune();
    
    const demoResult = {
        // 데모임을 명확히 표시
        isDemoData: true,
        demoTimestamp: timestamp,
        demoRandomId: randomId,
        
        summary: `🚨 데모 데이터 🚨 ${userData.name} 님은 ${userData.birthTime}에 태어나신 ${userData.gender}으로, 이 분석은 실제 AI가 아닌 테스트용 랜덤 데이터입니다. 타임스탬프: ${new Date(timestamp).toLocaleString()}`,
        
        recommendedSchools: recommendedSchools,
        
        notRecommendedSchools: notRecommendedSchools,
        
        direction: {
            bestDirection: randomDirection,
            title: `${randomDirection}이 길한 방향 (데모)`,
            explanation: `${randomDirection} 방향은 현재 시점 ${new Date().toLocaleString()}에 생성된 랜덤 데이터입니다. 실제 사주 분석이 아닙니다.`
        },
        
        fortuneFlow: personalizedFortuneFlow,
        
        personalTraits: {
            learningStyle: '체계적이고 논리적인 학습을 선호하며, 단계별 접근을 통해 깊이 있는 이해를 추구합니다.',
            socialTendency: '신중하면서도 따뜻한 성격으로 진실한 우정을 중시하며, 필요시 리더십을 발휘할 수 있습니다.',
            specialTalent: '분석적 사고와 창의적 문제해결 능력이 뛰어나며, 특히 과학과 수학 분야에서 재능이 돋보입니다.',
            cautions: '완벽주의 성향이 강해 스트레스를 받을 수 있으니, 적절한 휴식과 취미 활동을 통해 균형을 유지하는 것이 중요합니다.'
        },
        
        academicTrack: personalizedAcademicTrack,
        
        sajuElements: `데모 데이터: 오행 분석이 실행되지 않았습니다. 랜덤ID: ${randomId}`,
        studyTips: `데모 데이터: 실제 학습법 분석이 아닙니다. 타임스탬프: ${timestamp}`,
        careerDirection: `데모 데이터: 실제 진로 분석이 아닙니다. API 호출이 실패했음을 의미합니다.`
    };
    
    console.log('🚨 [경고] 데모 분석 데이터 생성 완료 - 이것은 실제 AI 분석이 아닙니다!');
    console.log('📊 생성된 데모 결과:', JSON.stringify(demoResult, null, 2));
    
    // 데모 데이터임을 콘솔에 표시
    console.log(`🚨 경고: 실제 AI API 호출이 실패했습니다!`);
    console.log(`이것은 테스트용 데모 데이터입니다.`);
    console.log(`생성 시간: ${new Date().toLocaleString()}`);
    console.log(`랜덤 ID: ${randomId}`);
    
    return demoResult;
}

// Result page initialization
function initializeResultPage() {
    console.log('=== 결과 페이지 초기화 시작 ===');
    
    let userData = localStorage.getItem('sajuUserData');
    let analysisResult = localStorage.getItem('sajuAnalysisResult');
    
    console.log('📦 localStorage에서 가져온 원본 데이터:');
    console.log('userData (raw):', userData);
    console.log('analysisResult (raw):', analysisResult);
    
    // 데이터 파싱
    try {
        userData = userData ? JSON.parse(userData) : null;
        analysisResult = analysisResult ? JSON.parse(analysisResult) : null;
        
        console.log('✅ 데이터 파싱 성공');
        console.log('userData (parsed):', userData);
        console.log('analysisResult (parsed):', analysisResult);
        
    } catch (e) {
        console.error('❌ 데이터 파싱 실패:', e);
        userData = null;
        analysisResult = null;
    }
    
    // 데이터가 없거나 문제가 있으면 강제로 데모 데이터 생성
    if (!userData || !analysisResult) {
        console.log('⚠️ 데이터가 없거나 문제 발생 - 강제 데모 데이터 생성');
        
        userData = {
            name: '홍길동',
            birthYear: '2008',
            birthMonth: '3',
            birthDay: '15',
            birthTime: '오시',
            gender: '남성'
        };
        
        analysisResult = {
            summary: `${userData.name} 님은 ${userData.birthTime}에 태어나신 ${userData.gender}으로, 강한 학습 의지와 창의적 사고력을 가지고 계십니다. 특히 체계적인 학습 환경에서 뛰어난 성과를 보일 것으로 예상되어 영재고나 자율형사립고가 가장 적합합니다.`,
            recommendedSchools: [
                {
                    rank: 1,
                    type: '과학영재학교',
                    reason: '사주에서 금(金)의 기운이 강하여 정밀하고 체계적인 사고를 선호하며, 과학과 수학 분야에서 뛰어난 재능을 발휘할 수 있습니다. 영재고의 심화 교육과정이 잠재력을 최대한 발현시킬 것입니다.'
                },
                {
                    rank: 2,
                    type: '자율형사립고',
                    reason: '화(火)의 기운이 적절히 조화되어 있어 활발한 대인관계와 리더십을 발휘할 수 있으며, 자율형사립고의 다양한 프로그램을 통해 전인적 성장이 가능합니다. 3학년에 대인관계운이 상승하여 진로 설계와 대학 진학에 도움이 될 것입니다.'
                },
                {
                    rank: 3,
                    type: '일반고(남녀공학)',
                    reason: '균형 잡힌 성격으로 다양한 환경에 잘 적응하며, 일반고에서도 충분히 좋은 성과를 거둘 수 있습니다. 특히 다양한 배경의 친구들과 어울리며 사회성을 기를 수 있어 향후 대학 생활과 사회 진출에 도움이 될 것입니다.'
                }
            ],
            notRecommendedSchools: [
                {
                    rank: 1,
                    type: '외국어고',
                    reason: '현재 사주 구조상 언어 습득보다는 논리적 사고가 더 강한 편이며, 외국어고의 암기 위주 학습법이 본래 성향과 맞지 않을 수 있습니다.'
                },
                {
                    rank: 2,
                    type: '예술고',
                    reason: '예술적 감각보다는 체계적이고 논리적인 사고가 강한 편이므로 예술고보다는 일반적인 학문 분야가 더 적합합니다.'
                }
            ],
            direction: {
                bestDirection: '북쪽',
                explanation: '북쪽 방향은 오행에서 학업운과 대인관계운을 상승시키는 길한 방위입니다. 이 방향에 위치한 학교에서 더욱 안정적이고 발전적인 학교생활을 할 수 있을 것입니다.'
            },
            fortuneFlow: {
                grade1: {academic: 85, social: 70, romance: 80},
                grade2: {academic: 90, social: 75, romance: 85},
                grade3: {academic: 80, social: 85, romance: 90}
            },
            personalTraits: {
                learningStyle: '체계적이고 논리적인 학습을 선호하며, 단계별 접근을 통해 깊이 있는 이해를 추구합니다.',
                socialTendency: '신중하면서도 따뜻한 성격으로 진실한 우정을 중시하며, 필요시 리더십을 발휘할 수 있습니다.',
                specialTalent: '분석적 사고와 창의적 문제해결 능력이 뛰어나며, 특히 과학과 수학 분야에서 재능이 돋보입니다.',
                cautions: '완벽주의 성향이 강해 스트레스를 받을 수 있으니, 적절한 휴식과 취미 활동을 통해 균형을 유지하는 것이 중요합니다.'
            },
            academicTrack: {
                liberalArts: 75,
                science: 85,
                recommendation: '이과',
                reasoning: '문과/이과 추천 이유'
            }
        };
        
        // localStorage에 저장
        localStorage.setItem('sajuUserData', JSON.stringify(userData));
        localStorage.setItem('sajuAnalysisResult', JSON.stringify(analysisResult));
        
        console.log('💾 강제 생성된 데이터를 localStorage에 저장 완료');
    }
    
    console.log('📊 최종 사용할 데이터:');
    console.log('userData:', userData);
    console.log('analysisResult:', analysisResult);
    
    console.log('🎨 결과 표시 시작');
    displayAnalysisResult(userData, analysisResult);
    console.log('✅ 결과 페이지 초기화 완료');
}

// Display analysis result
function displayAnalysisResult(userData, result) {
    console.log('=== 분석 결과 표시 시작 ===');
    console.log('받은 사용자 데이터:', userData);
    console.log('받은 분석 결과:', result);
    
    // 사용자 이름 표시
    console.log('👤 사용자 이름 표시 시작');
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = userData.name;
        console.log('✅ 사용자 이름 설정:', userData.name);
    } else {
        console.error('❌ userName 엘리먼트를 찾을 수 없음');
    }
    
    // 분석 요약 표시
    console.log('📝 분석 요약 표시 시작');
    const analysisDescElement = document.getElementById('analysisDescription');
    if (analysisDescElement) {
        analysisDescElement.textContent = result.summary;
        console.log('✅ 분석 요약 설정:', result.summary);
    } else {
        console.error('❌ analysisDescription 엘리먼트를 찾을 수 없음');
    }
    
    // 학교 추천 순위 표시
    console.log('🏫 학교 추천 순위 표시 시작');
    displaySchoolRecommendations(result.recommendedSchools, result.notRecommendedSchools);
    
    // 방향 분석 표시 (API와 데모 형식 통일 처리)
    console.log('🧭 방향 분석 표시 시작');
    const directionData = result.direction || result.favorableDirection;
    if (directionData) {
        console.log('방향 데이터:', directionData);
        displayDirectionAnalysis(directionData);
    } else {
        console.error('❌ 방향 데이터가 없음');
    }
    
    // 운세 차트 표시 (API와 데모 형식 통일 처리)
    console.log('📈 운세 차트 표시 시작');
    const fortuneData = result.fortuneFlow || result.fortuneTimeline;
    if (fortuneData) {
        console.log('운세 데이터:', fortuneData);
        displayFortuneChart(fortuneData);
    } else {
        console.error('❌ 운세 데이터가 없음');
    }
    
    // 개인 특성 표시
    console.log('👥 개인 특성 표시 시작');
    if (result.personalTraits) {
        console.log('개인 특성 데이터:', result.personalTraits);
        displayPersonalTraits(result.personalTraits);
    } else {
        console.error('❌ 개인 특성 데이터가 없음');
    }
    
    // 문과/이과 적합도 표시
    console.log('📚 문과/이과 적합도 표시 시작');
    if (result.academicTrack) {
        console.log('문과/이과 데이터:', result.academicTrack);
        displayAcademicTrack(result.academicTrack);
    } else {
        console.log('⚠️ 문과/이과 데이터가 없음 - 기본값 사용');
        // 기본값 설정
        const defaultTrack = {
            liberalArts: 75,
            science: 85,
            recommendation: '이과',
            reasoning: '사주 분석 결과, 이과 계열이 더 적합합니다. 특히 금(金)의 기운이 강해 정밀하고 체계적인 사고를 선호하며, 수학과 과학 분야에서 뛰어난 성과를 보일 것으로 예상됩니다.'
        };
        displayAcademicTrack(defaultTrack);
    }
    
    // 추가 정보 표시 (새로운 필드들)
    console.log('📚 추가 분석 정보 표시 시작');
    if (result.sajuElements) {
        console.log('🔮 사주 오행 정보:', result.sajuElements);
        displayAdditionalInfo('사주 오행 분석', result.sajuElements);
    }
    
    if (result.studyTips) {
        console.log('📖 학습법 조언:', result.studyTips);
        displayAdditionalInfo('맞춤 학습법', result.studyTips);
    }
    
    if (result.careerDirection) {
        console.log('🎯 진로 방향:', result.careerDirection);
        displayAdditionalInfo('장기 진로 방향', result.careerDirection);
    }
    
    console.log('✅ 분석 결과 표시 완료');
}

// Display school recommendations
function displaySchoolRecommendations(recommendedSchools, notRecommendedSchools) {
    console.log('=== 학교 추천 표시 시작 ===');
    console.log('추천 학교:', recommendedSchools);
    console.log('비추천 학교:', notRecommendedSchools);
    
    const container = document.getElementById('schoolRecommendations');
    if (!container) {
        console.error('❌ schoolRecommendations 컨테이너를 찾을 수 없음');
        return;
    }
    
    console.log('✅ schoolRecommendations 컨테이너 찾음');
    container.innerHTML = '';
    
    // 추천 학교 섹션
    console.log('📈 추천 학교 섹션 생성 시작');
    const recommendedSection = document.createElement('div');
    recommendedSection.className = 'recommendation-section';
    recommendedSection.innerHTML = `
        <h4 class="recommendation-subtitle">✅ 강력 추천하는 학교 (적합도 순)</h4>
    `;
    
    if (recommendedSchools && recommendedSchools.length > 0) {
        console.log(`추천 학교 ${recommendedSchools.length}개 처리 시작`);
        recommendedSchools.forEach((school, index) => {
            const rank = school.rank || (index + 1);
            const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}위`;
            
            console.log(`추천 학교 ${index + 1}: ${school.type} (순위: ${rank})`);
            
            const schoolCard = document.createElement('div');
            schoolCard.className = `school-card recommended-card rank-${rank}`;
            schoolCard.innerHTML = `
                <div class="school-ranking">${rankIcon}</div>
                <div class="school-badge recommended-badge">${rank}순위 추천</div>
                <h5 class="school-name">${school.type}</h5>
                <p class="school-reason">${school.reason}</p>
            `;
            recommendedSection.appendChild(schoolCard);
        });
        console.log('✅ 추천 학교 카드 생성 완료');
    } else {
        console.error('❌ 추천 학교 데이터가 없거나 비어있음');
    }
    
    // 비추천 학교 섹션
    console.log('📉 비추천 학교 섹션 생성 시작');
    const notRecommendedSection = document.createElement('div');
    notRecommendedSection.className = 'recommendation-section';
    notRecommendedSection.innerHTML = `
        <h4 class="recommendation-subtitle">❌ 권하지 않는 학교 (부적합도 순)</h4>
    `;
    
    if (notRecommendedSchools && notRecommendedSchools.length > 0) {
        console.log(`비추천 학교 ${notRecommendedSchools.length}개 처리 시작`);
        notRecommendedSchools.forEach((school, index) => {
            const rank = school.rank || (index + 1);
            
            console.log(`비추천 학교 ${index + 1}: ${school.type} (순위: ${rank})`);
            
            const schoolCard = document.createElement('div');
            schoolCard.className = `school-card not-recommended-card rank-${rank}`;
            schoolCard.innerHTML = `
                <div class="school-ranking">❌ ${rank}위</div>
                <div class="school-badge not-recommended-badge">${rank}순위 비추천</div>
                <h5 class="school-name">${school.type}</h5>
                <p class="school-reason">${school.reason}</p>
            `;
            notRecommendedSection.appendChild(schoolCard);
        });
        console.log('✅ 비추천 학교 카드 생성 완료');
    } else {
        console.error('❌ 비추천 학교 데이터가 없거나 비어있음');
    }
    
    container.appendChild(recommendedSection);
    container.appendChild(notRecommendedSection);
    
    console.log('✅ 학교 추천 표시 완료');
}

// Display direction analysis
function displayDirectionAnalysis(directionData) {
    console.log('=== 방향 분석 표시 시작 ===');
    console.log('방향 데이터:', directionData);
    
    const titleElement = document.getElementById('directionTitle');
    const explanationElement = document.getElementById('directionExplanation');
    const pointerElement = document.getElementById('compassPointer');
    
    if (titleElement) {
        const direction = directionData.bestDirection || directionData.direction;
        const titleText = `${direction}이 길한 방향입니다`;
        titleElement.textContent = titleText;
        console.log('✅ 방향 제목 설정:', titleText);
    } else {
        console.error('❌ directionTitle 엘리먼트를 찾을 수 없음');
    }
    
    if (explanationElement) {
        explanationElement.textContent = directionData.explanation;
        console.log('✅ 방향 설명 설정:', directionData.explanation);
    } else {
        console.error('❌ directionExplanation 엘리먼트를 찾을 수 없음');
    }
    
    // 나침반 포인터 회전
    if (pointerElement) {
        const directions = {
            '북쪽': 0, '북동쪽': 45, '동쪽': 90, '남동쪽': 135,
            '남쪽': 180, '남서쪽': 225, '서쪽': 270, '북서쪽': 315,
            '북': 0, '북동': 45, '동': 90, '남동': 135,
            '남': 180, '남서': 225, '서': 270, '북서': 315
        };
        const direction = directionData.bestDirection || directionData.direction;
        const angle = directions[direction] || 0;
        pointerElement.style.transform = `rotate(${angle}deg)`;
        console.log('✅ 나침반 포인터 회전 설정:', `${direction} -> ${angle}도`);
    } else {
        console.error('❌ compassPointer 엘리먼트를 찾을 수 없음');
    }
    
    console.log('✅ 방향 분석 표시 완료');
}

// Display fortune chart
function displayFortuneChart(fortuneData) {
    console.log('=== 운세 차트 표시 시작 ===');
    console.log('받은 운세 데이터:', fortuneData);
    
    // CSS 막대 차트 컨테이너 찾기
    const fortuneBars = document.querySelector('.fortune-bars');
    if (!fortuneBars) {
        console.error('❌ fortune-bars 컨테이너를 찾을 수 없음');
        return;
    }
    
    console.log('✅ fortune-bars 컨테이너 찾음');
    
    if (!fortuneData) {
        console.error('❌ fortuneData가 null 또는 undefined');
        return;
    }
    
    // 차트 데이터 준비 (API와 데모 형식 모두 지원)
    let academic, social, romance;
    
    console.log('📊 데이터 형식 확인:');
    console.log('fortuneData.grade1 존재:', !!fortuneData.grade1);
    console.log('fortuneData.year1 존재:', !!fortuneData.year1);
    
    if (fortuneData.grade1) {
        // API 응답 형식 (grade1, grade2, grade3)
        console.log('📈 API 응답 형식으로 데이터 처리');
        academic = [fortuneData.grade1.academic, fortuneData.grade2.academic, fortuneData.grade3.academic];
        social = [fortuneData.grade1.social, fortuneData.grade2.social, fortuneData.grade3.social];
        romance = [fortuneData.grade1.romance, fortuneData.grade2.romance, fortuneData.grade3.romance];
    } else if (fortuneData.year1) {
        // 데모 형식 (year1, year2, year3)
        console.log('🎭 데모 형식으로 데이터 처리');
        academic = [fortuneData.year1.academic, fortuneData.year2.academic, fortuneData.year3.academic];
        social = [fortuneData.year1.social, fortuneData.year2.social, fortuneData.year3.social];
        romance = [fortuneData.year1.romance, fortuneData.year2.romance, fortuneData.year3.romance];
    } else {
        console.error('❌ 지원되지 않는 데이터 형식');
        return;
    }
    
    console.log('📊 처리된 차트 데이터:');
    console.log('academic:', academic);
    console.log('social:', social);
    console.log('romance:', romance);
    
    // CSS 막대 차트 업데이트
    const yearGroups = fortuneBars.querySelectorAll('.year-group');
    console.log('📊 년도 그룹 개수:', yearGroups.length);
    
    yearGroups.forEach((yearGroup, yearIndex) => {
        const academicBar = yearGroup.querySelector('.academic-bar');
        const socialBar = yearGroup.querySelector('.social-bar');
        const romanceBar = yearGroup.querySelector('.romance-bar');
        
        console.log(`${yearIndex + 1}학년 막대 업데이트:`);
        
        if (academicBar) {
            const academicValue = academic[yearIndex];
            academicBar.style.width = `${academicValue}%`;
            academicBar.textContent = academicValue;
            console.log(`✅ 학업운: ${academicValue}%`);
        }
        
        if (socialBar) {
            const socialValue = social[yearIndex];
            socialBar.style.width = `${socialValue}%`;
            socialBar.textContent = socialValue;
            console.log(`✅ 대인관계운: ${socialValue}%`);
        }
        
        if (romanceBar) {
            const romanceValue = romance[yearIndex];
            romanceBar.style.width = `${romanceValue}%`;
            romanceBar.textContent = romanceValue;
            console.log(`✅ 이성운: ${romanceValue}%`);
        }
    });
    
    console.log('✅ 운세 차트 표시 완료');
}

// Display personal traits
function displayPersonalTraits(traits) {
    console.log('=== 개인 특성 표시 시작 ===');
    console.log('특성 데이터:', traits);
    
    const elements = {
        learningStyle: document.getElementById('learningStyle'),
        socialTendency: document.getElementById('socialTendency'),
        specialTalent: document.getElementById('specialTalent'),
        cautions: document.getElementById('cautions')
    };
    
    console.log('개인 특성 엘리먼트들:', {
        learningStyle: !!elements.learningStyle,
        socialTendency: !!elements.socialTendency,
        specialTalent: !!elements.specialTalent,
        cautions: !!elements.cautions
    });
    
    Object.keys(elements).forEach(key => {
        if (elements[key] && traits && traits[key]) {
            elements[key].textContent = traits[key];
            console.log(`✅ ${key} 설정:`, traits[key]);
        } else {
            if (!elements[key]) {
                console.error(`❌ ${key} 엘리먼트를 찾을 수 없음`);
            }
            if (!traits || !traits[key]) {
                console.error(`❌ ${key} 데이터가 없음`);
            }
        }
    });
    
    console.log('✅ 개인 특성 표시 완료');
}

// Display academic track recommendation
function displayAcademicTrack(trackData) {
    console.log('=== 문과/이과 적합도 표시 시작 ===');
    console.log('문과/이과 데이터:', trackData);
    
    // 문과 적합도 업데이트
    const liberalArtsScore = document.querySelector('.track-card.liberal-arts .track-score');
    if (liberalArtsScore) {
        liberalArtsScore.textContent = `${trackData.liberalArts}%`;
        console.log('✅ 문과 적합도 설정:', trackData.liberalArts);
    }
    
    // 이과 적합도 업데이트
    const scienceScore = document.querySelector('.track-card.science .track-score');
    if (scienceScore) {
        scienceScore.textContent = `${trackData.science}%`;
        console.log('✅ 이과 적합도 설정:', trackData.science);
    }
    
    // 문과 강점분야 업데이트
    if (trackData.liberalStrengths) {
        const liberalStrengthsList = document.querySelector('.track-card.liberal-arts .track-strengths ul');
        if (liberalStrengthsList) {
            liberalStrengthsList.innerHTML = '';
            trackData.liberalStrengths.forEach(strength => {
                const li = document.createElement('li');
                li.textContent = strength;
                liberalStrengthsList.appendChild(li);
            });
            console.log('✅ 문과 강점분야 설정:', trackData.liberalStrengths);
        }
    }
    
    // 이과 강점분야 업데이트
    if (trackData.scienceStrengths) {
        const scienceStrengthsList = document.querySelector('.track-card.science .track-strengths ul');
        if (scienceStrengthsList) {
            scienceStrengthsList.innerHTML = '';
            trackData.scienceStrengths.forEach(strength => {
                const li = document.createElement('li');
                li.textContent = strength;
                scienceStrengthsList.appendChild(li);
            });
            console.log('✅ 이과 강점분야 설정:', trackData.scienceStrengths);
        }
    }
    
    // 문과 추천과목 업데이트
    if (trackData.liberalSubjects) {
        const liberalSubjectsContainer = document.querySelector('.track-card.liberal-arts .subject-tags');
        if (liberalSubjectsContainer) {
            liberalSubjectsContainer.innerHTML = '';
            trackData.liberalSubjects.forEach(subject => {
                const span = document.createElement('span');
                span.className = 'subject-tag';
                span.textContent = subject;
                liberalSubjectsContainer.appendChild(span);
            });
            console.log('✅ 문과 추천과목 설정:', trackData.liberalSubjects);
        }
    }
    
    // 이과 추천과목 업데이트
    if (trackData.scienceSubjects) {
        const scienceSubjectsContainer = document.querySelector('.track-card.science .subject-tags');
        if (scienceSubjectsContainer) {
            scienceSubjectsContainer.innerHTML = '';
            trackData.scienceSubjects.forEach(subject => {
                const span = document.createElement('span');
                span.className = 'subject-tag';
                span.textContent = subject;
                scienceSubjectsContainer.appendChild(span);
            });
            console.log('✅ 이과 추천과목 설정:', trackData.scienceSubjects);
        }
    }
    
    // 최종 추천 업데이트
    const trackRecommendation = document.getElementById('trackRecommendation');
    if (trackRecommendation) {
        trackRecommendation.textContent = trackData.reasoning || '문과/이과 분석 결과를 표시합니다.';
        console.log('✅ 최종 추천 설정:', trackData.reasoning);
    }
    
    // 더 높은 점수에 따라 카드 스타일 강조
    const liberalCard = document.querySelector('.track-card.liberal-arts');
    const scienceCard = document.querySelector('.track-card.science');
    
    if (liberalCard && scienceCard) {
        if (trackData.liberalArts > trackData.science) {
            liberalCard.style.transform = 'scale(1.02)';
            liberalCard.style.boxShadow = '0 8px 32px rgba(255, 154, 158, 0.3)';
            scienceCard.style.transform = 'scale(1)';
            scienceCard.style.boxShadow = '';
            console.log('🔴 문과가 더 적합함을 시각적으로 강조');
        } else {
            scienceCard.style.transform = 'scale(1.02)';
            scienceCard.style.boxShadow = '0 8px 32px rgba(102, 126, 234, 0.3)';
            liberalCard.style.transform = 'scale(1)';
            liberalCard.style.boxShadow = '';
            console.log('🔵 이과가 더 적합함을 시각적으로 강조');
        }
    }
    
    console.log('✅ 문과/이과 적합도 표시 완료');
}

// Display additional information
function displayAdditionalInfo(title, content) {
    console.log(`=== ${title} 표시 시작 ===`);
    
    // personalTraits 섹션 찾기
    const personalTraitsSection = document.querySelector('#personalTraits .traits-grid');
    if (!personalTraitsSection) {
        console.error(`❌ personalTraits 섹션을 찾을 수 없음`);
        return;
    }
    
    // 새로운 특성 아이템 생성
    const traitItem = document.createElement('div');
    traitItem.className = 'trait-item additional-info';
    traitItem.innerHTML = `
        <div class="trait-icon">📚</div>
        <div class="trait-content">
            <h4 class="trait-title">${title}</h4>
            <p class="trait-description">${content}</p>
        </div>
    `;
    
    personalTraitsSection.appendChild(traitItem);
    console.log(`✅ ${title} 표시 완료`);
}

// Share result function
function shareResult() {
    if (navigator.share) {
        navigator.share({
            title: '사주 기반 고등학교 진학 컨설팅 결과',
            text: '나에게 맞는 최적의 고등학교를 찾았어요!',
            url: window.location.href
        });
    } else {
        // 링크 복사
        navigator.clipboard.writeText(window.location.href).then(() => {
            console.log('✅ 링크가 클립보드에 복사되었습니다!');
        }).catch(() => {
            console.log('❌ 링크 복사에 실패했습니다.');
        });
    }
}

// 윈도우 리사이즈 시 차트 다시 그리기
window.addEventListener('resize', function() {
    if (window.location.pathname.includes('result.html')) {
        const analysisResult = JSON.parse(localStorage.getItem('sajuAnalysisResult'));
        if (analysisResult && (analysisResult.fortuneTimeline || analysisResult.fortuneFlow)) {
            const fortuneData = analysisResult.fortuneFlow || analysisResult.fortuneTimeline;
            displayFortuneChart(fortuneData);
        }
    }
});

// 강제 리다이렉션 함수 추가
function forceRedirectToResult() {
    console.log('=== 강제 리다이렉션 시작 ===');
    
    // 현재 도메인 기준 절대 경로 생성
    const currentDomain = window.location.origin;
    const currentPath = window.location.pathname;
    const basePath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
    const resultUrl = currentDomain + basePath + 'result.html';
    
    console.log('🌐 현재 도메인:', currentDomain);
    console.log('📂 현재 경로:', currentPath);
    console.log('📁 베이스 경로:', basePath);
    console.log('🎯 결과 페이지 URL:', resultUrl);
    
    // 여러 방법으로 시도
    try {
        console.log('🔄 방법 1: window.location.replace() 시도');
        window.location.replace(resultUrl);
    } catch (e) {
        console.error('❌ 방법 1 실패:', e);
        try {
            console.log('🔄 방법 2: window.location.assign() 시도');
            window.location.assign(resultUrl);
        } catch (e2) {
            console.error('❌ 방법 2 실패:', e2);
            try {
                console.log('🔄 방법 3: window.location.href 시도');
                window.location.href = resultUrl;
            } catch (e3) {
                console.error('❌ 방법 3 실패:', e3);
                try {
                    console.log('🔄 방법 4: document.location.href 시도');
                    document.location.href = resultUrl;
                } catch (e4) {
                    console.error('❌ 방법 4 실패:', e4);
                    // 최후의 수단 - 상대 경로
                    console.log('🔄 방법 5: 상대 경로로 최종 시도');
                    window.location.href = './result.html';
                }
            }
        }
    }
}

// 브라우저 뒤로가기 시 폼 데이터 복원
function restoreFormData() {
    try {
        const savedData = localStorage.getItem('sajuUserData');
        if (savedData) {
            const userData = JSON.parse(savedData);
            
            // 폼 필드에 저장된 데이터 복원
            const nameField = document.getElementById('name');
            const yearField = document.getElementById('birthYear');
            const monthField = document.getElementById('birthMonth');
            const dayField = document.getElementById('birthDay');
            const timeField = document.getElementById('birthTime');
            const genderFields = document.querySelectorAll('input[name="gender"]');
            
            if (nameField && userData.name) nameField.value = userData.name;
            if (yearField && userData.birthYear) yearField.value = userData.birthYear;
            if (monthField && userData.birthMonth) monthField.value = userData.birthMonth;
            if (dayField && userData.birthDay) dayField.value = userData.birthDay;
            if (timeField && userData.birthTime) timeField.value = userData.birthTime;
            
            if (userData.gender) {
                genderFields.forEach(field => {
                    if (field.value === userData.gender) {
                        field.checked = true;
                    }
                });
            }
        }
    } catch (e) {
        // 복원 실패시 무시
    }
}

// 페이지 로드 시 버전 체크 및 이전 데이터 클리어
function checkVersionAndClearOldData() {
    const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    console.log('🔍 버전 체크:', '저장된 버전:', storedVersion, '현재 버전:', SCRIPT_VERSION);
    
    if (!storedVersion || storedVersion !== SCRIPT_VERSION) {
        console.log('🧹 새 버전 감지 - 이전 데이터 클리어');
        localStorage.clear();
        localStorage.setItem(STORAGE_VERSION_KEY, SCRIPT_VERSION);
        console.log('✅ 데이터 클리어 및 새 버전 저장 완료');
    } else {
        console.log('✅ 동일 버전 - 데이터 유지');
    }
}

// 즉시 실행
checkVersionAndClearOldData();