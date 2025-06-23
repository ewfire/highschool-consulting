# 🌟 사주 기반 AI 고등학교 진학 컨설팅 서비스

학생의 사주팔자 데이터를 LLM(Gemini) 기반 AI로 분석하여, 고등학교 3년간의 운의 흐름을 예측하고 이에 가장 적합한 고등학교 유형을 추천하는 웹 기반 컨설팅 서비스입니다.

## ✨ 주요 기능

- **개인 맞춤형 분석**: 사주 정보를 바탕으로 한 완전 개인화된 진학 가이드
- **AI 기반 추천**: Gemini AI를 활용한 정확하고 객관적인 학교 추천
- **3년 운세 예측**: 고등학교 재학 기간 동안의 학업운, 대인관계운, 건강운 분석
- **방향 분석**: 길한 방위에 위치한 학교 추천
- **시각적 결과**: 직관적인 차트와 나침반을 통한 결과 표시

## 🚀 시작하기

### 1. 파일 구조
```
.
├── index.html          # 메인 랜딩 페이지
├── input.html          # 사주 정보 입력 페이지
├── result.html         # 분석 결과 페이지
├── styles.css          # 전체 스타일시트
├── script.js           # JavaScript 기능
└── README.md           # 프로젝트 설명서
```

### 2. Gemini API 설정

1. [Google AI Studio](https://makersuite.google.com/app/apikey)에서 API 키를 발급받으세요.

2. `script.js` 파일의 첫 부분에서 API 키를 설정하세요:
```javascript
const GEMINI_API_KEY = 'YOUR_ACTUAL_API_KEY_HERE';
```

또는 브라우저 개발자 도구에서 다음 명령어로 임시 설정할 수 있습니다:
```javascript
localStorage.setItem('geminiApiKey', 'YOUR_API_KEY');
```

### 3. 서버 실행

로컬 서버를 실행하여 CORS 문제를 방지하세요:

**Python 사용:**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -SimpleHTTPServer 8000
```

**Node.js 사용:**
```bash
npx http-server -p 8000
```

**Live Server (VS Code 확장):**
VS Code에서 Live Server 확장을 설치 후 `index.html`을 우클릭하여 "Open with Live Server" 선택

### 4. 접속

브라우저에서 `http://localhost:8000`으로 접속하세요.

## 🎨 UI/UX 특징

- **파스텔 톤 디자인**: 밝고 친근한 색상 조합
- **부드러운 곡선**: 모든 UI 요소에 둥근 모서리 적용
- **반응형 디자인**: 모바일과 데스크톱 모두 최적화
- **애니메이션 효과**: 별과 구름의 부유 애니메이션
- **그라데이션**: 모던한 그라데이션 배경과 버튼

## 🔮 분석 결과 포함 내용

### 1. 학교 추천 순위
- 영재고, 외국어고, 광역자사고, 자율형사립고, 일반고 중 추천
- 각 학교별 상세한 추천 이유와 사주 분석 근거 제공

### 2. 방향 분석
- 길한 방위 표시가 포함된 나침반
- 해당 방향이 길한 이유에 대한 설명

### 3. 3년간 운세 흐름
- 학업운, 대인관계운, 건강운의 연도별 변화
- 시각적 차트로 한눈에 확인 가능

### 4. 개인 특성 분석
- 학습 스타일
- 사회성 경향
- 특별한 재능
- 주의사항

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **AI**: Google Gemini API
- **Design**: 반응형 웹 디자인, CSS Grid, Flexbox
- **Charts**: HTML5 Canvas를 이용한 커스텀 차트

## 📱 지원 브라우저

- Chrome (권장)
- Firefox
- Safari
- Edge

## ⚠️ 주의사항

1. **API 키 보안**: 실제 배포시 환경변수나 서버사이드에서 API 키를 관리하세요.
2. **CORS 정책**: 로컬에서 테스트시 반드시 로컬 서버를 사용하세요.
3. **데이터 보호**: 개인정보는 브라우저 로컬 스토리지에 임시 저장되며, 페이지 새로고침시 삭제됩니다.

## 🔧 개발자 도구

### API 키 동적 설정
브라우저 콘솔에서 다음 함수를 사용하여 API 키를 설정할 수 있습니다:
```javascript
setApiKey('YOUR_NEW_API_KEY');
```

### 데모 모드
API 키가 설정되지 않거나 오류가 발생할 경우, 자동으로 데모 데이터를 사용합니다.

## 📄 라이선스

이 프로젝트는 교육 및 개인 용도로 자유롭게 사용 가능합니다.

## 🤝 기여하기

버그 리포트나 기능 제안은 이슈로 등록해주세요.

---

💫 **"미래의 나를 위한 첫걸음, 사주로 찾는 최적의 고등학교!"** ✨ 