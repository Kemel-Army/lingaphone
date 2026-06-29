// Web Speech API is not part of the TypeScript DOM lib. These names are
// provided by the browser at runtime; declare them loosely so the
// pronunciation-trainer composables typecheck. Kept as `any` deliberately —
// the API surface is small and fully guarded at runtime.
/* eslint-disable @typescript-eslint/no-explicit-any, no-var */
declare type SpeechRecognition = any
declare type SpeechRecognitionEvent = any
declare type SpeechRecognitionErrorEvent = any
declare var SpeechRecognition: any
declare var webkitSpeechRecognition: any
