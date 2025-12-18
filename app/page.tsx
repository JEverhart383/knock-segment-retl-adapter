export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Knock Segment RETL Adapter</h1>
      <p>
        This service bridges Segment Reverse ETL with Knock static audiences.
      </p>
      <h2>Endpoints</h2>
      <ul>
        <li>
          <code>POST /api/segment/audiences/:audience_key/add</code> — Add
          members to a Knock audience
        </li>
        <li>
          <code>POST /api/segment/audiences/:audience_key/remove</code> — Remove
          members from a Knock audience
        </li>
      </ul>
    </main>
  );
}
