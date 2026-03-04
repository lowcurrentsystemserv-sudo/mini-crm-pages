export const state = {
  user: null,          // { name, role }
  token: null,

  objects: [],         // Objects rows
  objectsMap: {},      // { [objectId]: object }

  plannedObjects: [],  // used by master search (we use Objects)
  selectedObject: null,

  requests: [],
  plan: [],
  visitsLog: [],
};