import "../admin.css";
import { SubmitButton } from "@/components/SubmitButton";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  return (
    <main className="login-page">
      <section className="admin-card login-card">
        <h1 className="display">Misaki 后台</h1>
        <p>管理商品、订单、邮件和小浮窗。</p>
        <form className="admin-form" action="/api/admin/login" method="post">
          <label>
            邮箱
            <input name="email" type="email" defaultValue="" required />
          </label>
          <label>
            密码
            <input name="password" type="password" defaultValue="" required />
          </label>
          {query.error ? <div className="notice">邮箱或密码不正确。</div> : null}
          <SubmitButton loadingText="登录中...">
            登录
          </SubmitButton>
        </form>
      </section>
    </main>
  );
}
