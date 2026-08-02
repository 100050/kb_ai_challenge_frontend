# 프론트엔드 로컬 실행

이 문서는 React/Vite 프론트엔드만 로컬에서 실행하는 방법을 설명합니다.
백엔드는 별도 저장소에서 `http://localhost:8080`으로 실행해야 합니다.

## 준비 사항

- Node.js
- npm

## 실행

`frontend/` 디렉터리에서 다음 명령을 실행합니다.

```bash
./run-local.sh
```

스크립트는 `.env`가 없으면 `.env.example`을 복사하고, npm 패키지를 설치한
뒤 Vite 개발 서버를 시작합니다.

- 프론트엔드: <http://localhost:5173>
- 기본 API 경로: `/api/v1`

Vite 개발 서버는 `/api` 요청을 `http://127.0.0.1:8080`의 백엔드로
전달합니다. 다른 백엔드를 사용하려면 `.env`의 `VITE_API_BASE_URL`을
변경합니다. `VITE_` 환경변수는 브라우저 번들에 포함되므로 비밀값을 넣지
않습니다.

스크립트를 사용하지 않을 때는 다음 명령으로 실행할 수 있습니다.

```bash
npm install
npm run dev
```

종료하려면 실행 중인 터미널에서 `Ctrl+C`를 누릅니다.
