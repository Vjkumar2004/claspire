
export const getConversationId = (id1: string, id2: string) => {
  return [id1, id2].sort().join('_');
};
