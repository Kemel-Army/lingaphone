-- ═══════════════════════════════════════════════════════════════
-- Songs Practice Seed — 3 songs (A2 / B1 / B2)
-- ═══════════════════════════════════════════════════════════════

-- ── A2 · Let Her Go (Passenger) ─────────────────────────────────
INSERT INTO "Song" (title, artist, "youtubeId", level, genre, lyrics, vocabulary, "isPublished")
VALUES (
  'Let Her Go',
  'Passenger',
  'RBumgng_BS4',
  'A2', 'pop',
  '[
    {"lineIndex":0,"text":"Well you only need the light when it''s burning low","hasGap":false},
    {"lineIndex":1,"text":"Only miss the ___ when it starts to snow","hasGap":true,"gapAnswer":["sun"],"translation":"Ты скучаешь по солнцу только когда начинается снег"},
    {"lineIndex":2,"text":"Only know you love her when you let her go","hasGap":false},
    {"lineIndex":3,"text":"And you let her go","hasGap":false},
    {"lineIndex":4,"text":"Staring at the bottom of your glass","hasGap":false},
    {"lineIndex":5,"text":"Hoping one day you''ll make a ___","hasGap":true,"gapAnswer":["dream"],"translation":"Надеясь однажды воплотить мечту"},
    {"lineIndex":6,"text":"But dreams come slow and they go so fast","hasGap":false},
    {"lineIndex":7,"text":"You see her when you ___ your eyes","hasGap":true,"gapAnswer":["close"],"translation":"Ты видишь её, когда закрываешь глаза"},
    {"lineIndex":8,"text":"Every little thing she does is right","hasGap":false},
    {"lineIndex":9,"text":"And you know you love her when you let her ___","hasGap":true,"gapAnswer":["go"],"translation":"Ты понимаешь, что любишь её, только когда отпускаешь"}
  ]'::jsonb,
  '[
    {"word":"miss","type":"word","meaning":"скучать (по кому-то)","example":"I miss you so much."},
    {"word":"staring","type":"word","meaning":"смотреть пристально","example":"He was staring at the wall."},
    {"word":"let go","type":"phrase","meaning":"отпустить","example":"It is hard to let go of the past."},
    {"word":"dream","type":"word","meaning":"мечта","example":"Follow your dream."}
  ]'::jsonb,
  true
);

-- ── B1 · Somewhere Only We Know (Keane) ─────────────────────────
INSERT INTO "Song" (title, artist, "youtubeId", level, genre, lyrics, vocabulary, "isPublished")
VALUES (
  'Somewhere Only We Know',
  'Keane',
  'GCKiBO8RI5c',
  'B1', 'indie',
  '[
    {"lineIndex":0,"text":"I walked across an empty land","hasGap":false},
    {"lineIndex":1,"text":"I knew the pathway like the back of my ___","hasGap":true,"gapAnswer":["hand"],"translation":"Я знал эту тропу как свои пять пальцев"},
    {"lineIndex":2,"text":"I felt the earth beneath my feet","hasGap":false},
    {"lineIndex":3,"text":"Sat by the river and it made me ___","hasGap":true,"gapAnswer":["complete"],"translation":"Сел у реки — и почувствовал себя целым"},
    {"lineIndex":4,"text":"Oh, simple thing, where have you gone?","hasGap":false},
    {"lineIndex":5,"text":"I''m getting old and I need something to rely ___","hasGap":true,"gapAnswer":["on"],"translation":"Я старею и мне нужно на что-то опереться"},
    {"lineIndex":6,"text":"And if you have a minute why don''t we go","hasGap":false},
    {"lineIndex":7,"text":"Talk about it somewhere only we ___","hasGap":true,"gapAnswer":["know"],"translation":"Поговорим об этом в нашем особом месте"},
    {"lineIndex":8,"text":"And if I''m flying solo at least I''m flying ___","hasGap":true,"gapAnswer":["free"],"translation":"Если я лечу в одиночку — хотя бы я свободен"},
    {"lineIndex":9,"text":"To those who''d ground me take a message back from me","hasGap":false}
  ]'::jsonb,
  '[
    {"word":"pathway","type":"word","meaning":"тропинка, путь","example":"Follow the pathway through the forest."},
    {"word":"like the back of my hand","type":"idiom","meaning":"как свои пять пальцев","example":"I know this city like the back of my hand."},
    {"word":"rely on","type":"phrase","meaning":"полагаться на кого-то","example":"You can always rely on her."},
    {"word":"ground","type":"word","meaning":"здесь: сдерживать, не давать летать","example":"Nothing can ground my spirit."},
    {"word":"solo","type":"word","meaning":"в одиночку","example":"She travelled solo across Europe."}
  ]'::jsonb,
  true
);

-- ── B2 · The Scientist (Coldplay) ────────────────────────────────
INSERT INTO "Song" (title, artist, "youtubeId", level, genre, lyrics, vocabulary, "isPublished")
VALUES (
  'The Scientist',
  'Coldplay',
  'RB-RcX5DS5A',
  'B2', 'rock',
  '[
    {"lineIndex":0,"text":"Come up to meet you, tell you I''m ___","hasGap":true,"gapAnswer":["sorry"],"translation":"Я пришёл сказать тебе, что сожалею"},
    {"lineIndex":1,"text":"You don''t know how lovely you are","hasGap":false},
    {"lineIndex":2,"text":"I had to find you, tell you I need you","hasGap":false},
    {"lineIndex":3,"text":"Tell you I set you ___","hasGap":true,"gapAnswer":["apart"],"translation":"Сказать тебе, что ты для меня особенная"},
    {"lineIndex":4,"text":"Nobody said it was easy","hasGap":false},
    {"lineIndex":5,"text":"It''s such a shame for us to ___","hasGap":true,"gapAnswer":["part"],"translation":"Как жаль, что нам пришлось расстаться"},
    {"lineIndex":6,"text":"Nobody said it was easy","hasGap":false},
    {"lineIndex":7,"text":"No one ever said it would be this ___","hasGap":true,"gapAnswer":["hard"],"translation":"Никто не говорил, что будет так тяжело"},
    {"lineIndex":8,"text":"Oh take me back to the ___","hasGap":true,"gapAnswer":["start"],"translation":"О, унеси меня обратно к началу"},
    {"lineIndex":9,"text":"I was just guessing at numbers and figures","hasGap":false},
    {"lineIndex":10,"text":"Pulling your ___","hasGap":true,"gapAnswer":["puzzles"],"translation":"Разгадывая твои загадки"},
    {"lineIndex":11,"text":"The science of silence delights me","hasGap":false}
  ]'::jsonb,
  '[
    {"word":"set apart","type":"phrase","meaning":"выделять, считать особенным","example":"Her talent sets her apart from the rest."},
    {"word":"shame","type":"word","meaning":"стыд; жалость","example":"What a shame you could not come."},
    {"word":"part","type":"word","meaning":"здесь: расстаться","example":"It was hard to part after so many years."},
    {"word":"guessing","type":"word","meaning":"догадываться, угадывать","example":"Stop guessing and tell me the truth."},
    {"word":"delights","type":"word","meaning":"восхищает, доставляет удовольствие","example":"Her singing delights everyone in the room."}
  ]'::jsonb,
  true
);
