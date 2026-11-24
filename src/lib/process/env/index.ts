/**
 * Moteur déclaratif d'initialisation et validation d'environnement.
 */

export type {
  EnvEngineContext,
  EnvValidator,
  EnvSchema,
  EnvEngineResult,
  EnvFieldType,
  EnvFieldDescriptor,
  BaseEnvFieldDescriptor,
  StringEnvFieldDescriptor,
  NumberEnvFieldDescriptor,
  BooleanEnvFieldDescriptor,
  EnumEnvFieldDescriptor,
  ExecutableEnvFieldDescriptor,
} from './env.types.js';

export { EnvLoadError, EnvValidationError } from './env.types.js';

export {
  validateFieldDescriptor,
  requireString,
  optionalString,
  optionalNumber,
  optionalEnum,
  optionalBoolean,
  requireExecutablePath,
  optionalExecutablePath,
} from './env.validators.js';

export { initializeAndConfirmEnvironment, type InitializeEnvEngineOptions } from './env.engine.js';

export {
  resolveWorkspacePath,
  resolveAgentsDir,
  resolveAgentsLayout,
  resolveCursorCliBin,
  resolveAntigravityCliBin,
  resolveCodexCliBin,
  resolveClaudeCliBin,
  resolveAntigravityProbeTimeout,
  resolveCodexProbeTimeout,
  resolveClaudeProbeTimeout,
  resolveCallScenarioMaxDepth,
  type AgentsLayout,
} from './env.layout.js';
