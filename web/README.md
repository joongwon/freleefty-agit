# 왼손잡이해방연대 아지트 웹 프론트엔드

Next.js로 구성함.

## 도커 없이 실행하는 방법

Node.js, yarn, PostgreSQL 서버 및 클라이언트가 필요하다. 루트의 example.env 파일을 참고하여 이 디렉토리에 .env 파일을 작성한다.

```sh
# 패키지 설치
yarn install

# 마이그레이션
psql < migbase.sql
yarn mig:prod

# 개발 서버 실행
yarn dev
```

## 설명이 필요한 파일

- migbase.sql : 현 마이그레이션 시스템 직전의 디비 스키마. 해당 스키마에서 `node-pg-migrate`로 마이그레이션 가능하다.
- .env : 깃에는 안 들어있지만 도커 없이 실행하려면 필요하다. 루트 디렉토리의 example.env를 따르면 된다. 없으면 첫번째 페이지를 렌더링할 때 친절한 메시지와 함께 터진다.
- public/files : .env에서 `UPLOAD_DIR=./upload`로 설정하면 파일 업로드가 현 디렉토리 내의 upload 디렉토리로 올라온다. 여기에 `STATIC_URL=http://localhost:3000/files`로 설정하면 될 것이다. 대충 그렇게 하면 됐었다.
