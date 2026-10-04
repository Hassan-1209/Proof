# PROOF

> **“Don’t tell me you understand it. Prove it.”**

An offline-first study verification tool that stress-tests your reasoning instead of simply giving you another explanation.

Built for the **“Build for a Friend”** Challenge.

---

## 1. The Friend's Problem

My friend was studying for an Operating Systems midterm. After spending six hours reviewing slides and highlighting textbooks, they felt fully prepared. 

During an informal review, I asked them to explain how a **Page Fault** works without looking at their notes. They replied:

> *“A page fault is an error that occurs when your physical RAM is 100% full, so the operating system pauses the process to swap memory to the hard drive.”*

This exposed a classic learning breakdown: the **illusion of explanatory depth**. Recognizing definitions on lecture slides felt like understanding, but the underlying causal mechanics were completely missing. In demand paging, an instruction accessing an unmapped virtual address triggers a page fault on the very first execution—even when 32GB of physical RAM is completely empty.

---

## 2. Why Conventional Study Tools Weren't Enough

* **Flashcards (Anki, Quizlet):** Tested atomic vocabulary (*“What is a page table?”*), which my friend memorized easily, but never tested how mechanisms behave under boundary conditions.
* **Conventional AI Prompts:** Could a student prompt a general conversational chatbot to quiz them? Absolutely. However, in our testing, conversational AI defaults to being helpful and explanatory. When given a half-correct answer, it frequently completed the thought for the student and transitioned into a long lecture, returning the student to passive reading.

PROOF was built to turn adversarial verification into the product itself: hiding reference notes, exposing the student’s own claims, identifying questionable assumptions, generating a targeted counterexample, requiring a defense, and verifying the repair.

---

## 3. How PROOF Works: The Verification Loop

PROOF does not immediately reveal the correct answer when a weakness is detected. The interaction follows an 8-stage verification pipeline:

```
[1. HIDE NOTES] ➔ Screen blanks all source material; student writes explanation from memory.
       ↓
[2. DECOMPOSE]  ➔ Local evaluator extracts explicit claims, omissions, and unproven premises.
       ↓
[3. CHALLENGE]  ➔ System generates a targeted counterexample or edge-case probe.
       ↓
[4. DEFEND]     ➔ Student defends their mental model directly against the probe.
       ↓
[5. EVALUATE]   ➔ Evaluator determines if the weakness was addressed or if logic collapsed.
       ↓
[6. VERDICT]    ➔ Issues evidence-based verdict (VERIFIED / PARTIALLY VERIFIED / NEEDS REPAIR).
       ↓
[7. REPAIR]     ➔ If needed, issues a 1-sentence repair directive grounded in source text.
       ↓
[8. RE-TEST]    ➔ Student reformulates the link; concept verified only when reasoning survives.
```

---

## 4. Why Local & Open-Weight Execution

* **Adversarial Evaluation Contract:** PROOF is deliberately designed around adversarial evaluation rather than conversational assistance. Operating locally allows us to keep prompts strictly bounded to factual verification without conversational filler.
* **Local Data Privacy:** Course notes, student explanations, and diagnosed knowledge gaps remain stored in the browser's IndexedDB rather than sending personal study data to a remote application server.
* **No Per-Request Cloud API Cost:** Running local evaluation or on-device open-weight models avoids per-query token fees when operating on client hardware.
* **Offline Study Focus:** Students studying for high-stakes exams can disconnect internet access completely to eliminate distractions.

---

## 5. Technical Architecture

```
┌────────────────────────────────────────────────────────┐
│                   PROOF UI (React 19)                  │
│    (Dashboard • Prove Arena • Concept Map • Log)       │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                    PROOF Engine Core                   │
│   (Cognitive State Machine • Anti-Hallucination Guard) │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                 IAIProvider Abstraction                │
│    + extractConcepts()     + generateChallenge()       │
│    + evaluateDefense()     + evaluateRepair()          │
└─────────────┬──────────────────────────────┬───────────┘
              │                              │
┌─────────────▼─────────────┐  ┌─────────────▼───────────┐
│     In-Browser WebGPU     │  │  PROOF Local Fallback   │
│    (WebLLM / Wasm)        │  │  (Deterministic client- │
│ - Llama-3.2-1B-Instruct   │  │   side reasoning engine)│
│ - Gemma-2-2B-it           │  │ - 100% Offline / No GPU │
└───────────────────────────┘  └─────────────────────────┘
              │
┌─────────────▼─────────────┐
│    Local Ollama Bridge    │
│     (localhost:11434)     │
│ - Gemma-2:9b / Qwen-2.5   │
└───────────────────────────┘

┌────────────────────────────────────────────────────────┐
│             Local IndexedDB Storage Vault              │
│    ├── Study Materials                                 │
│    ├── Concept Ledger (State Machine)                  │
│    └── Proof Sessions (Audit Trail & Ground Truth)     │
└────────────────────────────────────────────────────────┘
```

---

## 6. Offline Behavior (Precise Statement)

PROOF distinguishes between three operational layers:

1. **Offline Application & Storage:** The application shell loads from cached static assets, and all materials, concepts, and proof sessions are stored locally in the browser's IndexedDB.
2. **Offline Local Evaluation (Standard Default):** The built-in `LocalHeuristicEngine` performs deterministic claim parsing, causal boundary evaluation, and counterexample generation entirely in client-side JavaScript without any network calls or GPU requirements.
3. **Offline Generative AI (WebLLM):** In WebGPU mode, model weights are downloaded once during initial setup and cached in browser `CacheStorage`. Once cached, generative open-weight inference executes locally on device silicon without internet connectivity.
4. **Desktop Daemon (Ollama):** Connects to models running on `localhost:11434` on the user's local machine.

---

## 7. Data Privacy

* **Local Storage:** Study materials, explanations, concepts, and proof sessions are stored locally in the browser's IndexedDB.
* **Network Boundary:** PROOF does not require sending study data to a remote application server. Local inference paths keep model processing on the device.
* **No Telemetry:** No tracking scripts, analytics libraries, or third-party advertising cookies are included.

---

## 8. Supported Providers & Model Licenses

| Provider | Type | Model Used | License |
| :--- | :--- | :--- | :--- |
| **PROOF Local Fallback** | Deterministic Client-side NLP | Rule-based semantic decomposition | Apache 2.0 (App Code) |
| **WebLLM (WebGPU)** | In-browser open-weight LLM | `Llama-3.2-1B-Instruct-q4f16_1-MLC` | Llama 3.2 Community License |
| **Ollama Bridge** | Local machine daemon | `gemma2:latest` / `qwen2.5:latest` | Gemma Terms of Use / Apache 2.0 |

---

## 9. Running Locally

### Prerequisites
* Node.js 18+
* Modern browser (Chrome 113+, Edge, or Firefox)

### Setup
```bash
# Clone the repository
git clone https://github.com/example/proof.git
cd proof

# Install dependencies
npm install

# Start local dev server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 10. Friend Testing & Recorded Findings

During Phase 4 and Phase 5 testing with my friend:
* **Material Tested:** Operating Systems: Virtual Memory & Page Faults.
* **Observed Breakdown:** The friend submitted their original definition (*“Page faults happen when RAM is full”*).
* **The Counterexample:** PROOF challenged: *“Suppose a program with 32GB of empty RAM reads its first variable. Why does the CPU still trigger a Page Fault?”*
* **The Result:** The friend immediately realized their assumption was flawed, defended the edge condition by identifying the Valid/Invalid bit, and repaired the concept to `VERIFIED`.
* **Friend Feedback Recorded During Testing:**
  * *“It didn't let me get away with just saying 'it swaps to disk'.”*
  * *“I liked that it showed the exact sentence from my notes on why my answer broke.”*
  * *Suggested Change:* Asked for a clear breakdown of what the engine extracted before asking for the defense (implemented in the challenge screen).

---

## 11. Known Limitations

* **Model Download Size (WebLLM):** While the default deterministic engine requires zero download, running generative open-weight models in-browser via WebLLM requires downloading ~1.2GB of quantized weights into browser storage on first selection.
* **Text Input Scope:** Currently optimized for plain text, markdown, and pasted lecture notes; multi-column PDF files with complex mathematical diagrams require copying text into the importer.

---

## 12. License

Distributed under the Apache 2.0 License. See `LICENSE` for details.
