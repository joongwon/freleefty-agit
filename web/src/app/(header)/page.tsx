import * as Queries from "@/queries_sql";
import * as newdb from "@/newdb";
import * as ArticleList from "@/components/ArticleList";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Intro() {
  const articles = await newdb.list(Queries.listPopularArticles, undefined);
  return (
    <article className="prose">
      <h2>왼손잡이해방연대</h2>
      <p>아지트 주인장의 이름입니다. 오른손도 자주 씁니다.</p>
      <h2>아지트</h2>
      <p>
        아지트가 자리를 잡아갑니다. 이것저것 할일이 여전히 많지만, 그래도 이제는 즐겁게 떠들만한 곳인 것 같습니다.
      </p>
      <p>
        아지트가 삐걱대는 날에는 대피소를 방문해주세요. 새글을 바로바로 받고 싶으신 분들도 대피소를 추천합니다.
      </p>
      <ul>
        <li><a href="https://discord.gg/BxDNvqWQmf">왼손잡이해방연대 제1대피소</a>: 디스코드 서버입니다. 아지트새글알리미도 상주합니다.</li>
        <li><a href="https://blog.naver.com/freleefty">왼손잡이해방연대 제2대피소</a>: 네이버 블로그입니다. 삐걱임이 길어지면 글이 올라올지도 모릅니다.</li>
        <li><a href="https://github.com/joongwon/freleefty-agit/issues">건의함</a>: 깃허브 레포 이슈 트래커입니다. 아지트 기능 관련해서 건의하고 싶은 게 있다면 올려주십쇼.</li>
      </ul>
      <h2>인기 일지</h2>
      <p>
        아래는 우리 아지트에서 가장 인기있는 일지들입니다. 실시간 집계로
        자동으로 나열되는 목록이며, 제가 쓰지 않은 글이 포함되어있을 수도
        있습니다.
      </p>
      <ArticleList.Container>
        {articles.length > 0 ? (
          articles.map((article) => (
            <ArticleList.Item
              key={article.id}
              item={article}
              hrefPrefix="/articles"
            />
          ))
        ) : (
          <ArticleList.Message>인기 있는 일지가 없습니다.</ArticleList.Message>
        )}
      </ArticleList.Container>
      <p className="text-sm text-gray-500 text-right">
        (최근 14일 조회수 기준)
      </p>
      <p>
        <Link href="/articles">최신 일지들</Link>도 둘러보세요.
      </p>
    </article>
  );
}
