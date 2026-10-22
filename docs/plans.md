# Execution plans

An execution plan is a Markdown file that lets a later agent, with no memory of your session, pick up a piece of work and finish it. Most changes to this site are small and need no plan: the request and the diff are enough.

Write one when the work will outlast one session, touches several parts of the site, or needs Eric to decide something partway through.

## Where they live

- `docs/exec-plans/active/YYYY-MM-DD-short-name.md` while the work is open.
- `docs/exec-plans/completed/` once it's finished or dropped. Move it in the same change as its last step.
- A problem you find but won't fix goes in the [tech-debt tracker](exec-plans/tech-debt-tracker.md), not in a plan.

An active plan is a record, not an instruction: don't start one just because it's there.

## What goes in one

Write for a reader who has only the repository and the plan. Name files by their full path, explain any term that isn't plain English, and say how to see the result working: a page to open, or a command and what it prints.

    # <What the work achieves>

    ## Purpose

    What someone can do afterwards that they couldn't before, and how to see it.

    ## Context

    The files involved and how they fit together, as if to a newcomer.

    ## Plan

    The steps in order: the files each one changes, and how to check it worked.

    ## Progress

    - [x] (2026-10-22 10:40) A finished step.
    - [ ] A step not done yet.

    ## Decision log

    - Decision: … Why: … (date)

    ## Surprises

    Anything unexpected, with the evidence.

    ## Outcome

    What shipped, what didn't and why, and what to do next.

Keep Progress true at every stopping point; split a half-done step into what's done and what's left. Record each decision, and why, as you make it. Write the Outcome when the work ends, then move the plan.

`make docs` makes sure each plan has a Progress and a Decision log, that a plan whose steps are all ticked has left `docs/exec-plans/active/`, and that a completed plan has an Outcome.
