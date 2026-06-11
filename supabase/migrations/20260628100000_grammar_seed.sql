-- ═══════════════════════════════════════════════════════════════
-- Grammar Platform: seed data — 40 topics + 120 exercises
-- ═══════════════════════════════════════════════════════════════

-- ────────────────────── A1 TOPICS (8) ──────────────────────

INSERT INTO "GrammarTopic" (slug, title, level, "order", theoryMd, "isPublished") VALUES

('to-be', 'Verb To Be: am / is / are', 'A1', 1,
$$ ## Verb To Be

Use **am**, **is**, or **are** to say who you are, where you are, and how you feel.

| Subject | Verb | Example |
|---------|------|---------|
| I | **am** | I **am** a student. |
| He / She / It | **is** | She **is** happy. |
| You / We / They | **are** | We **are** friends. |

### Negative
- I am **not** tired. → I**'m not** tired.
- He is **not** here. → He**'s not** here.

### Questions
- **Are** you OK? — Yes, I **am**. / No, I**'m not**.
- **Is** she a teacher? — Yes, she **is**.

> ⚠️ **Common mistake:** Don't write *He are* or *She am*.
> ✅ He **is** | She **is** | It **is** $$, true),

('present-simple', 'Present Simple', 'A1', 2,
$$ ## Present Simple

Use Present Simple for **habits**, **routines**, **facts**, and **permanent situations**.

### Positive
| Subject | Verb | Note |
|---------|------|------|
| I / You / We / They | **work** | base form |
| He / She / It | **works** | add **-s** |

### Negative
- I **don't** like coffee.
- She **doesn't** watch TV.

### Questions
- **Do** you speak English?
- **Does** he live here?

### Time expressions
*every day · always · usually · often · sometimes · never*

> ⚠️ He **works** (not *work*). Always add **-s** for he/she/it! $$, true),

('articles', 'Articles: a / an / the', 'A1', 3,
$$ ## Articles

| Article | When to use | Example |
|---------|-------------|---------|
| **a** | singular, first mention, consonant sound | a **c**at, a **u**niversity |
| **an** | singular, first mention, vowel sound | an **a**pple, an **h**our |
| **the** | specific, already mentioned, unique | **the** sun, **the** book I told you about |
| *(no article)* | plural/uncountable in general | I like **dogs**. She drinks **coffee**. |

### Examples
- I have **a** dog. **The** dog is black.
- She is **an** engineer.
- **The** Moon goes around **the** Earth.

> ⚠️ *a hour* ❌ → *an hour* ✅  (we hear a vowel sound: /aʊər/) $$, true),

('plurals', 'Plural Nouns', 'A1', 4,
$$ ## Plural Nouns

### Regular plurals
| Rule | Singular → Plural |
|------|------------------|
| Most nouns | cat → cat**s** |
| -s, -sh, -ch, -x, -z | bus → bus**es** |
| consonant + -y | city → cit**ies** |
| -f / -fe | leaf → lea**ves** |
| -o | tomato → tomato**es** |

### Irregular plurals
| Singular | Plural |
|----------|--------|
| man | men |
| woman | women |
| child | children |
| tooth | teeth |
| foot | feet |
| person | people |

> ⚠️ *childs* ❌ → *children* ✅ $$, true),

('imperatives', 'Imperatives', 'A1', 5,
$$ ## Imperatives

Use imperatives to give **instructions**, **orders**, **advice**, or **invitations**.

### Positive imperative
Use the **base form** of the verb (no subject):
- **Open** the door.
- **Listen** carefully.
- **Come** in!

### Negative imperative
Add **Don't** before the verb:
- **Don't** run.
- **Don't** be late.

### Polite imperatives
Add **please** at the start or end:
- Please **sit down**.
- **Turn off** your phone, please.

> 💡 *Let's* + verb = suggestion for everyone:
> **Let's** go! | **Let's** eat! $$, true),

('there-is-are', 'There is / There are', 'A1', 6,
$$ ## There is / There are

Use *there is / there are* to say something **exists** or to describe a place.

| | Positive | Negative | Question |
|--|---------|----------|---------|
| Singular | There **is** a book. | There **isn't** a book. | **Is there** a book? |
| Plural | There **are** two cats. | There **aren't** any cats. | **Are there** any cats? |

### Examples
- There **is** a park near my house.
- There **are** 30 students in my class.
- **Is there** a toilet here? — Yes, there **is**.

> ⚠️ *There is* → one thing. *There are* → two or more. $$, true),

('prepositions-place', 'Prepositions of Place', 'A1', 7,
$$ ## Prepositions of Place

| Preposition | Meaning | Example |
|-------------|---------|---------|
| **in** | inside a space | in the box, in London |
| **on** | on a surface | on the table, on the wall |
| **at** | a specific point | at the door, at school |
| **under** | below | under the bed |
| **next to** | beside | next to the window |
| **between** | in the middle of two | between the sofa and the wall |
| **in front of** | facing | in front of the TV |
| **behind** | at the back | behind the door |

> 💡 *at home* · *at work* · *at school* — no article needed! $$, true),

('possessives', 'Possessive ''s', 'A1', 8,
$$ ## Possessive 's

Use **apostrophe + s** ('s) to show that something **belongs** to someone.

### Structure: **owner + 's + thing**
- my **sister's** phone → the phone belongs to my sister
- **Tom's** cat → the cat belongs to Tom
- my **parents'** car → (plural owners: just add **'**)

### Possessive pronouns
| Subject | Possessive adjective | Possessive pronoun |
|---------|---------------------|-------------------|
| I | **my** | mine |
| you | **your** | yours |
| he | **his** | his |
| she | **her** | hers |
| we | **our** | ours |
| they | **their** | theirs |

> ⚠️ *its* (no apostrophe) = belongs to it. *it's* = it is. $$, true);

-- ────────────────────── A2 TOPICS (10) ──────────────────────

INSERT INTO "GrammarTopic" (slug, title, level, "order", theoryMd, "isPublished") VALUES

('present-continuous', 'Present Continuous', 'A2', 1,
$$ ## Present Continuous

Use Present Continuous for actions **happening now** or **temporary situations**.

### Structure: **am/is/are + verb-ing**
- I **am working** right now.
- She **is studying** this week.
- They **are not watching** TV.
- **Are** you **listening**?

### Spelling: adding -ing
| Rule | Example |
|------|---------|
| Most verbs | work → work**ing** |
| -e at end → remove e | come → com**ing** |
| Short verb + consonant → double | run → runn**ing**, sit → sitt**ing** |

### Present Simple vs Continuous
- I **drink** coffee every day. *(habit)*
- I **am drinking** coffee now. *(right now)*

> ⚠️ Stative verbs don't use -ing: *know, like, love, want, need, have* $$, true),

('past-simple', 'Past Simple', 'A2', 2,
$$ ## Past Simple

Use Past Simple for **completed actions** in the past.

### Regular verbs: add **-ed**
- work → worked | play → played | study → studied

### Negative & Questions: use **did**
- I **didn't** go to school.
- **Did** she call you?

### Irregular verbs (most common)
| Base | Past | Base | Past |
|------|------|------|------|
| go | **went** | have | **had** |
| come | **came** | make | **made** |
| see | **saw** | take | **took** |
| say | **said** | get | **got** |
| know | **knew** | give | **gave** |

### Time expressions: *yesterday · last week · in 2020 · ago · when*

> ⚠️ *I did went* ❌ → *I went* ✅  (no **did** with the irregular form) $$, true),

('going-to', 'Going To (Future Plans)', 'A2', 3,
$$ ## Going To

Use **going to** for **plans you have already decided** and **predictions based on evidence**.

### Structure: **am/is/are + going to + base verb**
- I **am going to visit** my friend tomorrow.
- She **is going to start** a new job.
- Look at those clouds — it **is going to rain**.

### Negative & Questions
- He **isn't going to** come.
- **Are** you **going to** study tonight?

### Going to vs Will
| | Going to | Will |
|-|---------|------|
| Use | plans & evidence | spontaneous decisions & predictions |
| Example | I'm **going to** cook dinner. (already planned) | I**'ll** help you! (just decided) |

> 💡 *gonna* is the informal spoken form of *going to*. $$, true),

('modal-can-could', 'Can and Could', 'A2', 4,
$$ ## Can and Could

### Can — present ability & permission
- I **can** swim. *(ability)*
- **Can** I open the window? *(permission)*
- You **can't** park here. *(prohibition)*

### Could — past ability & polite requests
- When I was 5, I **could** read. *(past ability)*
- **Could** you help me, please? *(polite request)*

### Structure: modal + base verb (no -s, no -ing, no -ed)
- She **can** speak three languages. *(not *cans*)*
- **Could** you repeat that?

| | Present/Future | Past |
|-|----------------|------|
| Ability | **can** | **could** |
| Permission | **can** / may | **could** |
| Request | **can** | **could** (more polite) |

> ⚠️ *She can speaks* ❌ → *She can speak* ✅ $$, true),

('comparatives', 'Comparatives and Superlatives', 'A2', 5,
$$ ## Comparatives and Superlatives

### Comparatives: comparing two things
| Adjective | Comparative | Rule |
|-----------|-------------|------|
| tall | tall**er** | short adj + -er |
| big | bigg**er** | double consonant |
| happy | happ**ier** | -y → -ier |
| expensive | **more** expensive | long adj |
| good | **better** | irregular |
| bad | **worse** | irregular |

- My car is **faster than** yours.
- English is **more difficult than** Maths. *(for me)*

### Superlatives: best/worst in a group
| Adjective | Superlative |
|-----------|-------------|
| tall | **the** tall**est** |
| expensive | **the most** expensive |
| good | **the best** |

- She is **the best** student in the class.
- This is **the most beautiful** place I have ever seen.

> ⚠️ Always use **the** before superlatives. $$, true),

('past-continuous', 'Past Continuous', 'A2', 6,
$$ ## Past Continuous

Use Past Continuous for an action **in progress at a specific moment in the past**, or as a **background action** interrupted by Past Simple.

### Structure: **was/were + verb-ing**
- At 8pm I **was watching** TV.
- They **were playing** football when it started to rain.

### Positive / Negative / Question
- She **was sleeping**. → She **wasn't sleeping**. → **Was** she **sleeping**?

### When vs While
| | Tense | Example |
|-|-------|---------|
| **when** (at the moment) | Past Simple | **When** he arrived, we **had** dinner. |
| **while** (during an action) | Past Continuous | **While** she **was cooking**, the phone rang. |

> 💡 Two background actions → both Past Continuous:
> *While I **was reading**, she **was listening** to music.* $$, true),

('adverbs-frequency', 'Adverbs of Frequency', 'A2', 7,
$$ ## Adverbs of Frequency

Adverbs of frequency say **how often** something happens.

### Frequency scale
| Adverb | Approximate frequency |
|--------|----------------------|
| always | 100% |
| usually | ~80% |
| often | ~60% |
| sometimes | ~40% |
| rarely / seldom | ~20% |
| never | 0% |

### Position in sentence
- **Before the main verb:** I **always** drink tea.
- **After to be:** She **is usually** on time.
- **At start or end (sometimes/usually):** **Sometimes** I work late.

> ⚠️ *I drink always tea* ❌ → *I **always** drink tea* ✅ $$, true),

('questions', 'Question Forms', 'A2', 8,
$$ ## Question Forms

### Yes/No questions
Use **auxiliary + subject + verb**:
- **Do** you like music?
- **Is** she at home?
- **Did** they arrive?
- **Have** you ever been to Paris?

### Wh- questions
Use **wh-word + auxiliary + subject + verb**:
| Wh-word | Ask about |
|---------|----------|
| **What** | things / actions |
| **Who** | people (subject or object) |
| **Where** | place |
| **When** | time |
| **Why** | reason |
| **How** | manner / degree |

- **Where do** you live?
- **What are** you doing?
- **Why did** she leave?

### Subject questions (*Who* / *What* as subject)
- **Who** called you? *(no auxiliary!)*
- **What** happened? $$, true),

('prepositions-time', 'Prepositions of Time: in / on / at', 'A2', 9,
$$ ## Prepositions of Time

### Quick rule
| Preposition | Use with | Examples |
|-------------|---------|---------|
| **at** | clock times, specific moments | **at** 7pm, **at** midnight, **at** Christmas |
| **on** | days, dates | **on** Monday, **on** 15 June, **on** my birthday |
| **in** | months, years, seasons, longer periods | **in** July, **in** 2020, **in** winter, **in** the morning |

### Examples
- The train leaves **at** 9:30.
- I was born **on** 3 April.
- School starts **in** September.
- I usually study **in** the evening.

> ⚠️ No preposition with *today / tomorrow / yesterday / next week / last year*:
> *I'll see you **tomorrow*** (not ~~on tomorrow~~) $$, true),

('modal-should-must', 'Should and Must', 'A2', 10,
$$ ## Should and Must

### Should — advice & recommendation
- You **should** see a doctor. *(I advise you to)*
- You **shouldn't** eat so much sugar.
- **Should** I call her? *(asking for advice)*

### Must — strong obligation & logical deduction
- You **must** wear a seatbelt. *(rule/law)*
- He **must** be tired — he worked 12 hours. *(logical deduction)*
- I **must** remember to call mum. *(personal obligation)*

### Mustn't vs Don't have to
| | Meaning |
|-|---------|
| **mustn't** | it is forbidden / wrong |
| **don't have to** | it is not necessary (but allowed) |

- You **mustn't** smoke here. *(prohibited)*
- You **don't have to** come early. *(no need to, but you can)* $$, true);

-- ────────────────────── B1 TOPICS (12) ──────────────────────

INSERT INTO "GrammarTopic" (slug, title, level, "order", theoryMd, "isPublished") VALUES

('present-perfect', 'Present Perfect', 'B1', 1,
$$ ## Present Perfect

### Structure: **have/has + past participle**

Use for:
- **Life experiences** (ever/never): Have you **ever been** to Japan?
- **Recent events with present result**: I've **lost** my keys. *(I still don't have them)*
- **Unfinished periods**: She has **lived** here **for** 10 years. *(still lives here)*

### Key words
| Present Perfect | Past Simple |
|----------------|-------------|
| ever, never, already, yet, just | yesterday, last week, in 2019, ago |
| for, since | specific finished time |

### For vs Since
- I have studied English **for** 5 years. *(duration)*
- I have studied English **since** 2019. *(start point)* $$, true),

('conditionals-1', 'First Conditional', 'B1', 2,
$$ ## First Conditional

Use the First Conditional for **real and possible situations** in the present or future.

### Structure
**If + Present Simple, will + base verb**

- **If it rains**, I **will** take an umbrella.
- **If you study** hard, you **will** pass the exam.
- I **will** call you **if** I'm late.

### Variations
| Main clause modal | Meaning |
|------------------|---------|
| will | certain result |
| can | ability/permission |
| might | possible result |
| should | advice |

- If you're cold, you **can** close the window.
- If she's late, she **might** miss the bus.

> ⚠️ Never use *will* in the *if*-clause:
> *If it **will rain*** ❌ → *If it **rains*** ✅ $$, true),

('conditionals-2', 'Second Conditional', 'B1', 3,
$$ ## Second Conditional

Use the Second Conditional for **unreal or hypothetical situations** in the present or future — things that are unlikely or impossible.

### Structure
**If + Past Simple, would + base verb**

- **If I had** a million dollars, I **would** travel the world.
- **If she spoke** Chinese, she **would** get that job.
- What **would** you do **if** you won the lottery?

### Were (not was) in formal English
- If I **were** you, I would apologise. *(advice)*
- If he **were** taller, he could be a model.

### First vs Second Conditional
| | First | Second |
|-|-------|--------|
| Situation | possible/real | unreal/hypothetical |
| If-clause | Present Simple | Past Simple |
| Main clause | will | would | $$, true),

('passive-present', 'Passive Voice: Present Tenses', 'B1', 4,
$$ ## Passive Voice: Present Tenses

Use the passive when the **action** is more important than **who does it**, or when we don't know who does it.

### Present Simple Passive: **am/is/are + past participle**
- English **is spoken** in many countries.
- These cars **are made** in Germany.
- The office **is cleaned** every day.

### Present Continuous Passive: **am/is/are + being + past participle**
- The road **is being repaired** right now.
- A new hospital **is being built** in the city.

### Mentioning the agent: **by**
- This painting **was created** by Picasso.
- The report **is being written** by the manager.

> 💡 If the agent is unknown or unimportant, omit *by ...*:
> *My bike **was stolen**.* (we don't know who) $$, true),

('passive-past', 'Passive Voice: Past Tenses', 'B1', 5,
$$ ## Passive Voice: Past Tenses

### Past Simple Passive: **was/were + past participle**
- The Eiffel Tower **was built** in 1889.
- The windows **were broken** last night.
- **Was** the letter **sent** yesterday?

### Past Continuous Passive: **was/were + being + past participle**
- The patient **was being examined** when I arrived.

### Present Perfect Passive: **have/has + been + past participle**
- The results **have been announced**.
- Three people **have been arrested**.

### Passive of modals: **modal + be + past participle**
- The form **must be completed** in full.
- Bags **can be left** at reception. $$, true),

('relative-clauses', 'Relative Clauses', 'B1', 6,
$$ ## Relative Clauses

Relative clauses give **extra information** about a noun.

### Defining relative clauses (no commas — essential info)
| Pronoun | Refers to |
|---------|----------|
| **who** | people |
| **which** | things |
| **that** | people or things |
| **whose** | possession |
| **where** | place |

- The woman **who called** you is my teacher.
- The book **that/which** I read was amazing.
- The house **where** I grew up is now a museum.

### Non-defining relative clauses (with commas — extra info)
- My sister, **who lives in London**, is a doctor. *(can't use that)*
- The Eiffel Tower, **which was built in 1889**, attracts millions. $$, true),

('reported-speech', 'Reported Speech', 'B1', 7,
$$ ## Reported Speech

When reporting what someone said, **tenses shift back** (backshift).

### Tense changes
| Direct speech | Reported speech |
|--------------|----------------|
| Present Simple | Past Simple |
| Present Continuous | Past Continuous |
| Past Simple | Past Perfect |
| will | would |
| can | could |
| must | had to |

### Examples
- "I **am** tired." → She said she **was** tired.
- "I **will** help." → He said he **would** help.
- "I **can** swim." → She said she **could** swim.

### Pronouns & time expressions also change
- "I'll see you **tomorrow**." → She said she would see me **the next day**. $$, true),

('gerunds-infinitives', 'Gerunds and Infinitives', 'B1', 8,
$$ ## Gerunds and Infinitives

### Gerund (verb + -ing) as a noun
- **Swimming** is good exercise.
- I enjoy **reading**.
- She is good **at cooking**.

### Verbs followed by gerund
*enjoy · finish · avoid · suggest · mind · consider · keep*
- I **enjoy watching** films.
- Stop **talking**!

### Infinitive (to + base verb)
- I **want to learn** Spanish.
- She **decided to leave** early.

### Verbs followed by infinitive
*want · need · decide · hope · plan · agree · refuse*
- He **refused to answer**.

### Both (with meaning change)
| Verb | Gerund | Infinitive |
|------|--------|-----------|
| remember | past action | future action |
| stop | stop the action | stop to do sth else |
| try | experiment | attempt | $$, true),

('present-perfect-continuous', 'Present Perfect Continuous', 'B1', 9,
$$ ## Present Perfect Continuous

### Structure: **have/has + been + verb-ing**

Use for:
- **How long** an action has been in progress (still continuing):
  - I **have been studying** English **for** 3 years.
  - She **has been waiting** **since** 2 o'clock.
- **Recently finished actions** with a visible result:
  - You look tired — have you **been running**?

### Present Perfect vs Present Perfect Continuous
| | Present Perfect | Present Perfect Continuous |
|-|----------------|--------------------------|
| Focus | completed action / result | duration / ongoing process |
| Example | I**'ve written** 3 emails. | I**'ve been writing** emails all day. | $$, true),

('modal-would-might', 'Would and Might', 'B1', 10,
$$ ## Would and Might

### Would — hypothetical & polite
- I **would love** to visit Japan. *(hypothetical wish)*
- **Would** you like some tea? *(polite offer)*
- I **would** call her if I had her number. *(2nd conditional)*

### Might — possibility (weaker than may)
- It **might** rain later. *(~40-50% chance)*
- She **might** know the answer.
- **Might** I ask a question? *(very formal)*

### Might vs May vs Could
| Modal | Probability |
|-------|------------|
| **may** | ~50% — I **may** go to the party. |
| **might** | ~40% — I **might** go. |
| **could** | ~30% — I **could** go if I finish early. |

> 💡 In conversation: *might* and *may* are almost interchangeable. $$, true),

('countable-uncountable', 'Countable and Uncountable Nouns', 'B1', 11,
$$ ## Countable and Uncountable Nouns

### Countable — can be counted, have a plural
- a **book** / two **books** / some **books**
- an **idea** / three **ideas**

### Uncountable — no plural, no *a/an*
Common categories: liquids · materials · abstract ideas · food categories
- **water**, **bread**, **advice**, **information**, **money**, **furniture**

### Quantifiers
| | Countable | Uncountable |
|-|-----------|------------|
| some/any | some **books** | some **water** |
| many/much | **many** books | **much** water |
| a few/a little | a **few** books | a **little** water |
| a lot of | a lot of books | a lot of water |

> ⚠️ *informations* ❌ | *an advice* ❌ | *furnitures* ❌
> These are always uncountable — use *some / a piece of*. $$, true),

('both-either-neither', 'Both, Either, Neither', 'B1', 12,
$$ ## Both, Either, Neither

Used when talking about **two people or things**.

### Both — the two (positive)
- **Both** students passed the exam.
- I like **both** options.
- **Both of** them are right.

### Either — one or the other (choice)
- You can take **either** road — they both lead to town.
- **Either** of you can answer.

### Neither — not one, not the other (negative)
- **Neither** student failed.
- I like **neither** option.
- **Neither of** them knows.

### Verb agreement
- **Both** my parents **are** teachers.
- **Either/Neither** option **is** fine. *(singular verb with either/neither)* $$, true);

-- ────────────────────── B2 TOPICS (10) ──────────────────────

INSERT INTO "GrammarTopic" (slug, title, level, "order", theoryMd, "isPublished") VALUES

('conditionals-3', 'Third Conditional', 'B2', 1,
$$ ## Third Conditional

Use the Third Conditional to talk about **unreal situations in the past** — things that didn't happen.

### Structure
**If + Past Perfect, would have + past participle**

- **If I had studied** harder, I **would have passed** the exam. *(I didn't study → I didn't pass)*
- **If she had left** earlier, she **wouldn't have missed** the train.

### Common uses
- **Regret:** If only I hadn't said that...
- **Criticism:** You would have felt better if you'd slept more.
- **Speculation:** What would have happened if he hadn't been there?

> ⚠️ *If I would have studied* ❌ → *If I **had** studied* ✅ $$, true),

('mixed-conditionals', 'Mixed Conditionals', 'B2', 2,
$$ ## Mixed Conditionals

Mixed conditionals combine time frames — one clause is past, one is present/future.

### Past → Present (unreal past cause, present consequence)
**If + Past Perfect, would + base verb**
- If I **had taken** that job, I **would be** rich now. *(I didn't take it → I'm not rich now)*

### Present → Past (unreal present situation, past consequence)
**If + Past Simple, would have + past participle**
- If I **were** more organised, I **would have finished** this yesterday. *(I'm not organised → I didn't finish)*

### Key test: which clause is about the past? which about now?
- *If I had listened to my teacher* → past (I didn't)
- *I would speak better English now* → present (the result today) $$, true),

('wish-clauses', 'Wish Clauses', 'B2', 3,
$$ ## Wish Clauses

### Wish about present (unreal, you want it to be different)
**Wish + Past Simple**
- I **wish** I **knew** the answer. *(I don't know)*
- She **wishes** she **lived** somewhere warmer.
- I **wish** I **were** taller. *(were, not was — formal)*

### Wish about past (regret)
**Wish + Past Perfect**
- I **wish** I **had studied** harder. *(I didn't study hard enough — regret)*
- He **wishes** he **hadn't said** that.

### Wish for change (annoying habit)
**Wish + would + base verb**
- I **wish** you **would stop** making that noise! *(please change your behaviour)*

### If only (stronger emotion than wish)
- **If only** I had more time!
- **If only** she **hadn't left** so early. $$, true),

('passive-advanced', 'Passive Voice: Advanced', 'B2', 4,
$$ ## Passive Voice: Advanced

### Perfect and modal passives
| Tense | Structure |
|-------|-----------|
| Future passive | will be + pp |
| Perfect passive | have/has been + pp |
| Modal passive | modal + be + pp |
| Perfect modal | modal + have been + pp |

- The results **will be published** tomorrow.
- The meeting **has been postponed**.
- This rule **must be followed** at all times.
- She **should have been informed** earlier.

### Passive reporting verbs
- It **is said** that he is very rich.
- He **is believed** to be in hiding.
- They **are reported to have** escaped.

### Have/Get something done (causative)
- I **had** my car **repaired**. *(someone else did it for me)*
- She **got** her hair **cut** yesterday. $$, true),

('reported-advanced', 'Reported Speech: Advanced', 'B2', 5,
$$ ## Reported Speech: Advanced

### Reporting questions
**Wh- questions:** reporting verb + wh-word + subject + verb
- "Where do you live?" → She asked me **where I lived**.
- "What are you doing?" → He wanted to know **what I was doing**.

**Yes/No questions:** reporting verb + if/whether + subject + verb
- "Do you like jazz?" → She asked **if/whether I liked** jazz.

### Reporting orders and requests
- "Open the window!" → He told me **to open** the window.
- "Please don't be late." → She asked me **not to be** late.

### Reporting suggestions
- "Let's go for a walk." → He suggested **going** for a walk.
- "Why don't you try again?" → She suggested **that I try** again.

### No backshift — when to keep the original tense
If the situation is still true: *She said she **loves** Paris. (still true)* $$, true),

('modal-perfect', 'Modal Perfect', 'B2', 6,
$$ ## Modal Perfect

Use **modal + have + past participle** to speculate or comment on **past situations**.

| Modal perfect | Meaning | Example |
|--------------|---------|---------|
| **must have** + pp | logical deduction (certain) | He **must have forgotten** his keys. |
| **can't have** + pp | logical deduction (impossible) | She **can't have seen** us — she was away. |
| **could have** + pp | past possibility (didn't happen) | I **could have been** a doctor, but I chose art. |
| **should have** + pp | past advice/criticism (didn't happen) | You **should have told** me earlier! |
| **might/may have** + pp | past possibility (uncertain) | They **might have left** already. |

> ⚠️ *He must forgot* ❌ → *He **must have forgotten*** ✅ $$, true),

('inversion', 'Inversion', 'B2', 7,
$$ ## Inversion

Inversion = putting the auxiliary or verb **before** the subject. Used in formal English for emphasis.

### After negative adverbials
- **Never have I seen** such a mess. *(Never I have seen ❌)*
- **Rarely does she** complain.
- **Not only did** he lie, but he also stole money.
- **Hardly had** we left **when** it started to rain.

### After *only* phrases
- **Only then did** I understand.
- **Only after reading** the report **did** they realise the truth.

### After *so/such* (formal exclamation)
- **So tired was** she that she fell asleep immediately.

### Conditional inversion (formal if-clauses)
- **Had I known** = If I had known
- **Were I** to help = If I were to help
- **Should you** need anything = If you should need anything $$, true),

('participle-clauses', 'Participle Clauses', 'B2', 8,
$$ ## Participle Clauses

Participle clauses replace full relative/adverbial clauses. They make writing more concise and formal.

### Present participle (-ing) — simultaneous or cause
- **Seeing the danger**, he jumped back. *(= Because he saw the danger...)*
- The woman **standing by the door** is my manager. *(= who is standing)*

### Past participle (-ed/irregular) — passive or completed action
- **Written in 1950**, the novel is still popular. *(= which was written)*
- **Shocked by the news**, she sat down quietly.

### Perfect participle — action before main verb
- **Having finished** his work, he went home. *(= After he had finished)*

> ⚠️ Both clauses must share the same subject:
> ***Turning the corner**, a dog bit him.* ❌ (who turned the corner?)
> ***Turning the corner**, he saw a dog.* ✅ $$, true),

('cleft-sentences', 'Cleft Sentences', 'B2', 9,
$$ ## Cleft Sentences

Cleft sentences highlight a specific part of the sentence for emphasis.

### It-cleft: **It + be + emphasis + that/who-clause**
- **It was John** who called you. *(not someone else)*
- **It was yesterday** that she arrived.
- **It is money** that they want.

### Wh-cleft (pseudo-cleft): **What + clause + be + emphasis**
- **What I need** is a good sleep.
- **What surprised me** was her reaction.
- **What he did** was (to) resign.

### All-cleft (strong emphasis)
- **All I want** is some peace and quiet.
- **All she did** was smile.

> 💡 Use cleft sentences in writing to focus the reader's attention, or in speech to correct a misunderstanding:
> "Did Sarah call?" — "No, **it was Emma** who called." $$, true),

('articles-advanced', 'Articles: Advanced Use', 'B2', 10,
$$ ## Articles: Advanced Use

### Generic reference (talking about a whole group)
- **The** whale is an endangered species. *(= whales in general — formal)*
- **A** whale can hold its breath for hours. *(= any typical whale)*
- **Whales** are endangered. *(= the species in general — most natural)*

### No article: institutions and places
- go to **school / hospital / prison / church** *(function)*
- go to **the school / the hospital** *(specific building)*

### No article: set phrases
- at **home** · go to **bed** · by **car/train/bus** · on **foot**

### Unique nouns vs. counted roles
- **the** President of France *(unique role at a time)*
- She was **elected** president. *(no article — describing the role, not the person)* $$, true);

-- ═══════════════════════════════════════════════════════════════
-- EXERCISES: 3 per topic (mix of MCQ and FILL)
-- ═══════════════════════════════════════════════════════════════

-- to-be exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  'Choose the correct form: "She ___ a doctor."',
  '["am","is","are","be"]'::jsonb,
  'is', 'He/She/It → is', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'to-be';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  'Choose the correct form: "We ___ best friends."',
  '["am","is","are","been"]'::jsonb,
  'are', 'You/We/They → are', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'to-be';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'Fill in the blank: "I ___ not hungry right now."',
  NULL,
  'am', 'I → am', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'to-be';

-- present-simple exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  'Choose the correct form: "He ___ to school every day."',
  '["go","goes","going","gone"]'::jsonb,
  'goes', 'He/She/It → add -s to the verb', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'present-simple';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"___ they like pizza?" — "Yes, they do."',
  '["Is","Does","Do","Are"]'::jsonb,
  'Do', 'I/You/We/They → Do (questions)', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'present-simple';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'She ___ (not/watch) TV in the mornings. Use the correct negative form.',
  NULL,
  'doesn''t watch', 'He/She/It → doesn''t + base verb', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'present-simple';

-- articles exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  'Choose the correct article: "___ umbrella"',
  '["a","an","the","—"]'::jsonb,
  'an', 'Umbrella starts with a vowel sound /ʌ/', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'articles';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"I have a cat. ___ cat is black." Which article fits?',
  '["A","An","The","—"]'::jsonb,
  'The', 'Second mention → the', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'articles';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'I usually drink ___ coffee in the morning. (general, uncountable)',
  NULL,
  '—|no article', 'Uncountable noun in general sense → no article', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'articles';

-- plurals exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  'What is the plural of "child"?',
  '["childs","childes","children","childer"]'::jsonb,
  'children', 'child → children (irregular)', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'plurals';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  'What is the plural of "city"?',
  '["citys","cityes","cities","cityes"]'::jsonb,
  'cities', 'consonant + y → drop y, add -ies', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'plurals';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'There are three ___ in the garden. (woman)',
  NULL,
  'women', 'woman → women (irregular plural)', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'plurals';

-- imperatives exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  'Which sentence is a correct negative imperative?',
  '["Don''t run!","Not run!","You don''t run!","No running you!"]'::jsonb,
  'Don''t run!', 'Negative imperative = Don''t + base verb', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'imperatives';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"___ go to the beach this afternoon!" (suggestion for everyone)',
  '["Let''s","Lets","Let us to","We let''s"]'::jsonb,
  'Let''s', 'Let''s + base verb = suggestion for all', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'imperatives';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  '___ quiet, please! (be)',
  NULL,
  'Be', 'Imperative of "to be" = Be', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'imperatives';

-- there-is-are exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"___ a supermarket near here?"',
  '["There is","Is there","Are there","There are"]'::jsonb,
  'Is there', 'Question form: Is there (singular)', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'there-is-are';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"There ___ twelve students in the class."',
  '["is","are","am","be"]'::jsonb,
  'are', 'twelve students = plural → there are', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'there-is-are';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'There ___ any milk in the fridge. (negative, singular)',
  NULL,
  'isn''t', 'Negative singular: there isn''t', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'there-is-are';

-- prepositions-place exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"My keys are ___ the table." (on the surface)',
  '["in","on","at","under"]'::jsonb,
  'on', 'on = on a surface', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'prepositions-place';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"She is ___ school right now."',
  '["in","on","at","to"]'::jsonb,
  'at', 'at school/work/home = at a place/institution', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'prepositions-place';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'The cat is hiding ___ the bed.',
  NULL,
  'under', 'under = below something', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'prepositions-place';

-- possessives exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  'Which is correct?',
  '["The car of my parents","My parents car","My parents'' car","My parents''s car"]'::jsonb,
  'My parents'' car', 'Plural owners: add only '' (apostrophe)', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'possessives';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"Is that ___ phone?" (belonging to him)',
  '["him","he''s","his","her"]'::jsonb,
  'his', 'his = possessive adjective for he', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'possessives';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'That is my sister ___ laptop. (use possessive ''s)',
  NULL,
  'sister''s', 'owner''s + thing: sister''s laptop', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'possessives';

-- present-continuous exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"Listen! She ___ in the next room."',
  '["sing","sings","is singing","singing"]'::jsonb,
  'is singing', 'Right now → is/am/are + -ing', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'present-continuous';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  'Which is the correct -ing spelling of "run"?',
  '["runing","runnng","running","runeing"]'::jsonb,
  'running', 'Short verb ending in consonant: double the consonant', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'present-continuous';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'We ___ (not/work) today — it is a holiday.',
  NULL,
  'aren''t working', 'Negative present continuous: aren''t + verb-ing', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'present-continuous';

-- past-simple exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"I ___ to Paris last summer."',
  '["go","goes","went","gone"]'::jsonb,
  'went', 'go → went (irregular past)', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'past-simple';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"She ___ work yesterday." (negative)',
  '["didn''t worked","didn''t work","not worked","wasn''t work"]'::jsonb,
  'didn''t work', 'Negative past: didn''t + base verb', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'past-simple';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'We ___ (study) all night before the exam.',
  NULL,
  'studied', 'study → studied (regular: -y changes to -ied)', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'past-simple';

-- going-to exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"Look at those dark clouds — it ___ rain!"',
  '["will","is going to","goes to","shall"]'::jsonb,
  'is going to', 'Evidence visible now → going to', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'going-to';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"___ you going to come to the party?"',
  '["Do","Will","Are","Is"]'::jsonb,
  'Are', 'Question: Are/Am/Is + subject + going to', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'going-to';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'He ___ (not/going to) buy a new car this year.',
  NULL,
  'isn''t going to', 'Negative: isn''t/aren''t going to + base verb', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'going-to';

-- modal-can-could exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  'Which sentence is correct?',
  '["She cans speak French.","She can speaks French.","She can speak French.","She can to speak French."]'::jsonb,
  'She can speak French.', 'Modal + base verb (no -s, no to)', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'modal-can-could';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"When I was young, I ___ run very fast." (past ability)',
  '["can","could","am able","will"]'::jsonb,
  'could', 'Past ability: could', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'modal-can-could';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  '___ you help me with this, please? (polite request)',
  NULL,
  'Could', 'Polite request: Could you...?', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'modal-can-could';

-- comparatives exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"This exam is ___ than the last one." (difficult)',
  '["more difficult","difficulter","most difficult","difficultier"]'::jsonb,
  'more difficult', 'Long adjectives: more + adjective', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'comparatives';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"She is ___ student in the class." (good, superlative)',
  '["the better","the most good","the best","the goodest"]'::jsonb,
  'the best', 'good → better → the best (irregular)', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'comparatives';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'My bag is ___ (heavy) than yours.',
  NULL,
  'heavier', 'heavy → heavier (short adj ending in -y: change to -ier)', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'comparatives';

-- past-continuous exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"At 9pm last night, I ___ a book."',
  '["read","was reading","were reading","am reading"]'::jsonb,
  'was reading', 'I + was + verb-ing', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'past-continuous';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"They ___ football when it started to rain."',
  '["play","played","were playing","are playing"]'::jsonb,
  'were playing', 'Background action (interrupted): were + verb-ing', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'past-continuous';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  '___ you sleeping when I called? (question form)',
  NULL,
  'Were', 'Question: Were/Was + subject + verb-ing?', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'past-continuous';

-- adverbs-frequency exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"She ___ drinks coffee." Where does "always" go?',
  '["She always drinks coffee.","Always she drinks coffee.","She drinks always coffee.","She drinks coffee always."]'::jsonb,
  'She always drinks coffee.', 'Adverb of frequency goes before the main verb', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'adverbs-frequency';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"He is ___ on time." (never late)',
  '["He never is on time.","He is never on time.","Never he is on time.","He is on time never."]'::jsonb,
  'He is never on time.', 'After the verb "to be": subject + is/are + adverb', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'adverbs-frequency';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'I ___ eat breakfast. (0% of the time — I skip it every day)',
  NULL,
  'never', '0% → never', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'adverbs-frequency';

-- questions exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"___ does she live?" (asking about place)',
  '["What","Who","Where","When"]'::jsonb,
  'Where', 'Where = asking about place', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'questions';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"___ called you?" — "My mum." (who is the subject)',
  '["Who did call","Who called","Did who call","Whom called"]'::jsonb,
  'Who called', 'Subject question: Who + verb (no auxiliary)', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'questions';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  '___ you like to go to the cinema? (yes/no, present)',
  NULL,
  'Would|Do', 'Would you like = polite offer; Do you like = general preference', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'questions';

-- prepositions-time exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"The meeting starts ___ 3 o''clock."',
  '["in","on","at","by"]'::jsonb,
  'at', 'Clock times → at', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'prepositions-time';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"I was born ___ April."',
  '["at","on","in","by"]'::jsonb,
  'in', 'Months → in', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'prepositions-time';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'She has a dentist appointment ___ Monday.',
  NULL,
  'on', 'Days → on', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'prepositions-time';

-- modal-should-must exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"You ___ smoke here — it is forbidden."',
  '["shouldn''t","mustn''t","don''t have to","couldn''t"]'::jsonb,
  'mustn''t', 'Prohibition (forbidden) → mustn''t', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'modal-should-must';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"You ___ pay — it''s free!" (no obligation)',
  '["mustn''t","shouldn''t","don''t have to","can''t"]'::jsonb,
  'don''t have to', 'No obligation: don''t have to', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'modal-should-must';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'You look pale. You ___ see a doctor. (advice)',
  NULL,
  'should', 'Advice: should + base verb', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'modal-should-must';

-- present-perfect exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"I ___ my keys. I can''t find them." (recent result)',
  '["lost","have lost","had lost","lose"]'::jsonb,
  'have lost', 'Recent result affecting now → present perfect', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'present-perfect';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"Have you ___ tried sushi?"',
  '["ever","never","yet","since"]'::jsonb,
  'ever', 'Life experience question: have you ever + pp?', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'present-perfect';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'She has worked here ___ 2018. (starting point)',
  NULL,
  'since', 'Starting point → since; Duration → for', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'present-perfect';

-- conditionals-1 exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"If it ___ tomorrow, we will cancel the trip."',
  '["will rain","rains","rained","is raining"]'::jsonb,
  'rains', 'If-clause in 1st conditional: Present Simple', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'conditionals-1';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"If you press that button, the alarm ___."',
  '["goes off","will go off","go off","would go off"]'::jsonb,
  'will go off', 'Main clause in 1st conditional: will + base verb', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'conditionals-1';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'I ___ you if I find out the answer. (1st conditional)',
  NULL,
  'will tell', 'Main clause: will + base verb', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'conditionals-1';

-- conditionals-2 exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"If I ___ more money, I would travel the world."',
  '["have","will have","had","would have"]'::jsonb,
  'had', 'If-clause in 2nd conditional: Past Simple', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'conditionals-2';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"If I ___ you, I would apologise."',
  '["am","was","were","will be"]'::jsonb,
  'were', 'Formal 2nd conditional: If I were you (not was)', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'conditionals-2';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'She would get the job if she ___ more experience. (have)',
  NULL,
  'had', 'If-clause: Past Simple (even if meaning is present)', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'conditionals-2';

-- passive-present exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"English ___ all over the world." (passive present simple)',
  '["speaks","is spoken","has spoken","was spoken"]'::jsonb,
  'is spoken', 'Present simple passive: is/are + past participle', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'passive-present';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"The new bridge ___ right now." (passive continuous)',
  '["is building","is being built","has been built","will be built"]'::jsonb,
  'is being built', 'Present continuous passive: is being + past participle', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'passive-present';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'These cars ___ in Japan. (manufacture, present simple passive)',
  NULL,
  'are manufactured|are made', 'Present simple passive: are + past participle', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'passive-present';

-- passive-past exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"The Eiffel Tower ___ in 1889." (passive past simple)',
  '["built","was built","has been built","were built"]'::jsonb,
  'was built', 'Past simple passive: was/were + past participle', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'passive-past';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"Three people ___ in the accident." (perfect passive)',
  '["were injured","have been injured","have injured","are injured"]'::jsonb,
  'have been injured', 'Present perfect passive: have/has been + past participle', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'passive-past';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'The form must ___ before Friday. (complete, modal passive)',
  NULL,
  'be completed', 'Modal passive: modal + be + past participle', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'passive-past';

-- relative-clauses exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"The woman ___ lives next door is a doctor."',
  '["which","whose","who","where"]'::jsonb,
  'who', 'who = for people', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'relative-clauses';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"That is the school ___ I studied." (place)',
  '["that","which","who","where"]'::jsonb,
  'where', 'where = relative clause about a place', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'relative-clauses';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'I met a man ___ daughter is a famous singer.',
  NULL,
  'whose', 'whose = possession (like his/her/their in a relative clause)', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'relative-clauses';

-- reported-speech exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"I am tired." → She said she ___ tired.',
  '["is","was","has been","will be"]'::jsonb,
  'was', 'Present Simple → Past Simple in reported speech', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'reported-speech';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"I will help you." → He said he ___ help me.',
  '["will","would","can","could"]'::jsonb,
  'would', 'will → would in reported speech', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'reported-speech';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  '"Close the door!" → She told me ___ the door.',
  NULL,
  'to close', 'Reported order: told + object + to + base verb', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'reported-speech';

-- gerunds-infinitives exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"I enjoy ___ to music."',
  '["listen","to listen","listening","listened"]'::jsonb,
  'listening', 'enjoy + gerund (-ing)', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'gerunds-infinitives';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"She decided ___ a new job."',
  '["finding","find","to find","found"]'::jsonb,
  'to find', 'decide + infinitive (to + verb)', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'gerunds-infinitives';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'Would you mind ___ (open) the window?',
  NULL,
  'opening', 'mind + gerund (-ing)', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'gerunds-infinitives';

-- present-perfect-continuous exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"She ___ English for five years." (still studying)',
  '["studies","has studied","has been studying","studied"]'::jsonb,
  'has been studying', 'Ongoing duration → present perfect continuous', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'present-perfect-continuous';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"You look muddy! ___ you been doing?"',
  '["What have","What has","What did","What were"]'::jsonb,
  'What have', 'What have you been doing? → present perfect continuous question', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'present-perfect-continuous';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'They ___ (wait) for over an hour!',
  NULL,
  'have been waiting', 'have/has + been + verb-ing', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'present-perfect-continuous';

-- modal-would-might exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"I ___ love to visit New Zealand one day."',
  '["will","would","might","should"]'::jsonb,
  'would', 'Hypothetical wish: would love to', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'modal-would-might';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"She ___ be at home — I''m not sure." (~40% chance)',
  '["will","must","might","should"]'::jsonb,
  'might', 'Low possibility: might', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'modal-would-might';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  '___ you like a cup of tea? (polite offer)',
  NULL,
  'Would', 'Polite offer: Would you like...?', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'modal-would-might';

-- countable-uncountable exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"Could I have some ___?" (advice — uncountable)',
  '["advice","advices","an advice","some advices"]'::jsonb,
  'advice', 'advice is uncountable — no plural, no a/an', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'countable-uncountable';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"There is ___ sugar left." (small amount)',
  '["a few","few","a little","little"]'::jsonb,
  'a little', 'a little = small positive amount (uncountable)', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'countable-uncountable';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'How ___ money do you need? (quantity question, uncountable)',
  NULL,
  'much', 'how much = uncountable; how many = countable', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'countable-uncountable';

-- both-either-neither exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"___ of the films was good." (I watched two, neither was good)',
  '["Both","Either","Neither","None"]'::jsonb,
  'Neither', 'Neither = not one, not the other (negative)', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'both-either-neither';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"You can pay in cash or by card — ___ is fine."',
  '["both","neither","either","all"]'::jsonb,
  'either', 'either = one or the other (choice between two)', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'both-either-neither';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  '___ my parents are teachers. (the two of them)',
  NULL,
  'Both', 'Both = the two (positive)', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'both-either-neither';

-- conditionals-3 exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"If she ___ earlier, she wouldn''t have missed the bus."',
  '["left","would leave","had left","has left"]'::jsonb,
  'had left', 'If-clause in 3rd conditional: Past Perfect', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'conditionals-3';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"He would have got the job if he ___ harder."',
  '["tried","had tried","would try","has tried"]'::jsonb,
  'had tried', 'If-clause: Past Perfect (had + past participle)', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'conditionals-3';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'If I had known, I ___ (tell) you immediately.',
  NULL,
  'would have told', 'Main clause: would have + past participle', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'conditionals-3';

-- mixed-conditionals exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"If I had taken that job, I ___ in Paris now." (past cause → present result)',
  '["would be","would have been","was","will be"]'::jsonb,
  'would be', 'Past cause → present result: would + base verb', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'mixed-conditionals';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"If I ___ more organised, I would have finished yesterday." (present → past)',
  '["was","am","were","have been"]'::jsonb,
  'were', 'Present unreal state → Past Simple in if-clause', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'mixed-conditionals';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'If he ___ (be) braver, he would have spoken up yesterday.',
  NULL,
  'were', 'Present state (unreal): If he were braver (= he is not brave)', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'mixed-conditionals';

-- wish-clauses exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"I wish I ___ the answer." (I don''t know it now)',
  '["know","knew","had known","will know"]'::jsonb,
  'knew', 'Wish about present: Past Simple', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'wish-clauses';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"I wish I ___ harder at school." (regret about the past)',
  '["studied","had studied","study","would study"]'::jsonb,
  'had studied', 'Regret about past: Wish + Past Perfect', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'wish-clauses';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'I wish you ___ (stop) making that noise! (annoying habit)',
  NULL,
  'would stop', 'Wish for change: wish + would + base verb', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'wish-clauses';

-- passive-advanced exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"It ___ that he is very wealthy." (passive reporting)',
  '["says","is said","has said","said"]'::jsonb,
  'is said', 'Passive reporting: It is said/believed/thought that...', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'passive-advanced';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"She ___ her car serviced yesterday." (causative have)',
  '["had","has","got","made"]'::jsonb,
  'had', 'have + object + past participle = causative', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'passive-advanced';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'The announcement ___ before I arrived. (modal perfect passive)',
  NULL,
  'must have been made|should have been made', 'modal + have been + past participle', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'passive-advanced';

-- reported-advanced exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"Where do you live?" → She asked me where I ___.',
  '["live","lived","do live","will live"]'::jsonb,
  'lived', 'Reported wh-question: backshift to Past Simple', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'reported-advanced';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"Are you ready?" → He asked ___ I was ready.',
  '["that","whether","what","which"]'::jsonb,
  'whether', 'Reported yes/no question: if or whether', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'reported-advanced';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  '"Let''s go for a walk." → He suggested ___ for a walk.',
  NULL,
  'going', 'suggest + gerund (-ing)', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'reported-advanced';

-- modal-perfect exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"He ___ the keys — they were in his jacket all along."',
  '["must have lost","can''t have lost","should have lost","might lose"]'::jsonb,
  'can''t have lost', 'Impossible deduction: can''t have + past participle', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'modal-perfect';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"You ___ told me earlier! Now it''s too late." (criticism)',
  '["should have","must have","could have","might have"]'::jsonb,
  'should have', 'Criticism/regret: should have + past participle', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'modal-perfect';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'She looks exhausted — she ___ (work) all night.',
  NULL,
  'must have been working', 'Strong deduction: must have been + verb-ing', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'modal-perfect';

-- inversion exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"Never ___ such a beautiful sunset!"',
  '["I have seen","have I seen","I saw","did I seen"]'::jsonb,
  'have I seen', 'After Never: auxiliary + subject', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'inversion';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"___ I known, I would have acted differently." (conditional inversion)',
  '["Should","Had","Were","If"]'::jsonb,
  'Had', 'Had I known = If I had known (formal)', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'inversion';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'Not only ___ he rude, but he also refused to apologise.',
  NULL,
  'was', 'After Not only: auxiliary/verb comes before subject', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'inversion';

-- participle-clauses exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"___ the danger, she called for help." (because she saw)',
  '["Seeing","Having seen","Seen","To see"]'::jsonb,
  'Seeing', 'Present participle: simultaneous/cause action', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'participle-clauses';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"___ his work, he went home." (after he finished)',
  '["Finishing","Having finished","Finished","Being finished"]'::jsonb,
  'Having finished', 'Perfect participle: action before main verb', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'participle-clauses';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'The book ___ in 1960 is still widely read. (write, passive participle)',
  NULL,
  'written', 'Past participle clause (passive): Written in 1960...', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'participle-clauses';

-- cleft-sentences exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"___ John who called, not Peter."',
  '["This was","It was","That is","There was"]'::jsonb,
  'It was', 'It-cleft: It was + emphasis + who/that', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'cleft-sentences';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"___ I need is a good rest."',
  '["That what","What","Which","It is what"]'::jsonb,
  'What', 'Wh-cleft: What + clause + is/was + emphasis', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'cleft-sentences';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  'It was ___ that she wanted, not fame.',
  NULL,
  'money|love|freedom', 'It-cleft emphasises the focus word after "It was"', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'cleft-sentences';

-- articles-advanced exercises
INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"She was elected ___." (no specific person, just the role)',
  '["the president","a president","president","an president"]'::jsonb,
  'president', 'Role/title without article when used as a complement after be/elect/appoint', 10, 1
FROM "GrammarTopic" t WHERE t.slug = 'articles-advanced';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'MCQ',
  '"I went to ___ school when I was young." (the institution, not a specific building)',
  '["the","a","an","—"]'::jsonb,
  '—', 'No article: go to school/hospital/prison = for the purpose', 10, 2
FROM "GrammarTopic" t WHERE t.slug = 'articles-advanced';

INSERT INTO "GrammarExercise" (topicId, type, prompt, options, answer, hint, points, "order") SELECT
  t.id, 'FILL',
  '___ whale is an endangered species. (generic reference, formal)',
  NULL,
  'The', 'The + singular noun = generic reference (formal)', 10, 3
FROM "GrammarTopic" t WHERE t.slug = 'articles-advanced';
