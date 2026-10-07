export function register(on) {
  // State belongs to this session's module, never to another session.
  let generation = 0;
  let turn = null;

  // New input invalidates a summary that has not been submitted yet.
  on("prompt.submit", async ($, event, next) => {
    generation += 1;
    return next(event);
  });

  on("turn.start", async ($, event, next) => {
    generation += 1;
    const text = event.text.trim();
    turn = {
      id: event.turnId,
      generation,
      eligible: !/^tl[;:]?\s*dr\b/i.test(text),
    };
    return next(event);
  });

  on("turn.complete", async ($, event, next) => {
    const result = await next(event);
    if (event.agentId || turn?.id !== event.turnId) return result;

    const completed = turn;
    turn = null; // Consume once, even if completion is delivered again.
    if (
      !completed.eligible ||
      completed.generation !== generation ||
      event.reason !== "answer" ||
      event.isAborted ||
      !event.answer.trim()
    )
      return result;

    // Release the completion handler first. The API queues at idle priority;
    // it does not stop an active answer or launch a second Claude process.
    $.clock.after(0, async () => {
      if (generation !== completed.generation) return;
      try {
        await $.prompt.submit({
          text: "TLDR in a self-contained way that doesn't require me to read the previous comments.",
          asUser: true,
        });
      } catch (error) {
        await $.ui.log("Automatic TLDR could not be sent: " + String(error));
      }
    });
    return result;
  });

  on("session.end", async ($, event, next) => {
    generation += 1;
    turn = null;
    return next(event);
  });
}
