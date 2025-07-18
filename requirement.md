# C2C (Cursor to Claude) Requirements

## 프로젝트 개요
Cursor IDE의 규칙 파일들을 Claude AI가 이해할 수 있는 마크다운 형식으로 변환하는 CLI 도구

## 핵심 기능

### 1. 파일 탐색 및 읽기
- 현재 디렉토리부터 재귀적으로 `.cursor` 디렉토리 탐색
- 각 `.cursor` 디렉토리와 그 하위 디렉토리 내의 모든 `*.mdc` 파일 검색 (중첩된 디렉토리 포함)
- 발견된 모든 파일의 내용을 읽어 메모리에 로드
- 처리된 파일의 경로와 총 개수를 콘솔에 출력

### 2. 파일 변환 및 저장
- 읽어온 `.mdc` 파일들을 `c2c-rules` 디렉토리에 구조화하여 저장
- 원본 디렉토리 구조를 고려한 폴더 구조 생성
- 각 파일은 `[원본파일명].md` 형식으로 저장
- 모든 변환된 파일을 참조하는 `_root.md` 인덱스 파일 생성

## 기술 스택
- **패키지 매니저**: pnpm
- **언어**: TypeScript
- **CLI 프레임워크**: Commander.js
- **아키텍처**: Layered Architecture

## 아키텍처 설계

### Layered Architecture 구조
```
src/
├── presentation/     # CLI 인터페이스 계층
│   └── cli.ts       # Commander.js CLI 진입점
├── application/      # 비즈니스 로직 계층
│   └── services/    # 핵심 서비스
│       ├── FileExplorerService.ts
│       ├── FileConverterService.ts
│       └── RootFileGeneratorService.ts
├── domain/          # 도메인 모델 계층
│   └── models/      # 데이터 구조
│       └── FileInfo.ts
└── infrastructure/  # 인프라 계층
    └── utils/       # 파일 시스템 유틸리티
        └── FileSystemUtils.ts
```

## 실행 시나리오

1. 사용자가 `npx @vooster/c2c` 명령 실행
2. 현재 디렉토리부터 모든 `.cursor` 디렉토리 탐색
3. 각 `.cursor` 디렉토리와 그 하위 디렉토리 내의 `*.mdc` 파일 발견 (재귀적 탐색)
4. 발견된 파일들의 경로와 총 개수 출력
5. `c2c-rules` 디렉토리 생성 (존재하지 않을 경우)
6. 원본 구조를 반영한 하위 디렉토리 생성
7. 각 `.mdc` 파일을 `.md` 확장자로 변환하여 저장
8. 모든 변환된 파일 목록을 포함한 `_root.md` 생성

## 출력 예시

### 콘솔 출력
```
Scanning for .cursor directories...

Found 5 .mdc files:
- ./project1/.cursor/rules.mdc
- ./project1/.cursor/components/ui-rules.mdc
- ./project2/.cursor/config.mdc
- ./project2/.cursor/modules/api/api-guidelines.mdc
- ./project2/.cursor/guidelines.mdc

Converting files to c2c-rules directory...
✓ Created c2c-rules/project1/rules.md
✓ Created c2c-rules/project1/components/ui-rules.md
✓ Created c2c-rules/project2/config.md
✓ Created c2c-rules/project2/modules/api/api-guidelines.md
✓ Created c2c-rules/project2/guidelines.md
✓ Generated c2c-rules/_root.md

Conversion completed successfully!
```

### _root.md 구조
```markdown
# Cursor Rules Collection

This file contains references to all converted cursor rules.

## Files

### project1
- rules: @project1/rules.md
- components/ui-rules: @project1/components/ui-rules

### project2
- config: @project2/config.md
- modules/api/api-guidelines: @project2/modules/api/api-guidelines.md
- guidelines: @project2/guidelines.md

Total files: 5
```

## 개발 단계

1. **프로젝트 초기화**
   - pnpm 프로젝트 생성
   - TypeScript 설정
   - Commander.js 의존성 추가

2. **기본 구조 구현**
   - Layered Architecture 디렉토리 구조 생성
   - 기본 타입 및 인터페이스 정의

3. **핵심 기능 구현**
   - 파일 탐색 서비스
   - 파일 변환 서비스
   - 루트 파일 생성 서비스

4. **CLI 통합**
   - Commander.js를 사용한 CLI 인터페이스
   - 에러 처리 및 사용자 피드백

5. **테스트 및 배포**
   - 단위 테스트
   - 통합 테스트
   - npm 패키지 배포 설정