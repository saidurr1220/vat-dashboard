export default function TestPage() {
  return (
    <div style={{ padding: "20px", backgroundColor: "lightblue" }}>
      <h1 style={{ color: "red", fontSize: "24px" }}>
        TEST PAGE - If you can see this, the server is working!
      </h1>
      <p>Current time: {new Date().toISOString()}</p>
      <p>
        This is a simple test to verify the Next.js server is rendering pages
        correctly.
      </p>
    </div>
  );
}
