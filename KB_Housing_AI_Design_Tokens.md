# KB 청년 주거 금융 도우미 디자인 토큰

이 문서는 제공된 5개 서비스 화면을 기준으로 정리한 Figma용 색상 및 폰트 가이드입니다. 스크린샷의 압축과 안티앨리어싱으로 생긴 근접 색상은 대표 색상으로 통합했습니다.

## 1. Color Palette

### Brand Colors

| Figma Style | HEX | 용도 |
|---|---|---|
| `Brand/Primary` | `#FDC70F` | 주요 버튼, 진행률, 핵심 강조 |
| `Brand/Primary-Strong` | `#F1B407` | 호버, 진한 강조, 강조 아이콘 |
| `Brand/Primary-Light` | `#F9E6A8` | 선택된 메뉴 및 카드 배경 |
| `Brand/Primary-Pale` | `#FFF8E2` | 강조 영역의 연한 배경 |
| `Brand/Primary-Border` | `#F7DFA4` | 선택 카드와 강조 영역 테두리 |

> 화면별 대표 노란색은 `#FDC70F`부터 `#FDCC1D` 사이로 보이며, 일관성을 위해 `#FDC70F`로 통일합니다.

### Neutral Colors

| Figma Style | HEX | 용도 |
|---|---|---|
| `Neutral/900` | `#1D1D1E` | 제목, 핵심 수치 |
| `Neutral/800` | `#282828` | 강조 본문 |
| `Neutral/700` | `#636363` | 일반 본문 |
| `Neutral/500` | `#A2A3A4` | 부가 설명, 비활성 상태 |
| `Neutral/300` | `#D9DADB` | 테두리, 구분선 |
| `Neutral/200` | `#ECEDEE` | 입력창과 진행바 배경 |
| `Neutral/100` | `#F5F5F5` | 보조 영역 배경 |
| `Neutral/50` | `#FAFAFA` | 페이지 배경 |
| `Neutral/White` | `#FFFFFF` | 카드 배경 |

### Semantic Colors

| Figma Style | Main | Light Background | 용도 |
|---|---|---|---|
| `Semantic/Success` | `#1AA053` | `#EAF7EF` | 합리적, 안정, 추천 |
| `Semantic/Warning` | `#F1A900` | `#FFF6DD` | 조건부, 주의 |
| `Semantic/Danger` | `#EA5A59` | `#FDEBEB` | 비쌈, 위험, 비추천 |
| `Semantic/Info` | `#3B82B7` | `#EAF4FA` | 정보 및 AI 안내 |

### 아키텍처 다이어그램 색상 규칙

| 요소 | 색상 |
|---|---|
| 일반 데이터 흐름 | `#A2A3A4` |
| 핵심 사용자 요청 | `#F1B407` |
| AI 요청 및 응답 | `#3B82B7` |
| 추천 및 정상 결과 | `#1AA053` |
| 오류 및 위험 흐름 | `#EA5A59` |
| 전체 배경 | `#FAFAFA` |
| 구성요소 카드 | `#FFFFFF` |
| AI 분석 영역 | `#FFF8E2` |

## 2. Typography

### Font Family

- 기본 권장: `Pretendard`
- Figma에서 Pretendard를 사용할 수 없을 때: `Noto Sans KR`
- 보조 후보: `SUIT`, `Spoqa Han Sans Neo`
- 한 문서에서는 한글·영문 모두 동일한 Font Family를 사용합니다.

### Pretendard 설치

1. Pretendard의 `PretendardVariable.ttf`를 설치합니다.
2. Windows에서는 가능하면 **모든 사용자용으로 설치**합니다.
3. Figma 데스크톱 앱을 완전히 종료한 뒤 다시 실행합니다.
4. Figma 웹을 사용한다면 Figma Font Installer가 필요합니다.

### Type Scale

| Figma Style | Size / Line Height | Weight | 용도 |
|---|---:|---:|---|
| `Display/Large` | `44 / 58` | ExtraBold `800` | 랜딩 페이지 메인 문구 |
| `Heading/H1` | `32 / 42` | Bold `700` | 페이지 제목 |
| `Heading/H2` | `24 / 34` | Bold `700` | 분석 영역과 큰 카드 제목 |
| `Heading/H3` | `20 / 28` | SemiBold `600` | 소제목 |
| `Body/Large` | `18 / 30` | Regular `400` | 랜딩 설명 |
| `Body/Medium` | `16 / 26` | Regular `400` | 일반 본문 |
| `Body/Small` | `14 / 22` | Regular `400` | 부가 설명 |
| `Label/Medium` | `15 / 20` | SemiBold `600` | 입력 항목과 버튼 |
| `Caption` | `12 / 18` | Medium `500` | 단위와 보조 상태 |
| `Metric/Large` | `28 / 36` | Bold `700` | 금액과 주요 분석 수치 |

### 아키텍처 다이어그램 권장 폰트

| 요소 | 설정 |
|---|---|
| 전체 제목 | `28px / Bold 700` |
| 영역 제목 | `20px / Bold 700` |
| 구성요소 이름 | `17px / SemiBold 600` |
| 구성요소 설명 | `13px / Regular 400` |
| 화살표 라벨 | `13px / Medium 500` |

### Typography Rules

- 제목에는 `Neutral/900`을 사용합니다.
- 본문에는 `Neutral/700`을 사용합니다.
- 부가 설명과 비활성 텍스트에는 `Neutral/500`을 사용합니다.
- 중요한 금액과 분석 결과는 Bold로 강조합니다.
- 성공·경고·위험 텍스트는 해당 Semantic Color를 사용합니다.
- 본문에 ExtraBold를 남용하지 않습니다.

## 3. Figma Style Structure

```text
Colors
├─ Brand
│  ├─ Primary
│  ├─ Primary-Strong
│  ├─ Primary-Light
│  ├─ Primary-Pale
│  └─ Primary-Border
├─ Neutral
│  ├─ 900
│  ├─ 800
│  ├─ 700
│  ├─ 500
│  ├─ 300
│  ├─ 200
│  ├─ 100
│  ├─ 50
│  └─ White
└─ Semantic
   ├─ Success
   ├─ Warning
   ├─ Danger
   └─ Info

Typography
├─ Display/Large
├─ Heading/H1
├─ Heading/H2
├─ Heading/H3
├─ Body/Large
├─ Body/Medium
├─ Body/Small
├─ Label/Medium
├─ Caption
└─ Metric/Large
```

## 4. Quick Reference

```text
Primary Yellow  #FDC70F
Success Green   #1AA053
Warning Orange  #F1A900
Danger Red      #EA5A59
Info Blue       #3B82B7
Main Text       #1D1D1E
Body Text       #636363
Muted Text      #A2A3A4
Border          #D9DADB
Page Background #FAFAFA
Card Background #FFFFFF

Font            Pretendard
Fallback Font   Noto Sans KR
```
