# 왼손잡이해방연대 아지트

와! 도커로 한번에 실행할 수 있는 가정용 아지트!

## 실행 방법

도커 및 docker-compose를 필요로 한다. example.env를 참고하여 .env 파일을 작성한다.

```sh
# 빌드
docker compose build

# 서버 실행
docker compose up -d

# 디비 마이그레이션
docker compose exec -iT db psql -Ublog < web/migbase.sql
docker compose exec next npx node-pg-migrate up
```

## 개발 환경 설정

web/README.md를 참고하여 설정한다.

개발중에는 `yarn dev & yarn pg:dev`를 돌려놓는다.
