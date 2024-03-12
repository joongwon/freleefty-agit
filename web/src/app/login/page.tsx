import { PageProps } from "@/utils";
import Login from "./Login";
import { getEnv } from "@/env";

export default function LoginPage(p: PageProps) {
  return <Login clientId={getEnv().NAVER_ID} {...p} />;
}
