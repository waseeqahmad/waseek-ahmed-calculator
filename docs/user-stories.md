# User Stories with Acceptance Criteria

**Status rule:** a story is marked **Implemented** only after every one of its acceptance criteria has been checked by hand in the running app. Until then it stays **Not implemented**. S-1 to S-8 were checked by hand and are Implemented.

**Screens:** the app has two screens. **Setup** is where you enter the total, the people and the payment details and send the message. **Track** is where you tick people off. See `docs/ui-plan.md`.

**Shared setup used in the examples** (unless an example says otherwise): the payer's name is `Waseek`, the friends are `Ali` and `Sara`, and payment details are empty. Error messages are quoted exactly; the app must use these strings.

| ID | Job | Story | Status |
|---|---|---|---|
| S-1 | J-1 | Equal share per person | Implemented |
| S-2 | J-1 | Add and remove people | Implemented |
| S-3 | J-1 | Ready-made message to copy or open in WhatsApp | Implemented |
| S-4 | J-3 | One clear amount and where to send it | Implemented |
| S-5 | J-2 | Tick people off as they pay | Implemented |
| S-6 | J-2 | Bill is still there later | Implemented |
| S-7 | J-2 | Warning before edits clear the ticks | Implemented |
| S-8 | J-2 | Start a new bill | Implemented |
| S-9 | J-1 | Custom amount for one person | Not implemented |
| S-10 | J-1 | Paste a list of names | Not implemented |
| S-11 | J-2 | Partial payments | Not implemented |
| S-12 | J-2 | Several bills at once | Not implemented |
| S-13 | J-2 | Screenshot as proof | Not implemented |

---

## S-1: Equal share per person
*Serves J-1 · Implemented*

As a Bill Payer, I want to enter the bill total and see an equal share per person in whole rupees, so that I know what to ask for without doing the maths.

**Rounding rule:** friends' shares round up to the next whole rupee, and the payer's share is whatever is left, so the shares always add up exactly to the total.

**Normal cases**
- Given 3 people, when I enter `900`, then Waseek, Ali and Sara each show `300 PKR`.
- Given 3 people, when I enter `1000`, then Ali and Sara each show `334 PKR` and Waseek shows `332 PKR` (334 + 334 + 332 = 1,000).
- Given 3 people, when I enter `1,500`, then the total is read as 1500 and each share is `500 PKR`.
- Given 3 people, when I enter `  1500  ` with spaces around it, then the spaces are ignored and each share is `500 PKR`.
- Given any valid split, then every amount is shown with thousands separators, for example `3,333,334 PKR`.

**Boundaries and very large or small numbers**
- Given 3 people, when I enter `10000000`, then Ali and Sara each show `3,333,334 PKR` and Waseek shows `3,333,332 PKR`.
- Given 3 people, when I enter `10000001`, then I see `Total can't be more than 10,000,000 PKR` and no shares are shown.
- Given 2 people, when I enter `1`, then Ali shows `1 PKR` and Waseek shows `0 PKR`.
- Given 10 people, when I enter `10`, then everyone shows `1 PKR`.
- Given 10 people, when I enter `11`, then I see `Total is too small to split between 10 people in whole rupees.` and no shares are shown.

**Invalid input**
- Given the total is empty, then every share is left blank and I see the hint `Enter the bill total`, not shown as an error.
- When I enter `0` or `-50`, then I see `Total must be more than 0 PKR` and every share is left blank.
- When I enter `1500.50`, then I see `Enter whole rupees (no paisa)` and every share is left blank. The total is never silently rounded.
- When I enter `12abc`, `abc` or `1e5`, then I see `Enter a number in whole rupees` and every share is left blank.

**Carrying on after a result or an error**
- Given the error `Enter a number in whole rupees` is showing, when I change the total to `900`, then the error disappears and each share shows `300 PKR`.
- Given shares are showing for `900`, when I change the total to `1000`, then the shares update straight away to 334 / 334 / 332.

## S-2: Add and remove people
*Serves J-1 · Implemented*

As a Bill Payer, I want to add and remove people by name, so that the split matches who was actually there.

**Normal cases**
- Given the name field contains `Ali`, when I press Enter or the add button, then Ali appears in the list with a share, and the name field is cleared.
- Given 3 people and a total of `900`, when I remove Sara, then Waseek and Ali each show `450 PKR`.
- When I add `علی` or `Sara 🍕`, then the name is accepted and shown exactly as typed.

**Invalid input**
- Given my name is empty, then I see `Enter your name` and every share is left blank.
- Given only my name and a total, with no friends, then every share is left blank and the message area says what's missing (see S-3).
- When I try to add an empty or spaces-only name, then nothing is added and I see `Enter a name`.
- Given Ali is in the list, when I try to add `ali` or ` ALI `, then nothing is added and I see `Ali is already in the list`.
- Given my name is `Waseek`, when I try to add `waseek`, then nothing is added and I see `Waseek is already in the list`.
- Given Ali is a friend, when I change my name to `Ali`, then I see `Ali is already in the list` under my name and every share is left blank.

**Boundaries**
- When I add a 30-character name, then it is accepted. When I add a 31-character name, then nothing is added and I see `Names can be up to 30 characters.`
- Given 50 people (me plus 49 friends), when I try to add another, then nothing is added and I see `A bill can have at most 50 people.`
- Given 2 people, then the split is shown. That's the minimum (me plus 1 friend).

**Carrying on after an error**
- Given I see `Ali is already in the list`, when I type `Ahmed` and add it, then the error disappears and Ahmed is added.

## S-3: Ready-made message to copy or open in WhatsApp
*Serves J-1 · Implemented*

As a Bill Payer, I want a ready-made message with the share and my payment details that I can copy or open in WhatsApp, so that I can ask the group in one go.

- Given a valid split, then on Setup the message is always shown as text I can select.
- Given a valid split on Setup, when I press **Copy message**, then the clipboard holds exactly the text shown, the Track screen opens, and I see `Copied ✓ Now paste it in your WhatsApp group.`
- Given I'm on Track, when I open **Message for the group** and press **Copy message**, then the clipboard holds exactly the text shown, I stay on Track, and the button reads `Copied ✓` for about 2 seconds.
- Given the browser blocks clipboard access, when I press **Copy message**, then I see `Couldn't copy, select the text below`, the message text is visible and selectable, and I stay on the same screen.
- Given a valid split on Setup, when I press **Open in WhatsApp**, then a new tab opens at `https://wa.me/?text=` followed by the URL-encoded message, and the app moves to the Track screen.
- Given there's no valid split (my name, the total or friends are missing or invalid), then the message area shows `Add your name, a total and at least one friend to create the message` and both buttons are disabled.
- Given the message is showing on Setup, when I change the total, the people or the payment details, then the message updates straight away.

## S-4: One clear amount and where to send it
*Serves J-3 · Implemented*

As a Group Member, I want the message to give me one amount and where to send it, so that I can pay without asking questions.

- Given a total of `1000`, 3 people and payment details `Meezan · Waseek Ahmed · 0123456789`, then the message is exactly:
  ```
  Bill split: 1,000 PKR between 3 people
  Please send 334 PKR each to Waseek:
  Meezan · Waseek Ahmed · 0123456789
  Send a screenshot here once done 🙏
  ```
- Given the payment details are empty or only spaces, then the second line reads `Please send 334 PKR each to Waseek.` and there is no payment details line.
- Given any valid split, then the message shows exactly one amount to send and lists no friends' names.
- Given payment details over several lines, then they appear in the message exactly as typed, with spaces at the start and end trimmed.
- When I type or paste more than 200 characters into payment details, then the field stops at 200 characters.

## S-5: Tick people off as they pay
*Serves J-2 · Implemented*

As a Bill Payer, I want to tick people off as they pay and see how many have paid and how much is still owed, so that I know when I've got everything back.

Example bill: a total of `1000`, with Waseek, Ali and Sara.

- Given I'm on Track and no friend is ticked, then my row shows `paid (you)` and the summary reads `1 of 3 paid · 668 PKR still to collect`.
- When I tick Ali, then the summary reads `2 of 3 paid · 334 PKR still to collect`.
- When I also tick Sara, then the summary reads `Everyone has paid ✓`.
- Given Ali is ticked, when I untick him, then the summary goes back to `1 of 3 paid · 668 PKR still to collect` (if Sara is unticked).
- My own row can't be unticked.
- Given there's no valid split, then the Track screen can't be reached: both send buttons on Setup are disabled, and a reopened bill opens on Setup.

## S-6: Bill is still there later
*Serves J-2 · Implemented*

As a Bill Payer, I want my bill and ticks to still be there when I come back later, so that I can keep tracking over several days.

- Given a bill with Ali ticked, when I refresh the page or close and reopen the browser, then my name, the total, payment details, every person and Ali's tick are restored.
- Given the total field holds something invalid, such as `abc`, when I refresh, then the total field is empty. Only a valid whole-rupee total is saved.
- Given I was on Track, when I refresh, then Track opens. Given I was on Setup, then Setup opens.
- When I open the app in a different browser or on another device, then it starts with an empty bill.
- Given the saved data has been damaged (for example, edited by hand in developer tools), when I open the app, then it starts with an empty bill and does not crash.
- Given the browser blocks storage (for example, some private-browsing modes), when I use the app, then everything still works and I see `This bill can't be saved in this browser`.

## S-7: Warning before edits clear the ticks
*Serves J-2 · Implemented*

As a Bill Payer, I want to be warned that changing the total or the people will clear the ticks, so that I don't lose track of payments by accident.

A tick means "paid the current share". If the shares change, the ticks can't be trusted any more.

- Given I'm on Track, when I press **Edit bill**, then Setup opens with no warning and the ticks stay.
- Given the bill has been sent and the split is valid, then Setup shows **Back to payments**, which returns to Track.
- Given no friend is ticked, then on Setup I can change the total and add or remove people freely.
- Given at least one friend is ticked, then on Setup the total field and adding or removing people are locked, and I see `Locked because someone is ticked as paid.` with a **Change total or people** button.
- Given Ali and Sara are ticked, when I press **Change total or people**, then I see `This will clear 2 payment ticks. Continue?` with **Yes** and **Cancel**. With only one tick it reads `This will clear 1 payment tick. Continue?`
- When I press **Yes**, then all friends' ticks are cleared and the total and people become editable again.
- When I press **Cancel**, then nothing changes: the ticks stay and the fields stay locked.
- Given a friend is ticked, when I change my name or the payment details, then no warning appears and the ticks stay.

## S-8: Start a new bill
*Serves J-2 · Implemented*

As a Bill Payer, I want to start a new bill after confirming, so that the old one doesn't get mixed up with the next.

- When I press **New bill**, then I see `Start a new bill? This clears everything.` with **Yes** and **Cancel**, on the page itself, not as a browser pop-up.
- When I press **Yes**, then my name, the total, payment details, every person and every tick are cleared, and the empty Setup screen opens.
- Given I pressed **Yes**, when I refresh, then the bill is still empty.
- When I press **Cancel**, then nothing changes.

---

## Not implemented (next up)

### S-9: Custom amount for one person
*Serves J-1 · Not implemented*

As a Bill Payer, I want to set a fixed amount for one person, so that someone who only had tea doesn't pay for a full meal.
- Given a total of `1000` and 3 people, when I set Ali to `100`, then Sara and Waseek split the remaining `900`.
- Given the fixed amounts add up to more than the total, then I see an error and no split is shown.

### S-10: Paste a list of names
*Serves J-1 · Not implemented*

As a Bill Payer, I want to paste a list of names copied from the WhatsApp group, so that I don't have to type everyone one by one.
- Given I paste `Ali, Sara, Usman`, then all three are added. Duplicates and invalid names are skipped, with a message saying which ones.

### S-11: Partial payments
*Serves J-2 · Not implemented*

As a Bill Payer, I want to record how much someone sent when it's less than their share, so that I know exactly what they still owe.
- Given Usman owes `334`, when I record `200`, then he shows `owes 134 PKR` and isn't counted as paid.

### S-12: Several bills at once
*Serves J-2 · Not implemented*

As a Bill Payer, I want to track several bills at once, so that Friday's dinner and Sunday's fuel don't get mixed up.
- Given two saved bills, when I switch between them, then each one shows its own people and ticks.

### S-13: Screenshot as proof
*Serves J-2 · Not implemented*

As a Bill Payer, I want to attach someone's payment screenshot to their tick, so that I have proof if there's ever a question.
- Given Ali is ticked, when I attach an image, then it's shown next to his name. Before this can be built, storage needs a plan, because localStorage only holds about 5 MB.
