#!/usr/bin/env bash

set -Eeuo pipefail

FRONTEND_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v npm >/dev/null 2>&1; then
  echo "오류: 'npm' 명령을 찾을 수 없습니다." >&2
  exit 1
fi

cd "${FRONTEND_DIR}"

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "생성: .env"
fi

echo "프론트엔드 의존성을 확인합니다."
npm install

echo "프론트엔드 개발 서버를 시작합니다: http://localhost:5173"
exec npm run dev
