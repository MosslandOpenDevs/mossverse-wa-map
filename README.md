# mossverse-wa-map

Mossverse WorkAdventure 맵 레포. [map-starter-kit](https://github.com/workadventure/map-starter-kit) 기반.

## 관련 레포

| 레포 | 용도 |
|---|---|
| [mossverse-wa-infra](https://github.com/mikim/mossverse-wa-infra) | 서버 인프라 운영 문서 |
| [map-starter-kit (공식)](https://github.com/workadventure/map-starter-kit) | 원본 스타터킷 |

## 접속

| 환경 | URL |
|---|---|
| 메인 맵 | `https://dev.wa.moss.land/~/mossverse/office.wam` |
| 회의실 맵 | `https://dev.wa.moss.land/~/mossverse/conference.wam` |

---

## 로컬 개발

```bash
npm install
npm run dev
```

`http://localhost:5173`에서 맵 미리보기. 맵 스크립트는 `src/` 디렉토리에 작성.

## 맵 파일 구조

```
mossverse-wa-map/
├── office.tmj              ← 메인 오피스 맵
├── conference.tmj          ← 회의실 맵
├── tilesets/               ← 타일셋 이미지 (PNG)
├── src/
│   └── main.ts             ← 맵 스크립트 (브라우저에서 실행)
├── app/
│   └── app.ts              ← 서버 진입점 (수정하지 않음)
├── .env                    ← UPLOAD_MODE, MAP_STORAGE_URL 등
├── .env.secret             ← MAP_STORAGE_API_KEY (gitignore 대상)
└── .github/workflows/
    └── build-and-deploy.yml ← CI/CD 자동 배포
```

> 맵 추가: 루트에 `.tmj` 파일 복사 후 편집. 맵 스크립트는 반드시 `src/`에 작성해야 Vite가 정상 빌드함.

---

## 배포

### 자동 배포 (CI/CD)

`master` 브랜치에 push하면 GitHub Actions가 자동으로 빌드 → map-storage 업로드.

#### GitHub Secrets 설정

레포 → Settings → Secrets and variables → Actions:

| Name | Value |
|---|---|
| `MAP_STORAGE_API_KEY` | 서버 SECRET_KEY 값 |
| `MAP_STORAGE_URL` | `https://dev.wa.moss.land/map-storage/` (또는 `.env`에 설정) |
| `UPLOAD_DIRECTORY` | `mossverse` (또는 `.env`에 설정) |

> `MAP_STORAGE_API_KEY`는 반드시 GitHub Secrets에서만 관리. 레포에 커밋하지 않는다.
> `MAP_STORAGE_URL`과 `UPLOAD_DIRECTORY`는 Secrets에 없으면 `.env`에서 읽고, 둘 다 없으면 자동 생성된다.

### 수동 배포

```bash
npm run upload
```

빌드 + 업로드를 한 번에 실행. 업로드만 하려면:

```bash
npm run upload-only
```

### 로컬 `.env` 설정

```
UPLOAD_MODE=MAP_STORAGE
MAP_STORAGE_URL=https://dev.wa.moss.land/map-storage/
UPLOAD_DIRECTORY=mossverse
```

`.env.secret` (gitignore 대상):

```
MAP_STORAGE_API_KEY=서버_SECRET_KEY값
```

---

## 스크립트 목록

| 명령어 | 설명 |
|---|---|
| `npm run dev` | 로컬 개발 서버 (Vite, HMR) |
| `npm run buildmap` | 맵 빌드 (dist/ 생성) |
| `npm run upload` | 빌드 + map-storage 업로드 |
| `npm run upload-only` | 빌드 없이 업로드만 |

---

## 맵 편집 참고

- [맵 빌딩 튜토리얼](https://docs.workadventu.re/map-building/tiled-editor/)
- [맵 업로드 문서](https://docs.workadventu.re/map-building/tiled-editor/publish/wa-hosted)
- [Scripting API](https://docs.workadventu.re/developer/map-scripting/)
- [map-starter-kit README](https://github.com/workadventure/map-starter-kit) — 프로젝트 구조, 라이선스, 타일셋 크레딧 관련 상세 내용