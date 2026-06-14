export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  let dirty = false;

  // Find CallExpressions where the callee is a MemberExpression with property 'map' or 'filter'
  root.find(j.CallExpression, {
    callee: {
      type: 'MemberExpression',
      property: {
        type: 'Identifier',
      }
    }
  }).forEach(path => {
    const propName = path.node.callee.property.name;
    if ((propName === 'map' || propName === 'filter') && !path.node.callee.optional) {
      // Add optional chaining flag
      path.node.callee.optional = true;
      
      // If it's a CallExpression, jscodeshift expects OptionalCallExpression for `?.()` 
      // but the `?.map` part is an OptionalMemberExpression.
      
      // We just need to transform the MemberExpression into an OptionalMemberExpression
      const memberExpr = path.node.callee;
      const newCallee = j.optionalMemberExpression(
        memberExpr.object,
        memberExpr.property,
        memberExpr.computed
      );
      
      // And the CallExpression into an OptionalCallExpression
      const newCall = j.optionalCallExpression(
        newCallee,
        path.node.arguments
      );
      
      j(path).replaceWith(newCall);
      dirty = true;
    }
  });

  return dirty ? root.toSource() : null;
}
