"use client";

import { createWebhook, listWebhooks, deleteWebhook } from "@/actions/webhooks";
import {
  updateUserName,
  getUserNewArticleNotify,
  setUserNewArticleNotify,
} from "@/actions/users";
import { gAuthState, setProfile } from "@/auth";
import { Category, User } from "@/types";
import { useHookstate } from "@hookstate/core";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { createCategory, deleteCategory, listCategory, updateCategory } from "@/actions/category";

export default function SettingsPage() {
  const auth = useHookstate(gAuthState);

  switch (auth.value.type) {
    case "loading":
      return (
        <main>
          <p>사용자 확인중...</p>
        </main>
      );
    case "anon":
      return (
        <main>
          <p>로그인이 필요합니다.</p>
        </main>
      );
    case "login":
      return (
        <main>
          <h1 className="text-2xl font-bold">설정</h1>
          <NameChangeForm
            key={auth.value.profile.id}
            token={auth.value.token}
            profile={auth.value.profile}
          />
          <NewArticleNotifyForm token={auth.value.token} />
          {auth.value.profile.role === "admin" && (
            <>
              <WebhookForm token={auth.value.token} />
              <CategoryForm token={auth.value.token} />
            </>
          )}
        </main>
      );
  }
}

function NameChangeForm(p: { token: string; profile: User }) {
  const [name, setName] = useState(p.profile.name);
  const updateName = useSWRMutation(
    ["user", p.profile.id],
    () => updateUserName({ token: p.token }, { name }),
    {
      onSuccess: (data) => {
        if (data.type === "Ok") {
          setProfile({ ...p.profile, name });
          alert("저장되었습니다.");
        }
      },
    },
  );

  const cannotUpdate = updateName.isMutating
    ? "저장 중입니다."
    : name === p.profile.name
      ? "바뀐 내용이 없습니다."
      : null;

  const data = updateName.data;
  const errorMessage =
    data !== undefined
      ? (() => {
          switch (data.type) {
            case "Ok":
              return null;
            case "TooSoon":
              return `이름은 ${Math.ceil(
                data.remaining / (1000 * 60 * 60),
              )}시간 후에 다시 바꿀 수 있습니다.`;
          }
        })()
      : null;

  return (
    <form
      className="flex flex-row gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (cannotUpdate) {
          alert(cannotUpdate);
          return;
        }
        void updateName.trigger();
      }}
    >
      <label className="flex flex-row gap-2 items-center">
        <span className="whitespace-nowrap">이름</span>
        <input
          className="input outline-none"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      <button
        className={`button ${cannotUpdate ? "button-disabled" : ""}`}
        type="submit"
      >
        이름 저장
      </button>
    </form>
  );
}

function NewArticleNotifyForm(p: { token: string }) {
  const notifySetting = useSWR([p.token, "newArticleNotify"], () =>
    getUserNewArticleNotify({ token: p.token }),
  );
  const updateNotify = useSWRMutation(
    notifySetting.data && [p.token, "newArticleNotify"],
    () =>
      setUserNewArticleNotify(
        { token: p.token },
        { notify: !notifySetting.data?.notify },
      ),
    {
      onSuccess: (data) => {
        if (data.type === "Ok") {
          void notifySetting.mutate();
          alert("저장되었습니다.");
        }
      },
    },
  );
  if (notifySetting.isLoading || notifySetting.data === undefined) {
    return <p>알림 설정을 불러오는 중...</p>;
  } else if (notifySetting.error || notifySetting.data?.type !== "Ok") {
    return <p>알림 설정을 불러오는 중 오류가 발생했습니다</p>;
  } else {
    return (
      <form className="flex flex-col gap-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={notifySetting.data.notify}
            onChange={() => void updateNotify.trigger()}
          />
          <span>새글 알림 보내기</span>
        </label>
      </form>
    );
  }
}

function WebhookForm(p: { token: string }) {
  const webhooks = useSWR(["webhooks"], () => listWebhooks({ token: p.token }));
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const create = useSWRMutation(
    ["webhooks"],
    () => createWebhook({ token: p.token }, { name, url }),
    {
      onSuccess: (data) => {
        if (data.type === "Ok") {
          setName("");
          setUrl("");
          void webhooks.mutate();
          alert("추가되었습니다.");
        }
      },
    },
  );
  const deleteMutation = useSWRMutation(
    ["webhooks"],
    (_, opt: { arg: { id: number } }) =>
      deleteWebhook({ token: p.token }, { id: opt.arg.id }),
  );
  const isMutating = create.isMutating || deleteMutation.isMutating;

  return (
    <div>
      <h2 className="text-lg font-bold">웹훅</h2>
      {webhooks.data?.type === "Ok" && (
        <ul className="list-disc ml-4">
          {webhooks.data.webhooks.map((webhook) => (
            <li key={webhook.id}>
              {webhook.name}: <code>{webhook.url}</code>
              <button
                onClick={() => {
                  if (isMutating) {
                    alert("이전 요청 처리중");
                    return;
                  }
                  if (confirm("정말 삭제하시겠습니까?")) {
                    void deleteMutation.trigger({ id: webhook.id });
                  }
                }}
                className="button mx-4"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
      <button className="button" onClick={() => setShow(!show)}>
        {show ? "추가 취소" : "추가하기"}
      </button>
      {show && (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (isMutating) {
              alert("이전 요청 처리중");
              return;
            }
            void create.trigger();
          }}
        >
          <label className="flex flex-col gap-1">
            이름
            <input
              className="input outline-none"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            URL
            <input
              className="input outline-none"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </label>
          <button
            className={`button ${create.isMutating ? "button-disabled" : ""}`}
            type="submit"
          >
            추가
          </button>
        </form>
      )}
    </div>
  );
}

const CategoryFormContext = createContext<{
  token: string;
  openUpdateForm: (category: Category) => void;
}>({
  token: "",
  openUpdateForm: () => {},
});

function CategoryForm(p: { token: string }) {
  const cats = useSWR(["categories"], () =>
    listCategory({ token: p.token }),
  );
  const [formState, setFormState] = useState<{ type: "add" } | { type: "edit", id: number } | null>(null);
  const [name, setName] = useState("");
  const [isGroup, setIsGroup] = useState(false);
  const [parentId, setParentId] = useState<number | null>(null);
  const create = useSWRMutation(
    ["categories"],
    () =>
    createCategory({ token: p.token }, { name, is_group: isGroup, parent: parentId ? { id: parentId } : null }),
    {
      onSuccess: (data) => {
        if (data.type === "Ok") {
          setName("");
          setIsGroup(false);
          setParentId(null);
          setFormState(null);
          alert("추가되었습니다.");
        } else {
          alert("추가 중 오류가 발생했습니다");
        }
      },
    },
  );
  const edit = useSWRMutation(
    formState?.type === "edit" ?
      ["categories", formState.id] :
      null,
    ([, id]) =>
    updateCategory({ token: p.token }, { id, name, is_group: isGroup, parent: parentId ? { id: parentId } : null }),
    {
      onSuccess: (data) => {
        if (data.type === "Ok") {
          setName("");
          setIsGroup(false);
          setParentId(null);
          setFormState(null);
          void cats.mutate();
          alert("수정되었습니다.");
        } else {
          alert("수정 중 오류가 발생했습니다");
        }
      },
    },
  );
  const openUpdateForm = useCallback((category: Category) => {
    setFormState({ type: "edit", id: category.id });
    setName(category.name);
    setIsGroup(category.is_group);
    setParentId(category.parent_id);
  }, []);
  const context = useMemo(() => ({ token: p.token, openUpdateForm }), [p.token]);
  if (cats.isLoading) {
    return <p>분류 목록을 불러오는 중...</p>;
  }
  if (cats.error || cats.data?.type !== "Ok") {
    return <p>분류 목록을 불러오는 중 오류가 발생했습니다</p>;
  }
  return (
    <div>
      <h2 className="text-lg font-bold">분류</h2>
      <CategoryFormContext.Provider value={context}>
        <CategoryList categories={cats.data.categories}/>
      </CategoryFormContext.Provider>
      <button className="button" onClick={() => setFormState(formState === null ? { type: "add" } : null)}>
        {formState === null ? "추가하기" :
          formState.type === "add" ? "추가 취소" : "수정 취소"
        }
      </button>
      {formState && (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (create.isMutating || edit.isMutating) {
              alert("이전 요청 처리중");
              return;
            }
            if (formState.type === "add") {
              void create.trigger();
            } else {
              void edit.trigger();
            }
          }}
        >
          <label className="flex flex-col gap-1">
            이름
            <input
              className="input outline-none"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            그룹 여부
            <input
              type="checkbox"
              checked={isGroup}
              onChange={(e) => setIsGroup(e.target.checked)}
            />
          </label>
          <label className="flex flex-col gap-1">
            상위 분류
            <select
              value={parentId ?? ""}
              onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">없음</option>
              {cats.data.categories
                .filter((cat) => cat.is_group)
                .map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>
          <button className="button" type="submit" disabled={create.isMutating || cats.isLoading}>
            {formState.type === "add" ? "추가" : "수정"}
          </button>
        </form>
      )}
    </div>
  );
}

function CategoryList(p: { categories: Category[] }) {
  return (
    <ul className="list-disc ml-4">
      {p.categories.map((cat) => (
        <CategoryItem key={cat.id} category={cat} />
      ))}
    </ul>
  );
}

function CategoryItem(p: { category: Category }) {
  const ctx = useContext(CategoryFormContext);
  const deleteMutation = useSWRMutation(
    ["categories"],
    (_, opt: { arg: { id: number } }) =>
      deleteCategory({ token: ctx.token }, { id: opt.arg.id }),
  );
  return (
    <li>
      {p.category.name}
      {p.category.is_group && <span className="text-sm text-gray-500"> (그룹)</span>}
      <button
        onClick={() => {
          if (deleteMutation.isMutating) {
            alert("이전 요청 처리중");
            return;
          }
          if (confirm("정말 삭제하시겠습니까?")) {
            void deleteMutation.trigger({ id: p.category.id });
          }
        }}
        className="button mx-4"
      >
        삭제
      </button>
      <button
        onClick={() => ctx.openUpdateForm(p.category)}
        className="button"
      >
        수정
      </button>
      {p.category.children.length > 0 && (
        <CategoryList categories={p.category.children} />
      )}
    </li>
  );
}
