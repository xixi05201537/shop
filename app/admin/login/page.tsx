import "../admin.css";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  return (
    <main className="login-page">
      <section className="admin-card login-card">
        <h1 className="display">Pink Admin</h1>
        <p>Manage your product, orders, PayPal, emails, and tiny floating link.</p>
        <form className="admin-form" action="/api/admin/login" method="post">
          <label>
            Email
            <input name="email" type="email" defaultValue="admin@example.com" required />
          </label>
          <label>
            Password
            <input name="password" type="password" defaultValue="admin123456" required />
          </label>
          {query.error ? <div className="notice">Invalid email or password.</div> : null}
          <button className="admin-button" type="submit">
            Log in
          </button>
        </form>
      </section>
    </main>
  );
}
