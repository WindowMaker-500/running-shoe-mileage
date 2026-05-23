# 러닝화 마일리지 PWA

스마트폰에서 앱처럼 사용할 수 있는 개인용 러닝화 수명관리 앱입니다.

## 주요 기능

- 러닝화 여러 개 등록
- 러닝할 때마다 날짜, 거리, 메모 입력
- 러닝화별 누적 km 자동 계산
- 권장 수명 대비 사용률 표시
- 85% 이상: 교체 준비
- 100% 이상: 교체 권장
- 러닝화 은퇴 처리
- 러닝 기록 삭제
- CSV 내보내기
- JSON 백업/복원
- PWA 홈 화면 설치 지원
- 오프라인 캐시 기본 지원

## 실행 방법

```bash
npm install
npm run dev
```

개발 서버가 뜨면 브라우저에서 표시되는 주소로 접속합니다.

같은 와이파이에 있는 스마트폰에서 테스트하려면 PC의 내부 IP 주소와 Vite 포트로 접속하면 됩니다.

예:

```text
http://192.168.0.10:5173
```

## 빌드

```bash
npm run build
npm run preview
```

## 스마트폰 설치 방법

### Android Chrome

1. 배포된 주소 접속
2. 오른쪽 위 메뉴 ⋮
3. 홈 화면에 추가

### iPhone Safari

1. 배포된 주소 접속
2. 공유 버튼
3. 홈 화면에 추가

## 중요 주의사항

기본 데이터는 해당 스마트폰 브라우저의 `localStorage`에 저장됩니다.

따라서 다음 상황에서는 데이터가 사라질 수 있습니다.

- 브라우저 데이터 삭제
- 휴대폰 변경
- 앱/브라우저 초기화
- 사설 모드 사용

오래 사용할 경우 앱 안의 `백업 / 복원` 메뉴에서 JSON 백업 파일을 주기적으로 저장하세요.

## 배포 추천

개인용이면 아래 중 하나가 쉽습니다.

- Vercel
- Netlify
- GitHub Pages
- 개인 NAS 또는 사내 서버

PWA 설치와 서비스워커는 일반적으로 `https` 또는 `localhost` 환경에서 정상 동작합니다.


## GitHub Pages 배포 방법

이 패키지는 저장소 이름을 `running-shoe-mileage` 으로 만들었을 때 바로 배포되도록 설정되어 있습니다.

배포 주소 예:

```text
https://<GitHub아이디>.github.io/running-shoe-mileage/
```

저장소 이름을 다르게 만들면 `vite.config.js`의 `base` 값을 반드시 바꾸세요.

예를 들어 저장소 이름이 `shoe-app`이면:

```js
base: "/shoe-app/",
```

### 배포 순서

```bash
git init
git add .
git commit -m "Initial running shoe mileage PWA"
git branch -M main
git remote add origin https://github.com/<GitHub아이디>/running-shoe-mileage.git
git push -u origin main
```

그 다음 GitHub 저장소에서:

1. Settings
2. Pages
3. Build and deployment
4. Source를 `GitHub Actions`로 선택

이후 `Actions` 탭에서 배포가 끝나면 Pages 주소가 표시됩니다.
