// Public definitions are data, never executable programs. Keep these limits
// shared by authoring, installation and publication.
export const DEFINITION_LIMITS = Object.freeze({
  maxBytes: 250000, maxDepth: 24, maxNodes: 12000, maxString: 10000,
  entities: 12, fields: 40, sections: 32, rules: 64, actions: 64,
  states: 32, transitions: 128, options: 100, effects: 16,
});
const forbidden = new Set(["__proto__", "prototype", "constructor"]);
const keyPattern = /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/;
const plain = value => value !== null && typeof value === "object" && !Array.isArray(value);

export function validateDefinitionData(definition, vocabulary, options = {}) {
  const limits = { ...DEFINITION_LIMITS, maxBytes: Math.min(options.maxBytes || DEFINITION_LIMITS.maxBytes, DEFINITION_LIMITS.maxBytes) };
  const errors = [];
  const seen = new WeakSet();
  let nodes = 0;
  function walk(value, path, depth) {
    if (++nodes > limits.maxNodes || depth > limits.maxDepth) { errors.push(`${path}: estrutura excede o limite`); return; }
    if (typeof value === "string" && value.length > limits.maxString) errors.push(`${path}: texto longo demais`);
    if (["function", "symbol", "bigint", "undefined"].includes(typeof value) || (typeof value === "number" && !Number.isFinite(value))) errors.push(`${path}: somente valores JSON são permitidos`);
    if (!value || typeof value !== "object") return;
    if (seen.has(value)) { errors.push(`${path}: referências circulares não são permitidas`); return; }
    if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) { errors.push(`${path}: objeto não serializável`); return; }
    seen.add(value);
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string" || forbidden.has(key)) { errors.push(`${path}: chave não permitida`); continue; }
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !Object.hasOwn(descriptor, "value")) { errors.push(`${path}: acesso executável não permitido`); continue; }
      if (Array.isArray(value) && key === "length") continue;
      walk(descriptor.value, `${path}.${key}`, depth + 1);
      if (nodes > limits.maxNodes) break;
    }
    seen.delete(value);
  }
  if (!plain(definition)) return { valid: false, errors: ["A definição precisa ser um objeto."] };
  walk(definition, "definition", 0);
  if (errors.length) return { valid: false, errors };
  const bytes = new TextEncoder().encode(JSON.stringify(definition)).length;
  if (bytes > limits.maxBytes) errors.push("A definição excede o tamanho permitido.");
  function array(value, path, max) {
    if (value === undefined) return [];
    if (!Array.isArray(value)) { errors.push(`${path} deve ser uma lista`); return []; }
    if (value.length > max) errors.push(`${path} excede ${max} itens`);
    return value.slice(0, max);
  }
  const protocol = definition.protocol;
  if (protocol !== undefined && protocol !== null && !plain(protocol)) errors.push("protocol deve ser um objeto");
  const entities = plain(protocol?.entities) ? protocol.entities : {};
  if (protocol) {
    if (protocol.schemaVersion !== 1) errors.push("protocol.schemaVersion incompatível");
    if (!plain(protocol.entities)) errors.push("protocol.entities deve ser um objeto");
    if (Object.keys(entities).length > limits.entities) errors.push("Há coleções demais");
  }
  const fieldsByEntity = new Map();
  const statesByEntity = new Map();
  for (const [id, entity] of Object.entries(entities)) {
    if (!keyPattern.test(id) || forbidden.has(id) || !plain(entity)) { errors.push(`Coleção inválida: ${id}`); continue; }
    const keys = new Set(["status", "completed", "createdAt", "updatedAt", "completedAt", "scheduledAt"]);
    const ownKeys = new Set();
    for (const field of array(entity.fields, `${id}.fields`, limits.fields)) {
      if (!plain(field)) { errors.push(`Campo inválido em ${id}`); continue; }
      const key = field.key || field.id;
      if (!keyPattern.test(key || "") || forbidden.has(key) || ownKeys.has(key)) errors.push(`Campo inválido ou repetido: ${id}.${key}`);
      ownKeys.add(key); keys.add(key);
      if (!vocabulary.fields.includes(field.type)) errors.push(`Tipo de campo desconhecido: ${field.type}`);
      if (["select", "multi-select"].includes(field.type)) {
        if (!field.optionsFromProperty && !Array.isArray(field.options)) errors.push(`Campo ${key} precisa de opções`);
        array(field.options, `${id}.${key}.options`, limits.options);
      }
      if (field.type === "url" && field.default && !/^https?:\/\//i.test(field.default)) errors.push(`URL inválida em ${id}.${key}`);
    }
    if (entity.primaryField && !ownKeys.has(entity.primaryField)) errors.push(`Campo principal inexistente: ${id}`);
    fieldsByEntity.set(id, keys);
    const stateNames = new Set();
    for (const state of array(entity.states, `${id}.states`, limits.states)) {
      const name = typeof state === "string" ? state : state?.id || state?.label;
      if (!name || stateNames.has(name)) errors.push(`Estado inválido ou repetido em ${id}`);
      stateNames.add(name);
      if (state?.label) stateNames.add(state.label);
    }
    statesByEntity.set(id, stateNames);
    for (const transition of array(entity.transitions, `${id}.transitions`, limits.transitions)) {
      if (!plain(transition) || !stateNames.has(transition.to)) errors.push(`Destino inválido em ${id}.transitions`);
      for (const from of Array.isArray(transition?.from) ? transition.from : [transition?.from])
        if (from !== "*" && !stateNames.has(from)) errors.push(`Origem inválida em ${id}.transitions`);
    }
  }
  function condition(value, path, entityId, depth = 0) {
    if (value === undefined) return;
    if (!plain(value) || depth > 8) { errors.push(`${path}: condição inválida`); return; }
    const allowedKeys = ["all", "any", "event", "entity", "field", "operator", "value", "values", "statuses", "property", "count", "source", "actionId"];
    for (const key of Object.keys(value)) if (!allowedKeys.includes(key)) errors.push(`${path}: condição desconhecida ${key}`);
    for (const combinator of ["all", "any"])
      for (const child of array(value[combinator], `${path}.${combinator}`, limits.effects)) condition(child, path, value.entity || entityId, depth + 1);
    if (value.operator && !vocabulary.operators.includes(value.operator)) errors.push(`${path}: operador desconhecido`);
    const target = value.entity || entityId;
    if (target && !entities[target]) errors.push(`${path}: coleção desconhecida`);
    if (target && value.field && !fieldsByEntity.get(target)?.has(value.field)) errors.push(`${path}: campo desconhecido ${value.field}`);
  }
  function effects(list, path, inheritedEntity) {
    for (const effect of array(list, path, limits.effects)) {
      if (!plain(effect) || !vocabulary.commands.includes(effect.type)) { errors.push(`${path}: consequência desconhecida`); continue; }
      if (["complete_action", "postpone_action", "dismiss_action"].includes(effect.type)) errors.push(`${path}: ações não podem invocar ações recursivamente`);
      const entityId = effect.entity || inheritedEntity;
      if (entityId && !entities[entityId]) errors.push(`${path}: coleção desconhecida`);
      if (effect.field && entityId && !fieldsByEntity.get(entityId)?.has(effect.field)) errors.push(`${path}: campo inexistente ${effect.field}`);
      if (effect.days !== undefined && (!Number.isFinite(effect.days) || effect.days < 0 || effect.days > 3650)) errors.push(`${path}: intervalo inválido`);
      condition(effect.when, `${path}.when`, entityId);
    }
  }
  for (const command of array(protocol?.commands, "protocol.commands", vocabulary.commands.length)) if (!vocabulary.commands.includes(command)) errors.push(`Comando desconhecido: ${command}`);
  const actionIds = new Set();
  for (const action of array(protocol?.actions, "protocol.actions", limits.actions)) {
    if (!plain(action) || !keyPattern.test(action.id || "") || actionIds.has(action.id)) { errors.push("Ação inválida ou repetida"); continue; }
    actionIds.add(action.id);
    if (action.entity && !entities[action.entity]) errors.push(`Ação ${action.id}: coleção desconhecida`);
    if (action.dueField && !fieldsByEntity.get(action.entity)?.has(action.dueField)) errors.push(`Ação ${action.id}: data inexistente`);
    for (const op of array(action.operations, `${action.id}.operations`, 4)) if (!["open", "complete", "postpone", "dismiss"].includes(op)) errors.push(`Ação ${action.id}: operação desconhecida`);
    condition(action.when, `${action.id}.when`, action.entity);
    effects(action.complete, `${action.id}.complete`, action.entity);
    for (const field of array(action.completionFields, `${action.id}.completionFields`, limits.fields)) if (!fieldsByEntity.get(action.entity)?.has(field.key || field.id)) errors.push(`Ação ${action.id}: campo de retorno inexistente`);
  }
  for (const rule of array(protocol?.rules, "protocol.rules", limits.rules)) {
    if (!plain(rule)) { errors.push("Regra inválida"); continue; }
    condition(rule.when, "rule.when", rule.entity);
    effects(rule.then, "rule.then", rule.when?.entity || rule.entity);
  }
  if (definition.experience !== undefined && definition.experience !== null) {
    if (!plain(definition.experience)) errors.push("experience deve ser um objeto");
    for (const section of array(definition.experience.layout, "experience.layout", limits.sections)) {
      if (!plain(section) || !vocabulary.sections.includes(section.type)) { errors.push("Tipo de seção desconhecido"); continue; }
      if (section.entity && !entities[section.entity]) errors.push("Seção aponta para coleção inexistente");
      condition(section.visibleWhen, "section.visibleWhen", section.entity);
      condition(section.filter, "section.filter", section.entity);
    }
  }
  return { valid: errors.length === 0, errors };
}
