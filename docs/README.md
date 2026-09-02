# Journey proof

`sample-journey.json` is a real export from PageControl's deterministic ten-step demo. Regenerate it with `npm run journey:sample`.

To verify the chain by hand, confirm the first `prevHash` is `genesis` and each later one equals the preceding entry's `hash`. Recompute each SHA-256 over the UTF-8 JSON object `{seq,ts,tool,verdict,args,result,prevHash}` in that exact key order; it must equal the entry's `hash`.
