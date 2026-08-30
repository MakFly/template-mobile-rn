# Project instructions

## Assistant composer on iOS

`src/features/assistant/components/ThreadComposer.tsx` uses
`ComposerPrimitive.Input`, which is a controlled React Native `TextInput`.
Keep these props on the main composer input:

```tsx
autoCorrect={false}
spellCheck={false}
smartInsertDelete={false}
```

They are intentional. iOS autocorrection/predictive text can race with the
controlled value update and leave the caret behind the displayed text, causing
new characters to be inserted in the middle of a word. Do not remove these
props without retesting rapid typing on an iOS simulator and a physical device.

The related `/v1/threads` network errors are a separate API availability issue;
they must not be treated as the fix for composer caret lag.
