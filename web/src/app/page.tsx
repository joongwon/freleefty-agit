import { getDB } from "@/db";
import * as ArticleList from "@/components/ArticleList";
import styles from "./page.module.scss";
import classnames from "classnames/bind";

const cx = classnames.bind(styles);

export default async function Intro() {
  const db = getDB();
  const articles = await db.listPopularArticles();
  return (
    <main className={cx("intro")}>
      {contents}
      <ArticleList.Container>
        {articles.map((article) => (
          <ArticleList.Item key={article.id} article={article} />
        ))}
      </ArticleList.Container>
      <p className={cx("disclaimer")}>(최근 14일 조회수 기준)</p>
    </main>
  );
}

const contents = (
  <article>
    <h1>소개</h1>
    <p>
      왼손잡이해방연대는 아지트를 띄울 정도의 낭만과 충동은 있지만 더 빨리 만들
      만큼 부지런하지는 못한 어떤 사람입니다.
    </p>
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
    <h2>인기 글</h2>
    <p>
      아래는 우리 아지트에서 가장 인기있는 글들입니다. 실시간 집계로 자동으로
      나열되는 목록이며, 제가 쓰지 않은 글이 포함되어있을 수도 있습니다.
    </p>
  </article>
);
