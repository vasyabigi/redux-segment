import EventTypes from './event/types';
import defaultMapper from './event/configuration';
import { extractIdentifyFields } from './event/identify';
import { extractPageFields } from './event/page';
import { extractTrackFields } from './event/track';
import { extractAliasFields } from './event/alias';
import { extractGroupFields } from './event/group';


function emit(type: string, fields: Array) {
  window.analytics && window.analytics[type](...fields);
}

function createTracker(customMapper) {
  const mapper = Object.assign({}, defaultMapper, customMapper);
  return mapper =>  next => action => handleAction(next, action, mapper);
}

function handleAction(next: Function, action: Object, mapper: Any) {
  if(typeof mapper[action.type] === 'function') Object.assign(action, mapper[action.type]());

  if (action.meta && action.meta.analytics) return handleSpec(next, action);

  return handleActionType(next, action, mapper);
}

function getFields(type: string, fields: Object, actionType: string) {
  const typeFieldHandlers = {
    [EventTypes.identify]: extractIdentifyFields,
    [EventTypes.page]: extractPageFields,
    [EventTypes.track]: eventFields => extractTrackFields(eventFields, actionType),
    [EventTypes.alias]: extractAliasFields,
    [EventTypes.group]: extractGroupFields,
  };

  return typeFieldHandlers[type](fields);
}

function getEventType(spec) {
  if (typeof spec === 'string') {
    return spec;
  }

  return spec.eventType;
}

function handleSpec(next: Function, action: Object) {
  const spec = action.meta.analytics;
  const type = getEventType(spec);
  const fields = getFields(type, spec.eventPayload || {}, action.type);

  emit(type, fields);

  return next(action);
}

function handleActionType(next: Function, action: Object, mapper: Object) {
  const eventType = mapper[action.type];

  eventType && emit(EventTypes[eventType]);

  return next(action);
}


export {
  createTracker,
  EventTypes,
};
