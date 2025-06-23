// Gemini API Configuration
const GEMINI_API_KEY = 'AIzaSyBY1aPCt5gkJr7m8BCuTRUjtLl5PWHO4Dg'; // 실제 사용시 환경변수로 관리
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

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
    window.location.href = 'input.html';
}

// Initialize page based on current location
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'input.html' || currentPage === '') {
        initializeInputPage();
    } else if (currentPage === 'result.html') {
        initializeResultPage();
    }
});

// Input page initialization
function initializeInputPage() {
    setupDateSelectors();
    setupFormSubmission();
}

// Setup date selectors
function setupDateSelectors() {
    const currentYear = new Date().getFullYear();
    const birthYearSelect = document.getElementById('birthYear');
    const birthMonthSelect = document.getElementById('birthMonth');
    const birthDaySelect = document.getElementById('birthDay');

    if (!birthYearSelect) return;

    // 년도 옵션 생성 (1950 ~ 현재 년도)
    for (let year = currentYear; year >= 1950; year--) {
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

    // 일 옵션 생성 (월 선택시 동적으로 업데이트)
    function updateDays() {
        const year = parseInt(birthYearSelect.value);
        const month = parseInt(birthMonthSelect.value);
        
        if (!year || !month) return;

        const daysInMonth = new Date(year, month, 0).getDate();
        birthDaySelect.innerHTML = '<option value="">일</option>';

        for (let day = 1; day <= daysInMonth; day++) {
            const option = document.createElement('option');
            option.value = day;
            option.textContent = day + '일';
            birthDaySelect.appendChild(option);
        }
    }

    birthYearSelect.addEventListener('change', updateDays);
    birthMonthSelect.addEventListener('change', updateDays);
}

// Setup form submission
function setupFormSubmission() {
    const form = document.getElementById('sajuForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const userData = {
            name: formData.get('name'),
            birthYear: formData.get('birthYear'),
            birthMonth: formData.get('birthMonth'),
            birthDay: formData.get('birthDay'),
            birthTime: formData.get('birthTime'),
            gender: formData.get('gender')
        };

        // 폼 검증
        if (!validateForm(userData)) {
            return;
        }

        // 사용자 데이터 저장
        currentUserData = userData;
        localStorage.setItem('sajuUserData', JSON.stringify(userData));

        // 로딩 화면 표시
        showLoadingScreen();

        try {
            // AI 분석 수행
            const analysisResult = await performSajuAnalysis(userData);
            
            // 결과 저장
            localStorage.setItem('sajuAnalysisResult', JSON.stringify(analysisResult));
            
            // 결과 페이지로 이동
            setTimeout(() => {
                window.location.href = 'result.html';
            }, 2000);
            
        } catch (error) {
            console.error('분석 중 오류 발생:', error);
            hideLoadingScreen();
            alert('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
    });
}

// Form validation
function validateForm(userData) {
    if (!userData.name || userData.name.trim() === '') {
        alert('이름을 입력해주세요.');
        return false;
    }
    
    if (!userData.birthYear || !userData.birthMonth || !userData.birthDay) {
        alert('생년월일을 모두 선택해주세요.');
        return false;
    }
    
    if (!userData.birthTime) {
        alert('출생시를 선택해주세요.');
        return false;
    }
    
    if (!userData.gender) {
        alert('성별을 선택해주세요.');
        return false;
    }
    
    return true;
}

// Show/hide loading screen
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
    }
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
}

// Perform Saju Analysis using Gemini API
async function performSajuAnalysis(userData) {
    // API 키가 설정되지 않은 경우 데모 데이터 사용
    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
        return generateDemoAnalysis(userData);
    }

    const prompt = `
당신은 사주명리학 전문가입니다. 다음 사주 정보를 바탕으로 고등학교 진학 컨설팅을 해주세요.

사주 정보:
- 이름: ${userData.name}
- 생년월일: ${userData.birthYear}년 ${userData.birthMonth}월 ${userData.birthDay}일  
- 출생시: ${userData.birthTime}
- 성별: ${userData.gender}

분석 조건:
1. 추천 학교는 3개 (1순위~3순위), 비추천 학교는 2개 (1순위~2순위)로 구성
2. 반드시 일반고 유형 중 하나는 포함할 것 (일반고는 가장 많은 학생이 진학하는 현실적 선택지)
3. ${userData.gender === '남성' ? '남고, 남녀공학 중심으로' : '여고, 남녀공학 중심으로'} 분석
4. 각 학교별 사주 분석 근거를 구체적으로 제시
5. 추천/비추천 순위는 사주 분석 결과에 따른 적합도 순으로 배치

반드시 아래 JSON 형식으로만 답변하고, JSON 이외의 다른 텍스트는 절대 포함하지 마세요:

{
  "summary": "이 학생의 사주 특성과 추천 학교 유형 요약 (150자 내외)",
  "recommendedSchools": [
    {
      "rank": 1,
      "type": "1순위 추천 학교",
      "reason": "가장 적합한 이유와 사주 분석 근거"
    },
    {
      "rank": 2,
      "type": "2순위 추천 학교", 
      "reason": "두 번째로 적합한 이유와 사주 분석 근거"
    },
    {
      "rank": 3,
      "type": "3순위 추천 학교 (일반고 포함 권장)",
      "reason": "세 번째로 적합한 이유와 사주 분석 근거"
    }
  ],
  "notRecommendedSchools": [
    {
      "rank": 1,
      "type": "가장 부적합한 학교",
      "reason": "가장 부적합한 이유와 사주 분석 근거"
    },
    {
      "rank": 2,
      "type": "두 번째로 부적합한 학교",
      "reason": "두 번째로 부적합한 이유와 사주 분석 근거"
    }
  ],
  "direction": {
    "bestDirection": "길한방향(북/남/동/서/북동/남동/북서/남서 중 1개)",
    "title": "방향의 의미",
    "explanation": "해당 방향이 길한 사주학적 이유"
  },
  "fortuneFlow": {
    "grade1": {"academic": 70, "social": 80, "health": 75},
    "grade2": {"academic": 85, "social": 70, "health": 90}, 
    "grade3": {"academic": 90, "social": 85, "health": 80}
  },
  "personalTraits": {
    "learningStyle": "학습 스타일 분석",
    "socialTendency": "사회성 분석", 
    "specialTalent": "특별한 재능",
    "cautions": "주의사항"
  }
}

학교 유형 (반드시 이 중에서 선택):
- 과학영재학교
- 외국어고  
- 자율형사립고
- 광역자사고
- 특목고
- 일반고(남녀공학) 
- 일반고(${userData.gender === '남성' ? '남고' : '여고'})
- 일반고(${userData.gender === '남성' ? '여고는 해당 성별 아니므로 선택 금지' : '남고는 해당 성별 아니므로 선택 금지'})
- 예술고
- 체육고
- 마이스터고

중요: 
- 일반고 유형 중 최소 1개는 반드시 추천 또는 비추천에 포함하세요
- 순위는 사주 분석 결과 적합도에 따라 정확히 매기세요

JSON만 반환하세요:`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API 호출 실패: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const generatedText = data.candidates[0].content.parts[0].text;
        
        // JSON 문자열 정리 (백틱, 코드블록 제거)
        let cleanedText = generatedText
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .replace(/^\s*[\`\'\"]*/g, '')
            .replace(/[\`\'\\"]*\s*$/g, '')
            .trim();
        
        // JSON 파싱 시도
        try {
            const analysisResult = JSON.parse(cleanedText);
            
            // 결과 검증
            if (analysisResult.recommendedSchools && analysisResult.notRecommendedSchools) {
                return analysisResult;
            } else {
                return generateDemoAnalysis(userData);
            }
        } catch (parseError) {
            // 파싱 실패시 데모 데이터 반환
            return generateDemoAnalysis(userData);
        }

    } catch (error) {
        // API 오류시 데모 데이터 반환
        return generateDemoAnalysis(userData);
    }
}

// Generate demo analysis for testing
function generateDemoAnalysis(userData) {
    const directions = ['북쪽', '남쪽', '동쪽', '서쪽', '북동쪽', '남동쪽', '북서쪽', '남서쪽'];
    const randomDirection = directions[Math.floor(Math.random() * directions.length)];
    
    // 성별에 따른 일반고 유형 결정
    const genderBasedSchools = {
        '남성': ['일반고 (남고)', '일반고 (남녀공학)'],
        '여성': ['일반고 (여고)', '일반고 (남녀공학)']
    };
    
    const availableGeneralSchools = genderBasedSchools[userData.gender] || ['일반고 (남녀공학)'];
    const notRecommendedGeneralSchool = availableGeneralSchools[Math.floor(Math.random() * availableGeneralSchools.length)];
    
    // 성별별 맞춤 분석 메시지
    const genderSpecificAnalysis = {
        '남성': {
            schoolType: userData.gender === '남성' ? '일반고 (남고)' : '일반고 (여고)',
            reason: userData.gender === '남성' 
                ? '현재 사주에서 금(金)의 기운이 강하여 집중력과 경쟁심이 뛰어난 편입니다. 남고의 경쟁적이면서도 단합된 분위기에서 더욱 성장할 수 있을 것으로 보이나, 다양한 관점을 접할 기회가 제한될 수 있어 신중한 선택이 필요합니다.'
                : '사주상 음(陰)의 기운이 조화롭게 배치되어 있어 여고의 안정적이고 세심한 교육 환경이 잘 맞을 것으로 보이나, 다양한 시각을 기를 기회가 부족할 수 있습니다.'
        },
        '여성': {
            schoolType: userData.gender === '여성' ? '일반고 (여고)' : '일반고 (남고)',
            reason: userData.gender === '여성'
                ? '사주상 음(陰)의 기운이 조화롭게 배치되어 있어 여고의 안정적이고 세심한 교육 환경이 잘 맞을 것으로 보이나, 다양한 시각을 기를 기회가 부족할 수 있어 신중한 선택이 필요합니다.'
                : '현재 사주에서 양(陽)의 기운이 강하여 집중력과 경쟁심이 뛰어난 편입니다. 남고의 경쟁적이면서도 단합된 분위기가 도움이 될 수 있으나, 다양한 관점을 접할 기회가 제한될 수 있습니다.'
        }
    };
    
    return {
        summary: `${userData.name} 님은 ${userData.birthTime}에 태어나신 ${userData.gender}으로, 강한 학습 의지와 창의적 사고력을 가지고 계십니다. 특히 체계적인 학습 환경에서 뛰어난 성과를 보일 것으로 예상되어 영재고나 자율형사립고가 가장 적합합니다.`,
        recommendedSchools: [
            {
                type: '영재고 (과학영재학교)',
                reason: '사주에서 금(金)의 기운이 강하여 정밀하고 체계적인 사고를 선호하며, 과학과 수학 분야에서 뛰어난 재능을 발휘할 수 있습니다. 영재고의 심화 교육과정이 잠재력을 최대한 발현시킬 것입니다. 특히 고등학교 2학년에 학업운이 최고조에 달해 연구 활동에서 탁월한 성과를 거둘 수 있을 것으로 보입니다.'
            },
            {
                type: '자율형사립고',
                reason: '화(火)의 기운이 적절히 조화되어 있어 활발한 대인관계와 리더십을 발휘할 수 있으며, 자율형사립고의 다양한 프로그램을 통해 전인적 성장이 가능합니다. 3학년에 대인관계운이 상승하여 진로 설계와 대학 진학에 도움이 될 것입니다.'
            }
        ],
        notRecommendedSchools: [
            {
                type: '외국어고',
                reason: '현재 사주 구조상 언어 습득보다는 논리적 사고가 더 강한 편이며, 외국어고의 암기 위주 학습법이 본래 성향과 맞지 않을 수 있습니다. 또한 1학년 시기에 학습 스타일의 변화가 필요한 시점에서 혼란을 겪을 가능성이 높습니다.'
            },
            {
                type: notRecommendedGeneralSchool,
                reason: genderSpecificAnalysis[userData.gender].reason
            }
        ],
        favorableDirection: {
            direction: randomDirection,
            explanation: `${randomDirection} 방향은 오행에서 ${userData.name} 님의 본명궁과 조화를 이루어 학업운과 대인관계운을 상승시키는 길한 방위입니다. 이 방향에 위치한 학교에서 더욱 안정적이고 발전적인 학교생활을 할 수 있을 것입니다.`
        },
        fortuneTimeline: {
            year1: {academic: 85, social: 70, health: 80},
            year2: {academic: 90, social: 75, health: 85},
            year3: {academic: 80, social: 85, health: 90}
        },
        personalTraits: {
            learningStyle: '체계적이고 논리적인 학습을 선호하며, 단계별 접근을 통해 깊이 있는 이해를 추구합니다.',
            socialTendency: '신중하면서도 따뜻한 성격으로 진실한 우정을 중시하며, 필요시 리더십을 발휘할 수 있습니다.',
            specialTalent: '분석적 사고와 창의적 문제해결 능력이 뛰어나며, 특히 과학과 수학 분야에서 재능이 돋보입니다.',
            cautions: '완벽주의 성향이 강해 스트레스를 받을 수 있으니, 적절한 휴식과 취미 활동을 통해 균형을 유지하는 것이 중요합니다.'
        }
    };
}

// Result page initialization
function initializeResultPage() {
    const userData = JSON.parse(localStorage.getItem('sajuUserData'));
    const analysisResult = JSON.parse(localStorage.getItem('sajuAnalysisResult'));
    
    if (!userData || !analysisResult) {
        alert('분석 데이터가 없습니다. 다시 분석해주세요.');
        window.location.href = 'input.html';
        return;
    }
    
    displayAnalysisResult(userData, analysisResult);
}

// Display analysis result
function displayAnalysisResult(userData, result) {
    // 사용자 이름 표시
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = userData.name;
    }
    
    // 분석 요약 표시
    const analysisDescElement = document.getElementById('analysisDescription');
    if (analysisDescElement) {
        analysisDescElement.textContent = result.summary;
    }
    
    // 학교 추천 순위 표시
    displaySchoolRecommendations(result.recommendedSchools, result.notRecommendedSchools);
    
    // 방향 분석 표시 (API와 데모 형식 통일 처리)
    const directionData = result.direction || result.favorableDirection;
    if (directionData) {
        displayDirectionAnalysis(directionData);
    }
    
    // 운세 차트 표시 (API와 데모 형식 통일 처리)
    const fortuneData = result.fortuneFlow || result.fortuneTimeline;
    if (fortuneData) {
        displayFortuneChart(fortuneData);
    }
    
    // 개인 특성 표시
    if (result.personalTraits) {
        displayPersonalTraits(result.personalTraits);
    }
}

// Display school recommendations
function displaySchoolRecommendations(recommendedSchools, notRecommendedSchools) {
    const container = document.getElementById('schoolRecommendations');
    if (!container) return;
    
    container.innerHTML = '';
    
    // 추천 학교 섹션
    const recommendedSection = document.createElement('div');
    recommendedSection.className = 'recommendation-section';
    recommendedSection.innerHTML = `
        <h4 class="recommendation-subtitle">✅ 강력 추천하는 학교 (적합도 순)</h4>
    `;
    
    recommendedSchools.forEach((school, index) => {
        const rank = school.rank || (index + 1);
        const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}위`;
        
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
    
    // 비추천 학교 섹션
    const notRecommendedSection = document.createElement('div');
    notRecommendedSection.className = 'recommendation-section';
    notRecommendedSection.innerHTML = `
        <h4 class="recommendation-subtitle">❌ 권하지 않는 학교 (부적합도 순)</h4>
    `;
    
    notRecommendedSchools.forEach((school, index) => {
        const rank = school.rank || (index + 1);
        
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
    
    container.appendChild(recommendedSection);
    container.appendChild(notRecommendedSection);
}

// Display direction analysis
function displayDirectionAnalysis(directionData) {
    const titleElement = document.getElementById('directionTitle');
    const explanationElement = document.getElementById('directionExplanation');
    const pointerElement = document.getElementById('compassPointer');
    
    if (titleElement) {
        const direction = directionData.bestDirection || directionData.direction;
        titleElement.textContent = `${direction}이 당신에게 길한 방향입니다`;
    }
    
    if (explanationElement) {
        explanationElement.textContent = directionData.explanation;
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
    }
}

// Display fortune chart
function displayFortuneChart(fortuneData) {
    const canvas = document.getElementById('fortuneChart');
    if (!canvas) {
        return;
    }
    
    if (!fortuneData) {
        return;
    }
    
    // 반응형 캔버스 크기 설정
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;
    
    // 캔버스 크기 조정
    if (isSmallMobile) {
        canvas.width = Math.min(containerWidth - 20, 350);
        canvas.height = 250;
    } else if (isMobile) {
        canvas.width = Math.min(containerWidth - 40, 400);
        canvas.height = 300;
    } else {
        canvas.width = Math.min(containerWidth - 60, 800);
        canvas.height = 400;
    }
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // 캔버스 초기화
    ctx.clearRect(0, 0, width, height);
    
    // 차트 데이터 준비 (API와 데모 형식 모두 지원)
    const years = ['1학년', '2학년', '3학년'];
    let academic, social, health;
    
    if (fortuneData.grade1) {
        // API 응답 형식 (grade1, grade2, grade3)
        academic = [fortuneData.grade1.academic, fortuneData.grade2.academic, fortuneData.grade3.academic];
        social = [fortuneData.grade1.social, fortuneData.grade2.social, fortuneData.grade3.social];
        health = [fortuneData.grade1.health, fortuneData.grade2.health, fortuneData.grade3.health];
    } else if (fortuneData.year1) {
        // 데모 형식 (year1, year2, year3)
        academic = [fortuneData.year1.academic, fortuneData.year2.academic, fortuneData.year3.academic];
        social = [fortuneData.year1.social, fortuneData.year2.social, fortuneData.year3.social];
        health = [fortuneData.year1.health, fortuneData.year2.health, fortuneData.year3.health];
    } else {
        return;
    }
    
    // 반응형 차트 설정
    const margin = isMobile ? (isSmallMobile ? 50 : 60) : 80;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin;
    const stepX = chartWidth / (years.length - 1);
    
    // 배경 그리드
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
        const y = margin + (chartHeight * i / 10);
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(width - margin, y);
        ctx.stroke();
    }
    
    // Y축 라벨
    ctx.fillStyle = '#666';
    const fontSize = isSmallMobile ? '10px' : (isMobile ? '11px' : '12px');
    ctx.font = `${fontSize} Noto Sans KR`;
    ctx.textAlign = 'right';
    for (let i = 0; i <= 10; i++) {
        const value = 100 - (i * 10);
        const y = margin + (chartHeight * i / 10);
        ctx.fillText(value, margin - 10, y + 4);
    }
    
    // X축 라벨
    ctx.textAlign = 'center';
    years.forEach((year, index) => {
        const x = margin + (stepX * index);
        ctx.fillText(year, x, height - margin + (isSmallMobile ? 15 : 20));
    });
    
    // 선 그래프 그리기
    function drawLine(data, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = isMobile ? 2 : 3;
        ctx.beginPath();
        
        data.forEach((value, index) => {
            const x = margin + (stepX * index);
            const y = margin + chartHeight - (chartHeight * value / 100);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            // 점 표시
            ctx.fillStyle = color;
            ctx.beginPath();
            const radius = isMobile ? (isSmallMobile ? 3 : 4) : 5;
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        ctx.stroke();
    }
    
    // 각 운세 라인 그리기
    drawLine(academic, '#570df8');
    drawLine(social, '#37cdbe');
    drawLine(health, '#f000b8');
}

// Display personal traits
function displayPersonalTraits(traits) {
    const elements = {
        learningStyle: document.getElementById('learningStyle'),
        socialTendency: document.getElementById('socialTendency'),
        specialTalent: document.getElementById('specialTalent'),
        cautions: document.getElementById('cautions')
    };
    
    Object.keys(elements).forEach(key => {
        if (elements[key] && traits && traits[key]) {
            elements[key].textContent = traits[key];
        }
    });
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
            alert('링크가 클립보드에 복사되었습니다!');
        }).catch(() => {
            alert('링크 복사에 실패했습니다.');
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