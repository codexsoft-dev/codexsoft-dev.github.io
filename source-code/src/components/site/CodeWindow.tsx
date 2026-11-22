/** Type names use the bluish "Founder" colour. */
function T({ children }: { children: string }) {
  return <span className="text-muted-foreground">{children}</span>;
}

export function CodeWindow() {
  return (
    <div className="overflow-hidden rounded-md border border-border/50 bg-code shadow-2xl">
      <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
        <span className="size-2.5 rounded-full bg-window-red" />
        <span className="size-2.5 rounded-full bg-window-dot" />
        <span className="size-2.5 rounded-full bg-window-dot" />
        <em className="ml-3 font-mono text-xs not-italic text-code-comment">solution.go</em>
      </div>
      <pre className="overflow-x-auto px-6 py-7 font-mono text-xs leading-[1.7] text-code-text sm:px-7 md:text-[13px]">
        <code>
          <span className="text-code-keyword">package</span> codexsoft{"\n\n"}
          <span className="text-code-keyword">type</span> <T>Solution</T>{" "}
          <span className="text-code-keyword">struct</span> {"{"}
          {"\n"}  Quality     <T>string</T>{"\n"}  Reliability <T>string</T>{"\n"}  Scalability <T>string</T>
          {"\n"}  Security    <T>string</T>{"\n"}
          {"}"}
          {"\n\n"}
          <span className="text-code-keyword">func</span> (s <T>Solution</T>) Deliver() <T>string</T> {"{"}
          {"\n"}  <span className="text-code-keyword">return</span>{" "}
          <span className="text-code-string">"Impactful Software Solutions"</span>
          {"\n"}
          {"}"}
          {"\n\n"}
          <span className="italic text-code-comment">// We don't just write code.</span>
          {"\n"}
          <span className="italic text-code-comment">// We build digital value.</span>
        </code>
      </pre>
    </div>
  );
}
