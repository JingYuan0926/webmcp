# PageCTRL — demo video script

Target 2 minutes 40 seconds. Read it aloud once before recording. Short
sentences on purpose: they are easier to say cleanly in one take.

**Before you press record**

- Live site open in a normal browser, cart empty
- A second tab: ChatGPT's in-app browser on the same URL, model set to **Sol**
- Card and address already saved
- Stripe dashboard open on `dashboard.stripe.com/test/payments`
- The dashboard page open in a fourth tab

---

## 0:00 – 0:20 · The problem

*Show: the live site, split screen, panel on the right.*

> "AI agents can now act inside web pages through WebMCP. They add things to
> carts. They change addresses. They check out.
>
> But those calls never leave the page. No firewall, no gateway, no payment
> network can see them. So today you either give an agent everything, or
> nothing.
>
> This is PageCTRL. It's one script that puts a human back in control — inside
> the page, which is the only place these calls exist."

---

## 0:20 – 0:55 · The guardrails

*Click **Run security demo**. Let the panel fill. Point at rows as you talk.*

> "Watch the right side. That's a flight recorder for every agent action.
>
> The agent lists products — allowed. Adds two items — allowed.
>
> Then it tries fifty cables. Blocked. The merchant caps each product at five in
> the cart, and it counts the whole cart, not one call — so it can't add five at
> a time until it has fifty.
>
> Then a laptop. Blocked again: over the two-hundred-dollar limit on any single
> action."

---

## 0:55 – 1:15 · The two dangerous moments

*Keep pointing at the panel.*

> "A seller reply comes back with hidden instructions telling the agent to change
> the shipping address. PageCTRL flags it and warns the agent to treat it as
> data, not commands.
>
> Then a third-party widget loads and tries to replace the checkout tool. That's
> a real, documented WebMCP attack. The guard refuses it, because the tool
> surface was sealed at load."

---

## 1:15 – 1:35 · The agent recovers

*The explain popup appears on screen.*

> "And when the agent asks why it was blocked, it gets a real answer — the rule
> and the limit — and the same answer appears on my screen.
>
> That's the design idea. Blocking an agent is easy. Blocking it so it can still
> finish the job is the hard part."

---

## 1:35 – 2:00 · A real agent

*Switch to ChatGPT. Point at the badge first.*

> "This is ChatGPT's browser, on the same site. The badge says Native — that's
> real WebMCP, not a simulation.
>
> I'll ask it to shop."

*Type: `Add 5 portable SSDs, then add 1 more.`*

> "Five, allowed. One more would make six, and it's stopped. A real agent, hitting
> a real limit."

---

## 2:00 – 2:20 · The payment

*Ask it to check out. The approval popup appears.*

> "Now checkout. Everything stops. The popup shows exactly what it wants to
> spend, and it waits for me.
>
> I save a card once, with Stripe. After that the agent shops and pays inside my
> limits — and the only thing that ever interrupts me is this."

*Click Allow. Order confirms. Switch to the Stripe dashboard.*

> "That's a real Stripe charge. Here it is in the Stripe dashboard.
>
> The card is charged off-session, because I approved earlier and walked away —
> the pattern Stripe built for exactly this."

---

## 2:20 – 2:40 · The merchant side

*Switch to /dashboard.*

> "For the merchant, this is the console. It shows which secret belongs in which
> service, and confirms every tool on the page is guarded.
>
> Two deployments on purpose: the shop runs on Vercel with its own Stripe key,
> and the signing key lives on a separate origin the merchant doesn't control.
> When I click Allow, that service signs the approval. The charge is refused
> without it — so a rogue script in the page can't pay itself."

---

## 2:40 – 2:55 · Close

*Back to the split screen.*

> "Seventy-seven percent of people shop with AI. Seventy-five percent won't let
> it pay. That gap is the whole product.
>
> Agents keep working. People keep the final say. One script, on any site."

---

## The two "why" answers, if you have room

**Why a shopper turns it on**

> "I get a spending limit, a click before anything that matters, a kill switch,
> and a receipt of everything the agent did. I can finally let it finish."

**Why a merchant installs it**

> "They get limits that contain a runaway agent, a tool surface no third-party
> script can hijack, evidence for disputes, and analytics for agent traffic they
> currently have none of. And the sale that used to die at checkout now
> completes."

---

## If you overrun

Cut in this order:

1. The dashboard section — it is the least visual
2. The "agent recovers" section — good, but the block already showed the idea
3. Shorten the close to the last two lines

Never cut: the block, the approval popup, or the Stripe dashboard. Those three
are the proof.
