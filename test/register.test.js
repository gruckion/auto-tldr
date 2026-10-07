import assert from "node:assert/strict";
import { test } from "node:test";
import { register } from "../hooks/register.js";

const summaryPrompt =
  "TLDR in a self-contained way that doesn't require me to read the previous comments.";

// Exercise the real exported hooks. This fixture provides only the host effects
// they use; Claude's queue, model, and UI are verified separately in a live run.
function session({ rejectSubmission = false } = {}) {
  const handlers = new Map();
  const timers = [];
  const prompts = [];
  const logs = [];
  register((name, handler) => handlers.set(name, handler));
  const api = {
    clock: { after: (_, callback) => timers.push(callback) },
    prompt: {
      submit: async (prompt) => {
        if (rejectSubmission) throw new Error("Session closed");
        prompts.push(prompt);
      },
    },
    ui: { log: async (text) => logs.push(text) },
  };
  const emit = (
    name,
    event,
    next = async () => ({ text: event.answer ?? "" }),
  ) => handlers.get(name)(api, event, next);
  return {
    prompts,
    logs,
    emit,
    start: (turnId, text = "Explain the change") =>
      emit("turn.start", { turnId, text }),
    complete: (turnId, fields = {}) =>
      emit("turn.complete", {
        turnId,
        reason: "answer",
        isAborted: false,
        answer: "The change is ready.",
        ...fields,
      }),
    flush: async () => {
      for (const callback of timers.splice(0)) await callback();
    },
  };
}

test("each ordinary answer gets one exact follow-up, but summary replies never recurse", async () => {
  const s = session();
  for (const id of ["first", "second"]) {
    await s.start(id);
    await s.complete(id);
    assert.equal(s.prompts.length, id === "first" ? 0 : 1);
    await s.flush();
    await s.complete(id); // Re-delivering a consumed completion is harmless.
    await s.flush();
    await s.start(`${id}-summary`, summaryPrompt);
    await s.complete(`${id}-summary`);
    await s.flush();
  }
  assert.deepEqual(s.prompts, [
    { text: summaryPrompt, asUser: true },
    { text: summaryPrompt, asUser: true },
  ]);
});

test("manual TLDR variants do not trigger summaries; a normal question mentioning TLDR does", async () => {
  const s = session();
  for (const [index, text] of [
    "TLDR",
    " tl;dr please",
    "TL:DR",
    "tldr in one sentence",
  ].entries()) {
    await s.start(String(index), text);
    await s.complete(String(index));
    await s.flush();
  }
  assert.equal(s.prompts.length, 0);
  await s.start("normal", "What does TLDR mean?");
  await s.complete("normal");
  await s.flush();
  assert.equal(s.prompts.length, 1);
});

test("ignores unsuccessful and empty answers, without suppressing the next successful turn", async () => {
  const s = session();
  const outcomes = [
    { reason: "aborted", isAborted: true },
    { reason: "error" },
    { reason: "refusal" },
    { answer: "  " },
  ];
  for (const [index, outcome] of outcomes.entries()) {
    await s.start(String(index));
    await s.complete(String(index), outcome);
    await s.flush();
  }
  assert.equal(s.prompts.length, 0);
  // An attachment-only or continuation turn may have no text prompt.
  await s.start("attachment", "");
  await s.complete("attachment");
  await s.flush();
  assert.equal(s.prompts.length, 1);
});

test("subagents and unrelated completions do not consume the main turn", async () => {
  const s = session();
  await s.start("main");
  await s.complete("main", { agentId: "child" });
  await s.complete("unrelated");
  await s.flush();
  assert.equal(s.prompts.length, 0);
  await s.complete("main");
  await s.flush();
  assert.equal(s.prompts.length, 1);
});

test("new input cancels stale work both before completion and before the deferred submission", async () => {
  for (const inputBeforeCompletion of [true, false]) {
    const s = session();
    await s.start("old");
    if (!inputBeforeCompletion) await s.complete("old");
    await s.emit("prompt.submit", { text: "New question" });
    if (inputBeforeCompletion) await s.complete("old");
    await s.flush();
    assert.equal(s.prompts.length, 0);
    await s.start("new", "New question");
    await s.complete("new");
    await s.flush();
    assert.equal(s.prompts.length, 1);
  }
});

test("session end cancels pending summaries and separate sessions do not share state", async () => {
  const a = session();
  const b = session();
  await a.start("same-id");
  await b.start("same-id");
  await a.complete("same-id");
  await b.complete("same-id");
  await a.emit("session.end", { reason: "clear" });
  await a.flush();
  await b.flush();
  assert.equal(a.prompts.length, 0);
  assert.equal(b.prompts.length, 1);
});

test("loading mid-turn does not guess eligibility and completion preserves downstream output", async () => {
  const s = session();
  await s.complete("not-observed");
  await s.flush();
  assert.equal(s.prompts.length, 0);
  await s.start("observed");
  const output = { text: "Another hook's output", usage: { value: 1 } };
  const returned = await s.emit(
    "turn.complete",
    {
      turnId: "observed",
      reason: "answer",
      isAborted: false,
      answer: "Done",
    },
    async () => output,
  );
  assert.equal(returned, output);
  await s.flush();
  assert.equal(s.prompts.length, 1);
});

test("a failed submission is reported without an automatic retry loop", async () => {
  const s = session({ rejectSubmission: true });
  await s.start("answer");
  await s.complete("answer");
  await s.flush();
  assert.equal(s.prompts.length, 0);
  assert.equal(s.logs.length, 1);
  assert.match(s.logs[0], /Session closed/);
  await s.complete("answer");
  await s.flush();
  assert.equal(s.logs.length, 1);
});
