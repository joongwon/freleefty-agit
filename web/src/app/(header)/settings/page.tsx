"use client";

import { updateUserName } from "@/actions";
import { gAuthState, setProfile } from "@/auth";
import { User } from "@/types";
import { useHookstate } from "@hookstate/core";
import { useState } from "react";
import useSWRMutation from "swr/mutation";

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
          <Form
            key={auth.value.profile.id}
            token={auth.value.token}
            profile={auth.value.profile}
          />
        </main>
      );
  }
}

function Form(p: { token: string; profile: User }) {
  const [name, setName] = useState(p.profile.name);
  const updateName = useSWRMutation(
    ["user", p.profile.id],
    () => updateUserName(p.token, name),
    {
      onSuccess: (data) => {
        console.log(data);
        if (data.type === "Ok") {
          setProfile(data.profile);
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
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (cannotUpdate) {
          alert(cannotUpdate);
          return;
        }
        void updateName.trigger();
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
      {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      <button
        className={`button ${cannotUpdate ? "button-disabled" : ""}`}
        type="submit"
      >
        저장
      </button>
    </form>
  );
}
