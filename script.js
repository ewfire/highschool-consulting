// Gemini API Configuration
const GEMINI_API_KEY = 'AIzaSyBY1aPCt5gkJr7m8BCuTRUjtLl5PWHO4Dg'; // 실제 사용시 환경변수로 관리
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// 버전 관리 및 데이터 클리어
const SCRIPT_VERSION = '3.7';
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
    
    // 실제 서버에서는 바로 데모 데이터 사용 (API 키 보안 및 CORS 문제 방지)
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        console.log('🌐 실제 서버 환경 감지 - 보안을 위해 데모 데이터 사용');
        return generateDemoAnalysis(userData);
    }
    
    // API 키 검증
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY' || GEMINI_API_KEY.length < 10) {
        console.log('🔑 API 키 미설정 또는 무효 - 데모 데이터 사용');
        return generateDemoAnalysis(userData);
    }
    
    console.log('✅ 로컬 환경에서 API 키 확인됨, Gemini API 호출 시작');
    
    // 기본 요청 ID 생성
    const requestId = Math.random().toString(36).substr(2, 16);
    const selectedPrompt = 'detailed';
    
    console.log('📧 요청 메타데이터:');
    console.log('- 요청 ID:', requestId);
    console.log('- 프롬프트 변형:', selectedPrompt);
    
    const basePrompt = `사주팔자 분석 전문가로서 다음 정보를 바탕으로 고등학교 선택 가이드를 제공해주세요.

**중요: 분석 결과는 단호하고 확신에 찬 어조로 작성해주세요. "~것으로 예상됩니다", "~할 수 있습니다" 같은 애매한 표현보다는 "~합니다", "~될 것입니다", "~해야 합니다" 같은 확실한 표현을 사용하세요.**

**분석 대상 정보:**
- 이름: ${userData.name}
- 생년월일: ${userData.birthYear}년 ${userData.birthMonth}월 ${userData.birthDay}일
- 출생시간: ${userData.birthTime}
- 성별: ${userData.gender}
- 요청 ID: ${requestId}

**분석해야 할 5개 섹션:**

**1. 추천 고등학교 유형 (1순위, 2순위)**
- 고등학교 유형: 교육열 일반고, 내신따기 좋은 일반고, 자율형사립고, 특수목적고(영재고, 외국어고)
- 참고: 특목고는 진학 확률과 선택 비중이 10%밖에 되지 않음
- 1순위와 2순위만 선정하고 각각의 사주 분석 기반 추천 이유를 단호하게 제시
- 예시: "당신은 반드시 ~고에 진학해야 합니다", "~고가 당신에게 최적의 선택입니다"

**2. 남고/여고/공학 중 최적 선택**
- 남고, 여고, 남녀공학 중 가장 적합한 곳과 그 이유를 확신 있게 제시
- 사주의 음양오행을 바탕으로 사회성과 학습환경 적합도를 단정적으로 분석
- 성별에 따른 제약사항 고려 (남성은 여고 배제, 여성은 남고 배제)
- 예시: "당신에게는 ~이 절대적으로 유리합니다", "~을 선택하는 것이 현명합니다"

**3. 문과/이과 적성 분석**
- 문과와 이과 각각의 적합도를 점수로 제시 (30-95점 범위)
- 사주 오행 분석 기반 추천 (목화 → 문과, 금수 → 이과, 토 → 균형)
- 최종 추천과 구체적인 이유를 단호하게 설명
- 예시: "당신은 확실히 ~과가 맞습니다", "~과를 선택하면 성공할 것입니다"

**4. 길한 방향**
- 8방위 중 고등학교 선택시 가장 길한 방향을 확실하게 제시
- 사주 오행과 방위의 조화를 단정적으로 분석
- 해당 방향이 가져다줄 구체적인 효과를 확신 있게 설명
- 예시: "~방향이 당신의 운명을 바꿀 것입니다", "반드시 ~방향 학교를 선택하세요"

**5. 3년간 시험운과 이성운**
- 고등학교 1, 2, 3학년 각각의 시험운과 이성운을 100점 만점으로 제시
- 시험운: 학업 성취도와 시험 성과를 확실하게 예측
- 이성운: 연애에 대한 관심도를 단정적으로 분석
- 예시: "~학년에는 반드시 ~한 결과를 얻을 것입니다", "~학년이 당신의 전환점이 됩니다"

**어조 가이드라인:**
- ❌ 피해야 할 표현: "~것으로 보입니다", "~할 수 있을 것 같습니다", "~하는 것이 좋겠습니다"
- ✅ 사용해야 할 표현: "~합니다", "~될 것입니다", "~해야 합니다", "~이 확실합니다", "반드시 ~하세요"
- 전문가로서의 확신과 권위를 보여주되, 과도하게 단정적이지 않게 균형을 맞추세요

**오행 분석 가이드라인:**
- 목(木): 봄(3-5월), 동쪽, 성장과 창의, 언어능력
- 화(火): 여름(6-8월), 남쪽, 열정과 표현, 예술적 재능
- 토(土): 환절기, 중앙, 안정과 포용, 균형잡힌 성향
- 금(金): 가을(9-11월), 서쪽, 논리와 분석, 수리능력
- 수(水): 겨울(12-2월), 북쪽, 지혜와 탐구, 과학적 사고

**응답 형식 (반드시 JSON으로만 응답):**
{
  "requestId": "${requestId}",
  "promptVariation": "${selectedPrompt}",
  "sajuElements": "오행 분석 내용",
  "section1_schoolTypes": {
    "rank1": {
      "type": "1순위 학교 유형",
      "reason": "사주 분석 기반 상세한 추천 이유"
    },
    "rank2": {
      "type": "2순위 학교 유형", 
      "reason": "사주 분석 기반 상세한 추천 이유"
    },
    "specialNote": "특목고 진학률 10% 참고사항 및 기타 유형 언급"
  },
  "section2_genderSchool": {
    "recommendation": "남고/여고/남녀공학 중 추천",
    "suitabilityScore": 90,
    "reasons": [
      "추천 이유 1",
      "추천 이유 2", 
      "추천 이유 3",
      "추천 이유 4"
    ],
    "alternatives": {
      "otherOptions": "다른 옵션들에 대한 간단한 평가"
    }
  },
  "section3_academicTrack": {
    "liberalArtsScore": 75,
    "scienceScore": 85,
    "recommendation": "이과/문과",
    "liberalStrengths": [
      "문과 강점 1",
      "문과 강점 2",
      "문과 강점 3",
      "문과 강점 4"
    ],
    "scienceStrengths": [
      "이과 강점 1", 
      "이과 강점 2",
      "이과 강점 3",
      "이과 강점 4"
    ],
    "liberalSubjects": ["국어", "영어", "사회", "역사"],
    "scienceSubjects": ["수학", "물리", "화학", "생명과학"],
    "finalRecommendation": "최종 결론과 조언"
  },
  "section4_direction": {
    "bestDirection": "북동",
    "directionTitle": "북동쪽이 가장 길한 방향입니다",
    "explanation": "방향 선택 이유",
    "benefits": [
      "학업운 상승: 설명",
      "대인관계 개선: 설명", 
      "성장 동력: 설명",
      "건강운: 설명"
    ],
    "practicalAdvice": "실용적 조언"
  },
  "section5_fortune": {
    "grade1": {
      "year": "2024년",
      "phase": "적응기",
      "examLuck": 75,
      "romanceLuck": 65,
      "examDescription": "시험운 설명",
      "romanceDescription": "이성운 설명"
    },
    "grade2": {
      "year": "2025년", 
      "phase": "발전기",
      "examLuck": 90,
      "romanceLuck": 85,
      "examDescription": "시험운 설명",
      "romanceDescription": "이성운 설명"
    },
    "grade3": {
      "year": "2026년",
      "phase": "완성기", 
      "examLuck": 95,
      "romanceLuck": 70,
      "examDescription": "시험운 설명",
      "romanceDescription": "이성운 설명"
    },
    "summary": {
      "examTrend": "3년간 시험운 종합 분석",
      "romanceTrend": "3년간 이성운 종합 분석"
    }
  },
  "summary": "전체 분석 종합 요약"
}`;

    try {
        console.log('📤 사주 분석 요청 준비...');
        console.log(`프롬프트 길이: ${basePrompt.length} 문자`);
        
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
        
        console.log(`요청 본문 크기: ${JSON.stringify(requestBody).length} bytes`);
        
        const startTime = Date.now();
        console.log('🌐 Fetch 요청 시작...');
        
        // 타임아웃 설정 (10초)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'HighSchool-Recommender/1.0'
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const endTime = Date.now();
        console.log(`📥 응답 받음 - 상태: ${response.status}, 시간: ${endTime - startTime}ms`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API 호출 성공!');
            
            if (data.candidates && data.candidates.length > 0) {
                const generatedText = data.candidates[0].content.parts[0].text;
                console.log(`📝 생성된 텍스트 길이: ${generatedText.length} 문자`);
                
                try {
                    let cleanedText = generatedText
                        .replace(/```json\s*/g, '')
                        .replace(/```\s*/g, '')
                        .replace(/^\s*[\`\'\"]*/g, '')
                        .replace(/[\`\'\\"]*\s*$/g, '')
                        .trim();
                    
                    const analysisResult = JSON.parse(cleanedText);
                    console.log('✅ JSON 파싱 성공!');
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
            console.log('🎭 API 호출 실패로 데모 데이터 사용');
            return generateDemoAnalysis(userData);
        }
        
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('❌ API 호출 타임아웃 (10초 초과)');
        } else {
            console.error(`❌ 네트워크 에러: ${error.message}`);
        }
        console.log('🎭 API 호출 실패로 데모 데이터 사용');
        return generateDemoAnalysis(userData);
    }
}

// Generate demo analysis for testing
function generateDemoAnalysis(userData) {
    console.log('=== 데모 분석 데이터 생성 시작 ===', userData);
    
    // 매번 다른 결과를 위한 강화된 랜덤 시드
    const randomSeed = Date.now() + Math.random() * 1000000;
    Math.seedrandom = function(seed) {
        let m = 0x80000000;
        let a = 1103515245;
        let c = 12345;
        let state = seed ? seed : Math.floor(Math.random() * (m - 1));
        return function() {
            state = (a * state + c) % m;
            return state / (m - 1);
        };
    };
    const customRandom = Math.seedrandom(randomSeed);
    
    console.log('🎲 랜덤 시드 생성:', randomSeed);
    
    const randomId = `demo_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    console.log('입력 사용자 데이터:', userData);
    
    console.log('🎭 데모 분석 데이터 생성 시작');
    console.log('⚠️ 이것은 데모 데이터입니다! API 호출이 실패했습니다! 🚨');
    
    const timestamp = Date.now();
    
    // 오행 기반 성격 분석
    const birthMonth = parseInt(userData.birthMonth);
    const seasonElement = birthMonth <= 2 || birthMonth === 12 ? '수(水)' : 
                         birthMonth <= 5 ? '목(木)' : 
                         birthMonth <= 8 ? '화(火)' : 
                         birthMonth <= 11 ? '금(金)' : '토(土)';
    
    // 성별에 맞는 학교 유형 생성
    const getGenderAppropriateSchools = (types, gender) => {
        return types.filter(type => {
            if (gender === '남성') return !type.includes('여고');
            if (gender === '여성') return !type.includes('남고');
            return true;
        });
    };
    
    const schoolTypes = {
        competitive: ['교육열 일반고'],
        gradeGood: ['내신따기 좋은 일반고'],
        autonomous: ['자율형 사립고'],
        special: ['영재고', '외국어고']
    };
    
    const filteredTypes = {
        competitive: getGenderAppropriateSchools(schoolTypes.competitive, userData.gender),
        gradeGood: getGenderAppropriateSchools(schoolTypes.gradeGood, userData.gender),
        autonomous: schoolTypes.autonomous,
        special: schoolTypes.special
    };
    
    // 랜덤 선택으로 1, 2순위 결정
    const rank1Random = Math.random();
    let rank1Type, rank2Type;
    
    if (rank1Random < 0.5) {
        rank1Type = filteredTypes.competitive[Math.floor(Math.random() * filteredTypes.competitive.length)];
        rank2Type = filteredTypes.gradeGood[Math.floor(Math.random() * filteredTypes.gradeGood.length)];
    } else {
        rank1Type = filteredTypes.gradeGood[Math.floor(Math.random() * filteredTypes.gradeGood.length)];
        rank2Type = filteredTypes.competitive[Math.floor(Math.random() * filteredTypes.competitive.length)];
    }
    
    console.log('🎯 성별 필터링 결과:', {
        gender: userData.gender,
        rank1Type,
        rank2Type,
        filteredCompetitive: filteredTypes.competitive,
        filteredGradeGood: filteredTypes.gradeGood
    });
    
    // 남고/여고/공학 추천 (더 다양한 패턴)
    const genderSchoolOptions = {
        male: ['남녀공학', '남고', '남녀공학'], // 70% 확률로 남녀공학
        female: ['남녀공학', '여고', '남녀공학'], // 70% 확률로 남녀공학
        other: ['남녀공학']
    };
    
    const genderOptions = genderSchoolOptions[userData.gender === '남성' ? 'male' : userData.gender === '여성' ? 'female' : 'other'] || ['남녀공학'];
    const genderRecommendation = genderOptions[Math.floor(Math.random() * genderOptions.length)];
    
    // 적합도 점수도 랜덤하게 (75-95% 범위)
    const suitabilityScore = 75 + Math.floor(Math.random() * 21);
    
    console.log('👥 성별 구성 추천 생성:', {
        gender: userData.gender,
        recommendation: genderRecommendation,
        suitabilityScore: suitabilityScore
    });
    
    // 문과/이과 점수 (오행 기반 + 랜덤성 추가)
    const isScience = seasonElement === '금(金)' || seasonElement === '수(水)';
    const baseScience = isScience ? 70 : 50;
    const baseLliberal = isScience ? 50 : 70;
    
    // 더 다양한 점수 범위 (30-95)
    const scienceScore = Math.min(95, Math.max(30, baseScience + Math.floor(Math.random() * 30) - 10));
    const liberalScore = Math.min(95, Math.max(30, baseLliberal + Math.floor(Math.random() * 30) - 10));
    
    console.log('📊 문과/이과 점수 생성:', {
        seasonElement,
        isScience,
        scienceScore,
        liberalScore
    });
    
    // 방향 결정
    const directions = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
    const directionAngles = { '북': 0, '북동': 45, '동': 90, '남동': 135, '남': 180, '남서': 225, '서': 270, '북서': 315 };
    const selectedDirection = directions[Math.floor(Math.random() * directions.length)];
    
    // 3년간 운세 생성 (더 다양한 패턴)
    const generateFortuneData = () => {
        const patterns = [
            // 패턴 1: 점진적 상승
            { base: [65, 80, 92], variance: 10 },
            // 패턴 2: 2학년 피크
            { base: [70, 95, 85], variance: 8 },
            // 패턴 3: 안정적 고점
            { base: [85, 88, 90], variance: 5 },
            // 패턴 4: 변동 패턴
            { base: [75, 70, 95], variance: 12 }
        ];
        
        const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
        
        const examScores = selectedPattern.base.map(base => 
            Math.min(98, Math.max(50, base + Math.floor(Math.random() * selectedPattern.variance * 2) - selectedPattern.variance))
        );
        
        const romanceScores = examScores.map(score => 
            Math.min(95, Math.max(40, 100 - score + Math.floor(Math.random() * 20) - 10))
        );
        
        // 다양한 설명 패턴
        const examDescriptions = [
            [
                "새로운 환경 적응 과정에서 초기에는 다소 불안정하지만, 꾸준한 노력으로 확실한 향상을 이룰 것입니다",
                "학습 패턴이 완전히 안정화되고 자신감이 생기면서 실력이 크게 향상되는 전환점이 될 것입니다",
                "수능과 대학 입시에서 그간의 모든 노력이 결실을 맺어 최상의 성과를 반드시 거둘 것입니다"
            ],
            [
                "뛰어난 적응력으로 새로운 환경에서도 안정적인 성과를 확실히 보일 것입니다",
                "학업에 대한 집중도가 최고조에 달하며 놀라운 성장을 보이는 황금기가 될 것입니다",
                "입시 스트레스가 있지만 체계적인 준비로 목표를 반드시 달성할 것입니다"
            ],
            [
                "차분한 성격으로 고등학교 생활에 빠르게 적응하며 확실히 좋은 출발을 할 것입니다",
                "학습 능력이 정점에 달하며 모든 과목에서 균형잡힌 성과를 확실히 거둘 것입니다",
                "마지막 스퍼트에서 집중력을 최대로 발휘하여 최고의 결과를 반드시 만들어낼 것입니다"
            ]
        ];
        
        const romanceDescriptions = [
            [
                "새로운 환경에서 만나는 사람들과의 관계 형성에 적극적으로 집중하는 시기가 될 것입니다",
                "자신감과 매력이 최고조에 달하며 좋은 인연을 반드시 만날 것입니다",
                "입시에 집중하면서도 진정한 마음을 나눌 수 있는 특별한 인연을 확실히 만날 것입니다"
            ],
            [
                "학교 적응에 집중하느라 이성에 대한 관심은 상대적으로 낮을 것입니다",
                "활발한 학교 생활과 함께 자연스러운 이성 관계를 확실히 경험할 것입니다",
                "학업과 이성 관계의 균형을 완벽하게 맞춰나가며 성숙한 관계를 형성할 것입니다"
            ]
        ];
        
        const descIndex = Math.floor(Math.random() * examDescriptions.length);
        const romanceIndex = Math.floor(Math.random() * romanceDescriptions.length);
        
        return {
            grade1: {
                year: "2024년",
                phase: "적응기",
                examLuck: examScores[0],
                romanceLuck: romanceScores[0],
                examDescription: examDescriptions[descIndex][0],
                romanceDescription: romanceDescriptions[romanceIndex][0]
            },
            grade2: {
                year: "2025년",
                phase: "발전기",
                examLuck: examScores[1],
                romanceLuck: romanceScores[1],
                examDescription: examDescriptions[descIndex][1],
                romanceDescription: romanceDescriptions[romanceIndex][1]
            },
            grade3: {
                year: "2026년",
                phase: "완성기",
                examLuck: examScores[2],
                romanceLuck: romanceScores[2],
                examDescription: examDescriptions[descIndex][2],
                romanceDescription: romanceDescriptions[romanceIndex][2]
            }
        };
    };
    
    const fortuneData = generateFortuneData();
    
    // 성별 구성 추천 이유 생성 함수
    const generateGenderSchoolReasons = (element, recommendation, gender) => {
        const elementTraits = {
            '목(木)': { trait: '성장 지향적', social: '협력적', learning: '탐구적' },
            '화(火)': { trait: '열정적', social: '활발한 소통', learning: '표현 중심' },
            '토(土)': { trait: '안정 추구', social: '조화로운', learning: '체계적' },
            '금(金)': { trait: '논리적', social: '분석적', learning: '집중적' },
            '수(水)': { trait: '지혜로운', social: '깊은 사고', learning: '성찰적' }
        };
        
        const trait = elementTraits[element] || elementTraits['토(土)'];
        
        if (recommendation === '남녀공학') {
            return [
                `${element} 기운의 ${trait.trait} 성향: 사주에서 ${element}의 조화로운 에너지가 다양한 성별과의 상호작용을 통해 더욱 발전할 것입니다`,
                `${trait.social} 소통 능력: ${element} 사주는 균형잡힌 관계 형성을 선호하며, 남녀공학에서 이 능력이 최대로 발휘될 것입니다`,
                `${trait.learning} 학습 스타일: 당신의 사주는 다양한 관점을 수용하는 특성이 강해 남녀공학의 다양성이 학습 효과를 크게 높일 것입니다`,
                `음양 조화의 완성: ${element} 기운은 음양의 균형을 중시하므로 남녀공학 환경에서 자연스러운 에너지 순환을 이룰 것입니다`
            ];
        } else if (recommendation === '남고' && gender === '남성') {
            return [
                `${element} 기운의 집중력 극대화: 사주에서 ${element}의 강한 에너지가 남성들끼리의 경쟁 환경에서 더욱 집중된 학습력을 발휘할 것입니다`,
                `동성 간 깊은 유대감: ${element} 사주는 진정한 우정을 중시하는 특성이 있어 남고의 형제애적 분위기에서 확실한 성장을 이룰 것입니다`,
                `${trait.learning} 특성 강화: 당신의 사주는 깊이 있는 탐구를 선호하므로 남고의 집중적 학습 환경이 완벽하게 맞을 것입니다`,
                `리더십 발현: ${element} 기운은 남성적 에너지와 조화되어 남고에서 자연스러운 리더십을 확실히 발휘할 것입니다`
            ];
        } else if (recommendation === '여고' && gender === '여성') {
            return [
                `${element} 기운의 섬세함 발달: 사주에서 ${element}의 정교한 에너지가 여성들만의 세심한 환경에서 더욱 정밀하게 발전할 것입니다`,
                `${trait.social} 깊이 있는 관계: ${element} 사주는 진심어린 소통을 중시하므로 여고의 친밀한 분위기에서 평생 우정을 확실히 쌓을 것입니다`,
                `학업 집중도 향상: 당신의 ${trait.learning} 성향이 여고의 차분한 학습 환경과 완벽하게 조화되어 최상의 성과를 낼 것입니다`,
                `내적 성장 촉진: ${element} 기운은 내면의 성찰을 중시하므로 여고의 안정적 환경에서 확실한 자아 발견을 이룰 것입니다`
            ];
        }
        
        // 기본값 (남녀공학)
        return [
            `${element} 기운의 균형 추구: 사주 분석 결과 다양한 에너지의 조화를 통해 성장하는 특성이 뚜렷합니다`,
            `사회적 적응력 강화: ${element} 사주는 실제 사회와 유사한 환경에서 더욱 자연스러운 발전을 이룰 것입니다`,
            `${trait.learning} 능력 향상: 다양한 관점의 학습 자극이 당신의 사주 특성과 완벽하게 맞아떨어질 것입니다`,
            `전인적 성장: ${element} 기운은 편중되지 않은 균형잡힌 환경에서 최고의 잠재력을 발휘할 것입니다`
        ];
    };
    
    // 다른 성별 구성 옵션에 대한 사주 기반 평가 생성 함수
    const generateAlternativeGenderOptions = (recommendation, gender, element) => {
        const elementTraits = {
            '목(木)': '성장 지향적',
            '화(火)': '열정적',
            '토(土)': '안정 추구',
            '금(金)': '논리적',
            '수(水)': '지혜로운'
        };
        
        const trait = elementTraits[element] || '균형잡힌';
        
        if (recommendation === '남녀공학') {
            if (gender === '남성') {
                return `남고는 ${element} 기운의 ${trait} 특성을 집중적으로 발전시킬 수 있으나, 당신의 사주는 다양성을 통한 성장을 더 선호하는 구조입니다.`;
            } else {
                return `여고는 ${element} 기운의 ${trait} 특성을 심화시킬 수 있으나, 당신의 사주는 균형잡힌 환경에서 더 큰 발전을 이룰 운명입니다.`;
            }
        } else if (recommendation === '남고') {
            return `남녀공학도 좋지만, 당신의 ${element} 사주는 동성 간의 깊은 유대와 집중적 학습 환경에서 더욱 확실한 성과를 거둘 것입니다.`;
        } else if (recommendation === '여고') {
            return `남녀공학도 괜찮지만, 당신의 ${element} 사주는 차분하고 섬세한 여성들만의 환경에서 더욱 뛰어난 잠재력을 발휘할 것입니다.`;
        }
        
        return `다른 옵션들도 나쁘지 않으나, 당신의 ${element} 사주 특성상 추천된 환경이 가장 적합합니다.`;
    };
    
    // 새로운 5섹션 구조로 반환
    return {
        requestId: randomId,
        promptVariation: "demo",
        sajuElements: `${seasonElement} 기운이 강한 사주로, ${seasonElement === '목(木)' ? '성장과 창의성' :
                      seasonElement === '화(火)' ? '열정과 적극성' :
                      seasonElement === '토(土)' ? '안정과 신중함' :
                      seasonElement === '금(金)' ? '논리와 분석력' : '지혜와 탐구심'}이 뛰어납니다.`,
        
        section1_schoolTypes: {
            rank1: {
                type: rank1Type,
                reason: `사주에서 ${seasonElement} 기운이 강하여 ${rank1Type.includes('교육열') ? '경쟁적인 환경에서 탁월한 성과를 발휘하는 성격' : '안정적인 환경에서 꾸준히 성장하는 확실한 성향'}입니다. ${rank1Type}이 당신에게 최적의 선택이며, ${rank1Type.includes('교육열') ? '우수한 친구들과 함께 공부하며 학업 동기를 극대화하고, 체계적인 입시 시스템을 통해 목표 대학에 반드시 진학할 것' : '내신 관리를 안정적으로 하며 자신만의 속도로 확실한 학업 성취를 이룰 것'}입니다.`
            },
            rank2: {
                type: rank2Type,
                reason: `사주의 보조적 특성으로 ${rank2Type}도 당신에게 잘 맞습니다. ${rank2Type.includes('자율형') ? '다양한 교육과정과 우수한 교육 환경을 통해 잠재력을 확실히 발휘할 수 있으나, 경제적 부담을 반드시 고려해야 합니다.' : rank2Type.includes('교육열') ? '경쟁적인 환경에서 강한 동기부여를 받으며 성장할 수 있는 확실한 대안입니다.' : '안정적인 학습 환경에서 꾸준한 성장을 도모할 수 있는 현실적이고 확실한 선택입니다.'}`
            },
            specialNote: "특목고는 진학 확률과 선택 비중이 10%밖에 되지 않으므로, 일반고 옵션을 충분히 고려하시고 현실적인 대안을 반드시 준비하시기 바랍니다."
        },
        
        section2_genderSchool: {
            recommendation: genderRecommendation,
            suitabilityScore: suitabilityScore,
            reasons: generateGenderSchoolReasons(seasonElement, genderRecommendation, userData.gender),
            alternatives: {
                otherOptions: generateAlternativeGenderOptions(genderRecommendation, userData.gender, seasonElement)
            }
        },
        
        section3_academicTrack: {
            liberalArtsScore: liberalScore,
            scienceScore: scienceScore,
            recommendation: scienceScore > liberalScore ? "이과" : "문과",
            liberalStrengths: [
                "언어적 사고력: 표현력과 소통 능력이 매우 우수합니다",
                "인문학적 소양: 사회 현상에 대한 관심과 이해도가 탁월합니다", 
                "창의적 사고: 새로운 아이디어를 창출하는 능력이 뛰어납니다",
                "비판적 분석: 복합적 상황을 종합적으로 판단하는 능력이 확실합니다"
            ],
            scienceStrengths: [
                "논리적 사고력: 체계적이고 분석적인 사고에서 탁월한 능력을 발휘합니다",
                "수리 능력: 복잡한 수학적 개념을 이해하고 응용하는 능력이 매우 우수합니다",
                "과학적 탐구심: 호기심이 많고 원리를 파헤치는 것을 확실히 좋아합니다", 
                "체계적 접근: 문제를 단계별로 해결하는 방법론적 사고력이 뛰어납니다"
            ],
            liberalSubjects: ["국어", "영어", "사회", "역사"],
            scienceSubjects: ["수학", "물리", "화학", "생명과학"],
            finalRecommendation: `${scienceScore > liberalScore ? '이과를 강력히 추천' : '문과를 확실히 추천'}합니다. 사주 분석 결과 ${seasonElement} 기운으로 ${scienceScore > liberalScore ? '논리적 사고와 체계적 접근을 확실히 선호하는 성향이 강하며, 수학과 과학 분야에서 탁월한 성과를 반드시 거둘 것입니다.' : '언어적 표현력과 창의적 사고가 매우 뛰어나며, 인문학과 사회과학 분야에서 확실한 재능을 발휘할 것입니다.'} 다만 ${scienceScore > liberalScore ? '문과 영역의 국어와 영어 실력도 꾸준히 기르시어' : '이과 영역의 수학과 과학 기초도 탄탄히 하여'} 균형잡힌 학습 능력을 반드시 갖추시기 바랍니다.`
        },
        
        section4_direction: {
            bestDirection: selectedDirection,
            directionTitle: `${selectedDirection}쪽이 당신에게 가장 길한 방향입니다`,
            explanation: `사주에서 ${seasonElement} 기운이 ${selectedDirection} 방향과 완벽하게 조화됩니다. 이 방향은 학업운과 성장운을 크게 향상시키며, 새로운 시작과 발전에 매우 유리한 기운을 확실히 가지고 있습니다.`,
            benefits: [
                "학업운 상승: 집중력과 이해력이 크게 향상될 것입니다",
                "대인관계 개선: 좋은 친구들과 선생님들을 반드시 만날 것입니다",
                "성장 동력: 지속적인 발전과 성취를 확실히 이룰 수 있는 환경이 조성될 것입니다", 
                "건강운: 신체적, 정신적 건강이 안정적으로 유지될 것입니다"
            ],
            practicalAdvice: `집에서 ${selectedDirection}쪽 방향에 위치한 고등학교를 반드시 우선적으로 고려하세요. 통학 거리나 교통편도 함께 고려하되, 가능한 범위 내에서 ${selectedDirection}쪽 학교를 선택하시면 확실히 더욱 좋은 학교생활을 할 수 있을 것입니다.`
        },
        
        section5_fortune: {
            ...fortuneData,
            summary: {
                examTrend: "시간이 지날수록 꾸준히 상승하여 3학년에 최고조에 달할 것입니다. 특히 2-3학년 시기가 학업적 성취를 위한 확실한 황금기가 될 것입니다.",
                romanceTrend: "2학년이 가장 활발한 시기가 될 것이며, 1학년과 3학년은 상대적으로 차분한 편일 것입니다. 학업과 이성관계의 적절한 균형을 반드시 유지하는 것이 중요합니다."
            }
        },
        
        summary: `${userData.name} 님은 ${seasonElement} 기운이 강한 사주로, ${genderRecommendation}에서 ${scienceScore > liberalScore ? '이과' : '문과'} 과정을 선택하시어 ${selectedDirection}쪽 방향의 ${rank1Type}에 반드시 진학하시는 것을 강력히 추천드립니다.`
    };
}

// Result page initialization
function initializeResultPage() {
    console.log('=== 결과 페이지 초기화 시작 ===');
    
    try {
        let userData = localStorage.getItem('sajuUserData');
        let analysisResult = null; // 항상 새로운 분석 결과 생성하도록 변경
        
        console.log('📦 localStorage에서 가져온 사용자 데이터:', userData);
        
        // 사용자 데이터 파싱
        try {
            userData = userData ? JSON.parse(userData) : null;
            console.log('✅ 사용자 데이터 파싱 성공:', userData);
        } catch (e) {
            console.error('❌ 사용자 데이터 파싱 실패:', e);
            userData = null;
        }
        
        // 사용자 데이터가 없으면 기본값 설정
        if (!userData) {
            console.log('⚠️ 사용자 데이터가 없음 - 기본 데이터 생성');
            userData = {
                name: '홍길동',
                birthYear: '2008',
                birthMonth: '3',
                birthDay: '15',
                birthTime: '오시',
                gender: '남성'
            };
        }
        
        // 매번 새로운 분석 결과 생성
        console.log('🔄 새로운 분석 결과 생성 중...');
        analysisResult = generateDemoAnalysis(userData);
        console.log('✅ 새로운 분석 결과 생성 완료:', analysisResult);
        
        // localStorage에 새로운 결과 저장 (안전하게)
        try {
            localStorage.setItem('sajuAnalysisResult', JSON.stringify(analysisResult));
            console.log('💾 새로운 분석 결과를 localStorage에 저장 완료');
        } catch (storageError) {
            console.warn('⚠️ localStorage 저장 실패:', storageError);
            // 저장 실패해도 계속 진행
        }
        
        console.log('📊 최종 사용할 데이터:');
        console.log('userData:', userData);
        console.log('analysisResult type:', typeof analysisResult);
        
        console.log('🎨 결과 표시 시작');
        displayAnalysisResult(userData, analysisResult);
        console.log('✅ 결과 페이지 초기화 완료');
        
    } catch (error) {
        console.error('❌ 결과 페이지 초기화 중 오류 발생:', error);
        
        // 최후의 수단: 기본 데이터로 다시 시도
        try {
            const fallbackUserData = {
                name: '홍길동',
                birthYear: '2008',
                birthMonth: '3',
                birthDay: '15',
                birthTime: '오시',
                gender: '남성'
            };
            
            const fallbackResult = generateDemoAnalysis(fallbackUserData);
            displayAnalysisResult(fallbackUserData, fallbackResult);
            console.log('✅ 폴백 데이터로 복구 완료');
            
        } catch (fallbackError) {
            console.error('❌ 폴백 데이터로도 복구 실패:', fallbackError);
            
            // 페이지에 에러 메시지 표시
            const container = document.querySelector('.main-content');
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 50px; color: #666;">
                        <h2>🔄 분석 결과를 불러오는 중입니다...</h2>
                        <p>잠시만 기다려주세요.</p>
                        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            새로고침
                        </button>
                    </div>
                `;
            }
        }
    }
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
        analysisDescElement.textContent = result.summary || '사주팔자 분석을 통해 가장 적합한 고등학교 유형과 진로 방향을 제시해드립니다.';
        console.log('✅ 분석 요약 설정');
    } else {
        console.error('❌ analysisDescription 엘리먼트를 찾을 수 없음');
    }
    
    // 새로운 5개 섹션 구조에 맞게 표시
    if (result.section1_schoolTypes) {
        console.log('🏫 섹션 1: 학교 유형 추천 표시');
        displaySection1SchoolTypes(result.section1_schoolTypes);
    }
    
    if (result.section2_genderSchool) {
        console.log('👥 섹션 2: 남고/여고/공학 추천 표시');
        displaySection2GenderSchool(result.section2_genderSchool);
    }
    
    if (result.section3_academicTrack) {
        console.log('📚 섹션 3: 문과/이과 적성 표시');
        displaySection3AcademicTrack(result.section3_academicTrack);
    }
    
    if (result.section4_direction) {
        console.log('🧭 섹션 4: 길한 방향 표시');
        displaySection4Direction(result.section4_direction);
    }
    
    if (result.section5_fortune) {
        console.log('📊 섹션 5: 3년간 운세 표시');
        displaySection5Fortune(result.section5_fortune);
    }
    
    // 기존 구조 호환성 유지 (API가 기존 구조로 응답할 경우)
    if (!result.section1_schoolTypes && result.recommendedSchools) {
        console.log('🔄 기존 구조 호환 모드로 표시');
        displaySchoolRecommendations(result.recommendedSchools, result.notRecommendedSchools);
        
        if (result.direction) {
            displayDirectionAnalysis(result.direction);
        }
        
        if (result.fortuneFlow) {
            displayFortuneChart(result.fortuneFlow);
        }
        
        if (result.personalTraits) {
            displayPersonalTraits(result.personalTraits);
        }
        
        if (result.academicTrack) {
            displayAcademicTrack(result.academicTrack);
        }
    }
    
    console.log('✅ 분석 결과 표시 완료');
}

// 섹션 1: 학교 유형 추천 표시
function displaySection1SchoolTypes(data) {
    console.log('=== 섹션 1: 학교 유형 추천 표시 ===', data);
    
    // 1순위 추천 업데이트
    const rank1Card = document.querySelector('.recommendation-card.gold-card');
    if (rank1Card && data.rank1) {
        const nameEl = rank1Card.querySelector('.school-type-title');
        const reasonEl = rank1Card.querySelector('.recommendation-reason');
        
        if (nameEl) nameEl.textContent = data.rank1.type;
        if (reasonEl) reasonEl.textContent = data.rank1.reason;
        console.log('✅ 1순위 업데이트:', data.rank1.type);
    }
    
    // 2순위 추천 업데이트
    const rank2Card = document.querySelector('.recommendation-card.silver-card');
    if (rank2Card && data.rank2) {
        const nameEl = rank2Card.querySelector('.school-type-title');
        const reasonEl = rank2Card.querySelector('.recommendation-reason');
        
        if (nameEl) nameEl.textContent = data.rank2.type;
        if (reasonEl) reasonEl.textContent = data.rank2.reason;
        console.log('✅ 2순위 업데이트:', data.rank2.type);
    }
    
    // 특목고 참고사항 업데이트
    const noticeText = document.querySelector('.notice-text');
    if (noticeText && data.specialNote) {
        noticeText.textContent = data.specialNote;
        console.log('✅ 참고사항 업데이트');
    }
    
    console.log('✅ 섹션 1 표시 완료');
}

// 섹션 2: 남고/여고/공학 추천 표시
function displaySection2GenderSchool(data) {
    console.log('=== 섹션 2: 남고/여고/공학 추천 표시 ===', data);
    
    // 추천 성별 구성 업데이트
    const recommendedTypeEl = document.getElementById('recommendedGenderType');
    if (recommendedTypeEl && data.recommendation) {
        recommendedTypeEl.textContent = `🎯 추천: ${data.recommendation}`;
        console.log('✅ 추천 성별 구성 업데이트:', data.recommendation);
    }
    
    // 적합도 점수 업데이트
    const suitabilityScoreEl = document.getElementById('genderSuitabilityScore');
    if (suitabilityScoreEl && data.suitabilityScore) {
        suitabilityScoreEl.textContent = `적합도 ${data.suitabilityScore}%`;
        console.log('✅ 적합도 점수 업데이트:', data.suitabilityScore);
    }
    
    // 추천 이유 업데이트
    const reasonsList = document.getElementById('genderRecommendationReasons');
    if (reasonsList && data.reasons) {
        reasonsList.innerHTML = '';
        data.reasons.forEach(reason => {
            const li = document.createElement('li');
            li.innerHTML = reason; // 이미 <strong> 태그가 포함되어 있음
            reasonsList.appendChild(li);
        });
        console.log('✅ 추천 이유 업데이트:', data.reasons.length, '개');
    }
    
    // 기타 고려사항 업데이트
    const alternativesEl = document.getElementById('alternativeOptions');
    if (alternativesEl && data.alternatives && data.alternatives.otherOptions) {
        alternativesEl.innerHTML = `<p>${data.alternatives.otherOptions}</p>`;
        console.log('✅ 기타 고려사항 업데이트');
    }
    
    console.log('✅ 섹션 2 표시 완료');
}

// 섹션 3: 문과/이과 적성 표시
function displaySection3AcademicTrack(data) {
    console.log('=== 섹션 3: 문과/이과 적성 표시 ===', data);
    
    // 점수 업데이트 - ID 기반으로 정확하게
    const liberalScore = document.getElementById('liberalScore');
    const scienceScore = document.getElementById('scienceScore');
    
    if (liberalScore) liberalScore.textContent = `${data.liberalArtsScore}%`;
    if (scienceScore) scienceScore.textContent = `${data.scienceScore}%`;
    
    // 추천 여부에 따라 카드 스타일 조정
    const liberalCard = document.querySelector('.track-card.liberal-arts');
    const scienceCard = document.querySelector('.track-card.science');
    
    if (data.recommendation === '이과' && scienceCard) {
        scienceCard.classList.add('recommended-track');
        if (liberalCard) liberalCard.classList.remove('recommended-track');
        
        // 이과 헤더 업데이트
        const scienceHeader = scienceCard.querySelector('.track-header h4');
        if (scienceHeader) scienceHeader.textContent = '🔬 이과 (추천)';
        
        // 문과 헤더에서 추천 제거
        const liberalHeader = liberalCard?.querySelector('.track-header h4');
        if (liberalHeader) liberalHeader.textContent = '📖 문과';
        
    } else if (data.recommendation === '문과' && liberalCard) {
        liberalCard.classList.add('recommended-track');
        if (scienceCard) scienceCard.classList.remove('recommended-track');
        
        // 문과 헤더 업데이트
        const liberalHeader = liberalCard.querySelector('.track-header h4');
        if (liberalHeader) liberalHeader.textContent = '📖 문과 (추천)';
        
        // 이과 헤더에서 추천 제거
        const scienceHeader = scienceCard?.querySelector('.track-header h4');
        if (scienceHeader) scienceHeader.textContent = '🔬 이과';
    }
    
    // 강점 업데이트
    if (data.liberalStrengths) {
        const liberalStrengthsList = liberalCard?.querySelector('ul');
        if (liberalStrengthsList) {
            liberalStrengthsList.innerHTML = '';
            data.liberalStrengths.forEach(strength => {
                const li = document.createElement('li');
                li.innerHTML = strength; // 이미 <strong> 태그가 포함되어 있음
                liberalStrengthsList.appendChild(li);
            });
        }
    }
    
    if (data.scienceStrengths) {
        const scienceStrengthsList = scienceCard?.querySelector('ul');
        if (scienceStrengthsList) {
            scienceStrengthsList.innerHTML = '';
            data.scienceStrengths.forEach(strength => {
                const li = document.createElement('li');
                li.innerHTML = strength; // 이미 <strong> 태그가 포함되어 있음
                scienceStrengthsList.appendChild(li);
            });
        }
    }
    
    // 문과 특성 업데이트
    const trackNote = liberalCard?.querySelector('.track-note');
    if (trackNote && data.recommendation === '이과') {
        trackNote.textContent = "문과도 충분히 적합하나, 이과에서 더 큰 잠재력을 발휘할 수 있을 것으로 예상됩니다.";
    } else if (trackNote && data.recommendation === '문과') {
        trackNote.textContent = "문과에서 뛰어난 재능을 발휘할 수 있을 것으로 예상됩니다.";
    }
    
    // 최종 추천 업데이트
    const finalRecommendationEl = document.getElementById('finalRecommendationText');
    if (finalRecommendationEl && data.finalRecommendation) {
        finalRecommendationEl.innerHTML = data.finalRecommendation;
    }
    
    console.log('✅ 섹션 3 표시 완료 - 점수 업데이트됨:', {
        liberal: data.liberalArtsScore,
        science: data.scienceScore,
        recommendation: data.recommendation
    });
}

// 섹션 4: 길한 방향 표시
function displaySection4Direction(data) {
    console.log('=== 섹션 4: 길한 방향 표시 ===', data);
    
    // 방향 제목 업데이트
    const titleEl = document.getElementById('directionTitle');
    if (titleEl && data.directionTitle) {
        titleEl.textContent = data.directionTitle;
        console.log('✅ 방향 제목 업데이트:', data.directionTitle);
    }
    
    // 방향 설명 업데이트
    const explanationEl = document.getElementById('directionExplanation');
    if (explanationEl && data.explanation) {
        explanationEl.textContent = data.explanation;
        console.log('✅ 방향 설명 업데이트');
    }
    
    // 나침반 포인터 업데이트
    const compassPointer = document.getElementById('compassPointer');
    if (compassPointer && data.bestDirection) {
        const directionAngles = {
            '북': 0, '북동': 45, '동': 90, '남동': 135,
            '남': 180, '남서': 225, '서': 270, '북서': 315
        };
        const angle = directionAngles[data.bestDirection] || 0;
        compassPointer.style.transform = `rotate(${angle}deg)`;
        console.log('✅ 나침반 포인터 회전:', `${data.bestDirection} -> ${angle}도`);
    }
    
    console.log('✅ 섹션 4 표시 완료');
}

// 섹션 5: 3년간 운세 표시
function displaySection5Fortune(data) {
    console.log('=== 섹션 5: 3년간 운세 표시 ===', data);
    
    const grades = ['grade1', 'grade2', 'grade3'];
    
    grades.forEach((grade, index) => {
        const gradeData = data[grade];
        if (!gradeData) {
            console.error(`❌ ${grade} 데이터가 없음`);
            return;
        }
        
        const gradeNum = index + 1;
        
        // 제목과 년도 업데이트
        const titleEl = document.getElementById(`${grade}Title`);
        const yearEl = document.getElementById(`${grade}Year`);
        
        if (titleEl && gradeData.phase) {
            const phaseIcon = index === 0 ? '🌱' : index === 1 ? '🚀' : '🎯';
            titleEl.textContent = `${phaseIcon} ${gradeNum}학년 (${gradeData.phase})`;
        }
        
        if (yearEl && gradeData.year) {
            yearEl.textContent = gradeData.year;
        }
        
        // 시험운 업데이트
        const examBar = document.getElementById(`${grade}ExamBar`);
        const examScore = document.getElementById(`${grade}ExamScore`);
        const examDesc = document.getElementById(`${grade}ExamDesc`);
        
        if (examBar && gradeData.examLuck) {
            examBar.style.width = `${gradeData.examLuck}%`;
            console.log(`✅ ${grade} 시험운 바 업데이트: ${gradeData.examLuck}%`);
        }
        
        if (examScore && gradeData.examLuck) {
            examScore.textContent = `${gradeData.examLuck}점`;
            console.log(`✅ ${grade} 시험운 점수 업데이트: ${gradeData.examLuck}점`);
        }
        
        if (examDesc && gradeData.examDescription) {
            examDesc.textContent = gradeData.examDescription;
            console.log(`✅ ${grade} 시험운 설명 업데이트`);
        }
        
        // 이성운 업데이트
        const romanceBar = document.getElementById(`${grade}RomanceBar`);
        const romanceScore = document.getElementById(`${grade}RomanceScore`);
        const romanceDesc = document.getElementById(`${grade}RomanceDesc`);
        
        if (romanceBar && gradeData.romanceLuck) {
            romanceBar.style.width = `${gradeData.romanceLuck}%`;
            console.log(`✅ ${grade} 이성운 바 업데이트: ${gradeData.romanceLuck}%`);
        }
        
        if (romanceScore && gradeData.romanceLuck) {
            romanceScore.textContent = `${gradeData.romanceLuck}점`;
            console.log(`✅ ${grade} 이성운 점수 업데이트: ${gradeData.romanceLuck}점`);
        }
        
        if (romanceDesc && gradeData.romanceDescription) {
            romanceDesc.textContent = gradeData.romanceDescription;
            console.log(`✅ ${grade} 이성운 설명 업데이트`);
        }
    });
    
    // 종합 분석 업데이트
    if (data.summary) {
        const examTrendEl = document.getElementById('examTrendSummary');
        const romanceTrendEl = document.getElementById('romanceTrendSummary');
        
        if (examTrendEl && data.summary.examTrend) {
            examTrendEl.textContent = data.summary.examTrend;
            console.log('✅ 시험운 종합 분석 업데이트');
        }
        
        if (romanceTrendEl && data.summary.romanceTrend) {
            romanceTrendEl.textContent = data.summary.romanceTrend;
            console.log('✅ 이성운 종합 분석 업데이트');
        }
    }
    
    console.log('✅ 섹션 5 표시 완료');
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