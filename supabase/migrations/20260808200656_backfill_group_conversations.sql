-- Групповой чат (kind='GROUP') уже поддерживается схемой Conversation
-- (kind/groupId/participantIds, RLS на ANY(participantIds)), но им никто
-- не пользовался. Бэкфилл: создаём один GROUP-чат на каждую существующую
-- активную группу — преподаватель + все ученики со статусом ACTIVE.
-- Дальнейшая синхронизация участников (при добавлении/удалении ученика)
-- выполняется приложением через server/api/admin/groups/[id]/sync-conversation.

INSERT INTO "Conversation" ("kind", "groupId", "participantIds")
SELECT
  'GROUP',
  g."id",
  array_remove(
    array_agg(DISTINCT participant_user_id),
    NULL
  )
FROM "Group" g
JOIN "Teacher" t ON t."id" = g."teacherId"
LEFT JOIN "GroupMember" gm ON gm."groupId" = g."id" AND gm."status" = 'ACTIVE'
LEFT JOIN "Student" s ON s."id" = gm."studentId"
CROSS JOIN LATERAL (
  VALUES (t."userId"), (s."userId")
) AS participants(participant_user_id)
WHERE g."archivedAt" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "Conversation" c WHERE c."groupId" = g."id"
  )
GROUP BY g."id";
