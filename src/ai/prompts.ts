export const PROMPT_SYSTEM_EVALUATOR = `You are PROOF, an exacting, objective academic stress-tester.
Your job is NOT to be a polite tutor, and NOT to give unsolicited explanations.
Your sole job is to test whether the student has genuine causal understanding of a concept, or if they are reciting memorized definitions without understanding the underlying mechanics.

Rules:
1. Be rigorous, intellectually honest, and direct. Zero sycophancy.
2. Ground all checks strictly in the provided Source Excerpt.
3. If the student makes a hand-waved assertion, unsupported assumption, or contradicts the source, highlight it immediately.
4. Always respond with strict, valid JSON matching the requested schema. No markdown wrapper if possible, or clean JSON block.`;

export function buildConceptExtractionPrompt(materialTitle: string, sourceText: string): string {
  return `Extract 3 to 6 essential, testable conceptual units from the following study material.
Each concept must represent a distinct mechanism, causal relationship, or principle that a student could understand or misunderstand (avoid trivia or simple vocabulary).

Material Title: ${materialTitle}
Source Content:
${sourceText.slice(0, 3000)}

Respond in pure JSON matching this exact structure:
{
  "concepts": [
    {
      "title": "Short descriptive name",
      "definition": "Precise 1-2 sentence definition",
      "keyPrinciples": ["Principle 1", "Principle 2"],
      "sourceExcerpt": "Exact or near-exact short excerpt from the text that grounds this concept"
    }
  ]
}`;
}

export function buildChallengePrompt(
  sourceExcerpt: string,
  conceptTitle: string,
  userExplanation: string
): string {
  return `Target Concept: ${conceptTitle}
Ground Truth Source Excerpt:
"${sourceExcerpt}"

Student's Explanation (written from memory without notes):
"${userExplanation}"

TASK:
1. Identify specific claims made by the student.
2. Detect any omissions of necessary causal mechanisms.
3. Find their hidden assumption or logical leap.
4. Craft ONE sharp adversarial counterexample or edge-case scenario that directly probes their weak assumption.
Do NOT give them the answer. Force them to defend their mental model under stress.

Respond in pure JSON matching this exact structure:
{
  "claimsIdentified": ["claim 1", "claim 2"],
  "omissions": ["missing step X", "unmentioned constraint Y"],
  "hiddenAssumption": "The student assumes...",
  "challengeType": "counterexample",
  "targetedWeakness": "Short 1-sentence description of where their logic is vulnerable",
  "counterexamplePrompt": "The adversarial question/scenario the student must answer to defend their explanation"
}`;
}

export function buildDefenseEvaluationPrompt(
  sourceExcerpt: string,
  conceptTitle: string,
  originalExplanation: string,
  challenge: string,
  defense: string
): string {
  return `Target Concept: ${conceptTitle}
Ground Truth Source Excerpt:
"${sourceExcerpt}"

Student's Original Explanation:
"${originalExplanation}"

Targeted Challenge Posed to Student:
"${challenge}"

Student's Defense Response:
"${defense}"

TASK:
Determine if the student's defense successfully resolved the flaw and demonstrated real mechanical understanding, or if they evaded the question, doubled down on error, or introduced new misconceptions.

Verdicts:
- "VERIFIED": Sound premise, mechanism explained, successfully survived the challenge with solid reasoning.
- "PARTIALLY_VERIFIED": Good intuition, resolved part of the challenge, but missed a key causal condition.
- "NEEDS_REPAIR": Evaded the challenge, contradicted the ground truth, or revealed an active misconception.

Respond in pure JSON matching this exact structure:
{
  "verdict": "VERIFIED" | "PARTIALLY_VERIFIED" | "NEEDS_REPAIR",
  "groundedInSource": true,
  "whatGotRight": "Exact aspects of their explanation that are mechanically sound",
  "whatBroke": "Where the logic failed or which edge-case they failed to address",
  "whyItMatters": "Why this distinction matters in reality / on an exam",
  "whatToFix": "The exact mental shift required",
  "repairDirective": "A 1-sentence prompt directing them to repair the specific missing link",
  "counterexampleResolved": true | false
}`;
}

export function buildRepairEvaluationPrompt(
  sourceExcerpt: string,
  conceptTitle: string,
  originalWeakness: string,
  repairResponse: string
): string {
  return `Target Concept: ${conceptTitle}
Source Excerpt: "${sourceExcerpt}"
Identified Weakness: "${originalWeakness}"
Student's Repair Attempt: "${repairResponse}"

Evaluate if the student has bridged the missing link.
Respond in pure JSON:
{
  "passed": true | false,
  "feedback": "Short critique explaining whether the link is now sound"
}`;
}
