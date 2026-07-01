import type { Component } from 'vue'
import type { LayerType } from '~/entities/learning-path'
import HookLayer from './HookLayer.vue'
import DiagnosticLayer from './DiagnosticLayer.vue'
import IntuitionLayer from './IntuitionLayer.vue'
import ExplanationLayer from './ExplanationLayer.vue'
import FormalizationLayer from './FormalizationLayer.vue'
import WalkthroughLayer from './WalkthroughLayer.vue'
import TrainerLayer from './TrainerLayer.vue'
import ScenarioLayer from './ScenarioLayer.vue'
import TrapsLayer from './TrapsLayer.vue'
import TeachBackLayer from './TeachBackLayer.vue'
import MasteryCheckLayer from './MasteryCheckLayer.vue'

/**
 * Maps a CapsuleLayer's layerType to its Vue renderer.
 * All 11 layers of the capsule pipeline are implemented.
 */
export const LAYER_COMPONENTS: Partial<Record<LayerType, Component>> = {
  HOOK: HookLayer,
  DIAGNOSTIC: DiagnosticLayer,
  INTUITION: IntuitionLayer,
  EXPLANATION: ExplanationLayer,
  FORMALIZATION: FormalizationLayer,
  WALKTHROUGH: WalkthroughLayer,
  TRAINER: TrainerLayer,
  SCENARIO: ScenarioLayer,
  TRAPS: TrapsLayer,
  TEACH_BACK: TeachBackLayer,
  MASTERY_CHECK: MasteryCheckLayer
}

export {
  HookLayer,
  DiagnosticLayer,
  IntuitionLayer,
  ExplanationLayer,
  FormalizationLayer,
  WalkthroughLayer,
  TrainerLayer,
  ScenarioLayer,
  TrapsLayer,
  TeachBackLayer,
  MasteryCheckLayer
}
