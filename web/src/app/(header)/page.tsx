import * as Queries from "@/queries.sql";
import * as newdb from "@/newdb";
import * as ArticleList from "@/components/ArticleList";
import styles from "./page.module.scss";
import classnames from "classnames/bind";
import Link from "next/link";

export const dynamic = "force-dynamic";
const cx = classnames.bind(styles);

export default async function Intro() {
  const articles = await newdb.list(Queries.listPopularArticles, undefined);
  return (
    <main className={cx("intro")}>
      {contents}
      <ArticleList.Container>
        {articles.length > 0 ? (
          articles.map((article) => (
            <ArticleList.Item key={article.id} article={article} />
          ))
        ) : (
          <ArticleList.Empty>인기 있는 일지가 없습니다.</ArticleList.Empty>
        )}
      </ArticleList.Container>
      <p className={cx("disclaimer")}>(최근 14일 조회수 기준)</p>
      <p>
        <Link href="/articles" style={{ textDecoration: "underline" }}>
          최신 일지들
        </Link>
        도 둘러보세요.
      </p>
    </main>
  );
}

const contents = (
  <article>
    <h1>왼손잡이해방연대</h1>
    <p>아지트 주인장의 이름입니다. 오른손도 자주 씁니다.</p>
    <h1>아지트</h1>
    <p>
      아지트는 계속해서 만드는 중에 있습니다만은 아직 만들지 못한 부분에
      관해서는 <a href="https://blog.naver.com/freleefty">네이버 블로그</a>를
      병행하여 활용하고 있습니다. 가끔 사진을 올리거나, 아지트가 터지거나, 그
      외에 갑자기 네이버에 기대고 싶은 경우 그쪽에 글이 올라오기도 하니 충분히
      부지런하신 분들은 참고해보셔도 좋겠습니다.
    </p>
    <p>
      네이버로 로그인하시면 댓글과 일지를 쓸 수 있으니 한 발자국 남겨주시면
      감사하겠습니다.
    </p>
    <h2>인기 일지</h2>
    <p>
      아래는 우리 아지트에서 가장 인기있는 일지들입니다. 실시간 집계로 자동으로
      나열되는 목록이며, 제가 쓰지 않은 글이 포함되어있을 수도 있습니다.
    </p>
  </article>
);
