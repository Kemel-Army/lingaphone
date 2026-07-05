-- ══════════════════════════════════════════════════════════════════
-- Fix: чтение геймификации учеником через RLS
--
-- auth.uid() (id из auth.users) НЕ равен public."User".id — связь идёт
-- через User.authId. Поэтому политики, сверяющие сырой auth.uid() с
-- Student.userId, никогда не срабатывали: ученик не видел свой игровой
-- профиль (баланс кристаллов/уровень показывались как 0/1), инвентарь и
-- историю кристаллов.
--
-- Канонический способ (как в XpLog и пр.) — хелпер get_current_student_id(),
-- который джойнит User по authId = auth.uid(). Возвращает только id самого
-- вызывающего ученика, поэтому чужие данные остаются недоступны.
-- ══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "student_select_own_game_profile" ON "StudentGameProfile";
CREATE POLICY "student_select_own_game_profile" ON "StudentGameProfile"
  FOR SELECT USING ("studentId" = public.get_current_student_id());

DROP POLICY IF EXISTS "student_select_own_inventory" ON "StudentInventory";
CREATE POLICY "student_select_own_inventory" ON "StudentInventory"
  FOR SELECT USING ("studentId" = public.get_current_student_id());

DROP POLICY IF EXISTS "student_select_own_gem_tx" ON "GemTransaction";
CREATE POLICY "student_select_own_gem_tx" ON "GemTransaction"
  FOR SELECT USING ("studentId" = public.get_current_student_id());
