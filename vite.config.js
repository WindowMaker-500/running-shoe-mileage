import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages 일반 저장소 배포 주소:
// https://<GitHub아이디>.github.io/running-shoe-mileage/
//
// 저장소 이름을 바꾸면 아래 base도 '/저장소명/' 으로 바꾸세요.
// 사용자/조직 사이트 저장소(<아이디>.github.io)에 배포할 때는 base: "/" 로 바꾸세요.
export default defineConfig({
  base: "/running-shoe-mileage/",
  plugins: [react()],
  server: {
    host: "0.0.0.0"
  }
});
