import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const navigate = useNavigate();

  const login = useAuthStore((state) => state.login);

  const fakeLogin = () => {
    login(
      {
        email: "admin@example.com",
        role: "admin",
      },
      "demo-access-token",
      "demo-refresh-token"
    );

    navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <button
        onClick={fakeLogin}
        className="rounded bg-cyan-600 px-6 py-3 text-white hover:bg-cyan-700"
      >
        Demo Login
      </button>
    </div>
  );
}